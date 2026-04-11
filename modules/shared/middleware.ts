/**
 * modules/shared/middleware.ts
 * Middleware de autenticação JWT e helpers compartilhados.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac } from 'crypto';
import { setCorsHeaders } from './cors.js';
import { ensureCoreDbInitialized } from '../../server/db.js';

const JWT_SECRET = process.env['JWT_SECRET'] || 'gestao-frotas-secret-2024';

export interface AuthenticatedRequest extends VercelRequest {
  user?: {
    id: string;
    login: string;
    nome: string;
    tipo: string;
  };
}

export type RouteHandler = (
  req: AuthenticatedRequest,
  res: VercelResponse
) => Promise<VercelResponse | void>;

/**
 * Wrapper que valida o JWT antes de chamar o handler protegido.
 * Também injeta os headers CORS e trata OPTIONS automaticamente.
 */
export function withAuth(handler: RouteHandler) {
  return async (req: AuthenticatedRequest, res: VercelResponse) => {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') return res.status(200).end();

    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ error: 'Token não fornecido.' });
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    try {
      const payload = verifyJwt(token, JWT_SECRET);
      req.user = payload as AuthenticatedRequest['user'];
    } catch {
      return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }

    try {
      await ensureCoreDbInitialized();
      return await handler(req, res);
    } catch (error) {
      console.error('[handler error]', error);
      return res.status(500).json({
        error: 'Erro interno do servidor.',
        detail: error instanceof Error ? error.message : 'unknown',
      });
    }
  };
}

function verifyJwt(token: string, secret: string): Record<string, unknown> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Token malformado');

  const [header, body, signature] = parts;

  const expected = createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  if (signature !== expected) throw new Error('Assinatura inválida');

  const payload = JSON.parse(
    Buffer.from(body, 'base64url').toString()
  ) as Record<string, unknown>;

  if (typeof payload['exp'] === 'number' && payload['exp'] < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expirado');
  }

  return payload;
}

/**
 * Gera IDs únicos no formato PREFIX-TIMESTAMP-RANDOM
 * Ex: generateId('VEI') → 'VEI-1713200000000-k2j9f'
 */
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
