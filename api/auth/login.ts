import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash, createHmac } from 'crypto';
import { ensureAuthDbInitialized, getDb } from '../../server/db.js';

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

  if (hash.startsWith('$2a$') || hash.startsWith('$2b$')) {
    const bcrypt = await import('bcryptjs');
    return bcrypt.compare(password, hash);
  }

  if (/^[a-f0-9]{64}$/i.test(hash)) {
    return sha256Hash(password) === hash;
  }

  return password === hash;
}

async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, 10);
}

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido.' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const email = body?.email?.trim()?.toLowerCase();
  const password = body?.password;

  if (!email || !password) {
    return res.status(400).json({ message: 'Informe e-mail e senha.' });
  }

  try {
    await ensureAuthDbInitialized();
    const sql = getDb();

    const users = await sql`
      SELECT id, nome, email, senha_hash, perfil, ativo
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;

    const user = users[0];

    if (!user || !user['ativo']) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    const passwordOk = await verifyPassword(password, String(user['senha_hash'] || ''));
    if (!passwordOk) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    if (!/^\$2[abxy]\$/.test(String(user['senha_hash'] || ''))) {
      const newHash = await hashPassword(password);
      await sql`
        UPDATE users
        SET senha_hash = ${newHash}, atualizado_em = NOW()
        WHERE id = ${user['id'] as string}
      `;
    } else {
      await sql`
        UPDATE users
        SET atualizado_em = NOW()
        WHERE id = ${user['id'] as string}
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
    console.error('[auth/login] error:', error);
    return res.status(500).json({
      message: 'Erro interno no login.',
      detail: error instanceof Error ? error.message : 'unknown'
    });
  }
}
