/**
 * modules/frota/inspecoes.ts
 * A tabela `inspecoes` ainda não existe no banco Neon.
 * Este handler retorna respostas vazias graciosamente para não quebrar o frontend.
 */
import type { VercelResponse } from '@vercel/node';
import { AuthenticatedRequest } from '../shared/middleware.js';

export async function handleInspecoes(
  req: AuthenticatedRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  if (req.method === 'GET') {
    return res.status(200).json([]);
  }
  if (req.method === 'POST' || req.method === 'PUT') {
    return res.status(503).json({ error: 'Módulo de inspeções ainda não disponível.' });
  }
  if (req.method === 'DELETE') {
    return res.status(503).json({ error: 'Módulo de inspeções ainda não disponível.' });
  }
  return res.status(405).json({ error: 'Método não permitido.' });
}
