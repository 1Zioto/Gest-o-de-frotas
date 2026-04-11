/**
 * modules/auth/register.ts
 * Lógica de cadastro de novo usuário.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash } from 'crypto';
import { ensureAuthDbInitialized, getDb } from '../../server/db.js';

export async function handleRegister(
  _req: VercelRequest,
  res: VercelResponse,
  body: Record<string, unknown>
): Promise<VercelResponse> {
  const email = ((body['email'] ?? body['login']) as string) || '';
  const password = (body['password'] as string) || '';
  const nome = (body['nome'] as string) || '';
  const tipo = (body['tipo'] as string) || 'operador';

  if (!email || !password || !nome) {
    return res.status(400).json({ error: 'Campos obrigatórios: nome, email e password.' });
  }

  try {
    await ensureAuthDbInitialized();
  } catch (error) {
    return res.status(500).json({
      error: 'Erro ao conectar ao banco de dados.',
      detail: error instanceof Error ? error.message : 'unknown',
    });
  }

  const sql = getDb();

  try {
    const hashedPassword = await hashPassword(password);
    await sql`
      INSERT INTO users (nome, email, senha_hash, perfil, ativo)
      VALUES (${nome}, ${email}, ${hashedPassword}, ${tipo}, true)
    `;
    return res.status(201).json({ message: 'Usuário criado com sucesso.' });
  } catch (error: unknown) {
    console.error('[auth/register] error:', error);
    const msg = error instanceof Error ? error.message.toLowerCase() : '';
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return res.status(409).json({ error: 'Email já cadastrado.' });
    }
    return res.status(500).json({
      error: 'Erro interno ao registrar usuário.',
      detail: error instanceof Error ? error.message : 'unknown',
    });
  }
}

async function hashPassword(password: string): Promise<string> {
  try {
    const { hash } = await import('bcryptjs');
    return hash(password, 10);
  } catch {
    return createHash('sha256').update(password).digest('hex');
  }
}
