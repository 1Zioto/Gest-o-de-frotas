import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash, createHmac } from 'crypto';
import bcrypt from 'bcryptjs';
import { ensureAuthDbInitialized, getDb } from '../server/db.js';

const JWT_SECRET = process.env['JWT_SECRET'] || 'gestao-frotas-secret-2024';

function base64url(value: string): string {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function signJwt(payload: Record<string, unknown>, secret: string, expiresInSeconds = 8 * 3600): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds
    })
  );
  const signature = createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${header}.${body}.${signature}`;
}

function sha256Hash(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash) return false;

  if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
    return bcrypt.compare(password, hash);
  }

  if (/^[a-f0-9]{64}$/i.test(hash)) {
    return sha256Hash(password) === hash;
  }

  return password === hash;
}

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

type UserShape = {
  id: string;
  nome: string;
  email: string;
  senha_hash: string;
  perfil: string;
  ativo: boolean;
  updateMode: 'modern' | 'legacy' | 'none';
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const email = body?.email?.trim()?.toLowerCase();
    const password = body?.password;

    if (!email || !password) {
      return res.status(400).json({ message: 'Informe e-mail e senha.' });
    }

    await ensureAuthDbInitialized();
    const sql = getDb();

    const userColumns = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users'
    `;
    const columns = new Set(userColumns.map(column => String(column['column_name'])));

    let user: UserShape | undefined;

    if (columns.has('email') && columns.has('senha_hash')) {
      const users = columns.has('id')
        ? await sql`
            SELECT
              COALESCE(id::text, email) AS id,
              COALESCE(nome, email, 'Usuário') AS nome,
              email,
              senha_hash,
              COALESCE(perfil, 'operador') AS perfil,
              COALESCE(ativo, TRUE) AS ativo
            FROM users
            WHERE email = ${email}
            LIMIT 1
          `
        : await sql`
            SELECT
              email AS id,
              COALESCE(nome, email, 'Usuário') AS nome,
              email,
              senha_hash,
              COALESCE(perfil, 'operador') AS perfil,
              COALESCE(ativo, TRUE) AS ativo
            FROM users
            WHERE email = ${email}
            LIMIT 1
          `;
      const row = users[0];
      user = row ? {
        id: String(row['id']),
        nome: String(row['nome']),
        email: String(row['email']),
        senha_hash: String(row['senha_hash'] || ''),
        perfil: String(row['perfil'] || 'operador'),
        ativo: Boolean(row['ativo']),
        updateMode: 'modern'
      } : undefined;
    } else if (columns.has('login') && columns.has('password')) {
      const users = columns.has('id')
        ? await sql`
            SELECT
              COALESCE(id::text, login) AS id,
              COALESCE(nome, login, 'Usuário') AS nome,
              login AS email,
              password AS senha_hash,
              COALESCE(tipo, 'operador') AS perfil,
              COALESCE(ativo, TRUE) AS ativo
            FROM users
            WHERE login = ${email}
            LIMIT 1
          `
        : columns.has('iduser')
          ? await sql`
              SELECT
                COALESCE(iduser::text, login) AS id,
                COALESCE(nome, login, 'Usuário') AS nome,
                login AS email,
                password AS senha_hash,
                COALESCE(tipo, 'operador') AS perfil,
                COALESCE(ativo, TRUE) AS ativo
              FROM users
              WHERE login = ${email}
              LIMIT 1
            `
          : await sql`
              SELECT
                login AS id,
                COALESCE(nome, login, 'Usuário') AS nome,
                login AS email,
                password AS senha_hash,
                COALESCE(tipo, 'operador') AS perfil,
                COALESCE(ativo, TRUE) AS ativo
              FROM users
              WHERE login = ${email}
              LIMIT 1
            `;
      const row = users[0];
      user = row ? {
        id: String(row['id']),
        nome: String(row['nome']),
        email: String(row['email']),
        senha_hash: String(row['senha_hash'] || ''),
        perfil: String(row['perfil'] || 'operador'),
        ativo: Boolean(row['ativo']),
        updateMode: 'legacy'
      } : undefined;
    } else {
      throw new Error('Tabela users sem colunas compatíveis de autenticação.');
    }

    if (!user || !user['ativo']) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    const passwordOk = await verifyPassword(password, user['senha_hash']);
    if (!passwordOk) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    if (user.updateMode === 'modern' && !/^\$2[abxy]\$/.test(user['senha_hash'])) {
      const newHash = await bcrypt.hash(password, 10);
      await sql`
        UPDATE users
        SET senha_hash = ${newHash}, atualizado_em = NOW()
        WHERE email = ${email}
      `;
    } else if (user.updateMode === 'modern') {
      await sql`
        UPDATE users
        SET atualizado_em = NOW()
        WHERE email = ${email}
      `;
    }

    const token = signJwt(
      {
        id: user['id'],
        nome: user['nome'],
        email: user['email'],
        perfil: user['perfil']
      },
      JWT_SECRET
    );

    return res.status(200).json({
      token,
      user: {
        id: user['id'],
        nome: user['nome'],
        email: user['email'],
        perfil: user['perfil']
      }
    });
  } catch (error) {
    console.error('[auth-login] error:', error);
    return res.status(500).json({
      message: 'Erro interno no login.',
      detail: error instanceof Error ? error.message : 'unknown'
    });
  }
}
