/**
 * modules/auth/login.ts
 * Lógica de autenticação (login).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash, createHmac } from 'crypto';
import { ensureAuthDbInitialized, getDb } from '../../server/db.js';

const JWT_SECRET = process.env['JWT_SECRET'] || 'gestao-frotas-secret-2024';

export async function handleLogin(
  _req: VercelRequest,
  res: VercelResponse,
  body: Record<string, unknown>
): Promise<VercelResponse> {
  // Aceita { login, password } (legado) ou { email, password } (frontend novo)
  const email = ((body['email'] ?? body['login']) as string) || '';
  const password = (body['password'] as string) || '';

  if (!email || !password) {
    return res.status(400).json({ error: 'Campos obrigatórios: email e password.' });
  }

  try {
    await ensureAuthDbInitialized();
  } catch (error) {
    console.error('[auth/login] DB init error:', error);
    return res.status(500).json({
      error: 'Erro ao conectar ao banco de dados.',
      detail: error instanceof Error ? error.message : 'unknown',
    });
  }

  const sql = getDb();

  try {
    const users = await sql`
      SELECT id, nome, email, senha_hash, perfil, ativo
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;

    if (users.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const user = users[0];

    if (!user['ativo']) {
      return res.status(401).json({ error: 'Usuário inativo. Contate o administrador.' });
    }

    const valid = await verifyPassword(password, String(user['senha_hash'] ?? ''));
    if (!valid) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // Faz upgrade silencioso de hash legado para bcrypt
    if (!/^\$2[ab]\$/.test(String(user['senha_hash'] ?? ''))) {
      const newHash = await hashPassword(password);
      await sql`UPDATE users SET senha_hash = ${newHash}, atualizado_em = NOW() WHERE id = ${user['id'] as string}`;
    } else {
      await sql`UPDATE users SET atualizado_em = NOW() WHERE id = ${user['id'] as string}`;
    }

    const token = signJwt(
      { id: user['id'], login: user['email'], nome: user['nome'], tipo: user['perfil'] },
      JWT_SECRET
    );

    return res.status(200).json({
      token,
      user: {
        id: user['id'],
        idUser: user['id'],
        nome: user['nome'],
        login: user['email'],
        tipo: user['perfil'],
      },
    });
  } catch (error) {
    console.error('[auth/login] error:', error);
    return res.status(500).json({
      error: 'Erro interno no login.',
      detail: error instanceof Error ? error.message : 'unknown',
    });
  }
}

// ─── Helpers internos ────────────────────────────────────────────────────────

function base64url(str: string): string {
  return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function signJwt(
  payload: Record<string, unknown>,
  secret: string,
  expiresInSeconds = 8 * 3600
): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(
    JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + expiresInSeconds })
  );
  const sig = createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${header}.${body}.${sig}`;
}

function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  try {
    const { compare } = await import('bcryptjs');
    if (hash.startsWith('$2b$') || hash.startsWith('$2a$')) return compare(password, hash);
  } catch { /* bcryptjs indisponível */ }
  if (/^[a-f0-9]{64}$/i.test(hash)) return sha256(password) === hash;
  return password === hash;
}

async function hashPassword(password: string): Promise<string> {
  try {
    const { hash } = await import('bcryptjs');
    return hash(password, 10);
  } catch {
    return sha256(password);
  }
}
