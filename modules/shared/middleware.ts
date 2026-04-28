import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac, timingSafeEqual } from 'crypto';

export type AuthenticatedRequest = VercelRequest & {
  user?: Record<string, unknown>;
};

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

function fromBase64Url(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64').toString('utf8');
}

function verifyJwt(token: string): Record<string, unknown> | null {
  const secret = process.env['JWT_SECRET'] || 'gestao-frotas-secret-2024';
  const [header, payload, signature] = token.split('.');
  if (!header || !payload || !signature) return null;

  const expected = createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return null;

  const data = JSON.parse(fromBase64Url(payload)) as Record<string, unknown>;
  if (typeof data['exp'] === 'number' && data['exp'] < Math.floor(Date.now() / 1000)) return null;
  return data;
}

export function withAuth(handler: (req: AuthenticatedRequest, res: VercelResponse) => Promise<unknown> | unknown) {
  return async (req: AuthenticatedRequest, res: VercelResponse) => {
    setCors(res);

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const auth = req.headers.authorization || req.headers['Authorization'];
    const token = Array.isArray(auth) ? auth[0]?.replace(/^Bearer\s+/i, '') : auth?.replace(/^Bearer\s+/i, '');
    const user = token ? verifyJwt(token) : null;
    if (!user) return res.status(401).json({ error: 'Não autorizado.' });
    req.user = user;

    return handler(req, res);
  };
}
