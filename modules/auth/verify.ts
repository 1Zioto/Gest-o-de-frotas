/**
 * modules/auth/verify.ts
 * Valida um JWT e retorna o payload do usuário.
 * GET /api/auth?action=verify   Authorization: Bearer <token>
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac } from 'crypto';

const JWT_SECRET = process.env['JWT_SECRET'] || 'gestao-frotas-secret-2024';

export function handleVerify(req: VercelRequest, res: VercelResponse): VercelResponse {
  if (req.query['action'] !== 'verify') {
    return res.status(400).json({ error: 'Parâmetro inválido. Use ?action=verify' });
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  try {
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    const payload = verifyJwt(token, JWT_SECRET);
    return res.status(200).json({ valid: true, user: payload });
  } catch (error) {
    console.error('[auth/verify] error:', error);
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

function verifyJwt(token: string, secret: string): Record<string, unknown> {
  const [header, body, signature] = token.split('.');
  if (!header || !body || !signature) throw new Error('Token malformado');

  const expected = createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  if (signature !== expected) throw new Error('Assinatura inválida');

  const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as Record<string, unknown>;

  if (typeof payload['exp'] === 'number' && payload['exp'] < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expirado');
  }

  return payload;
}
