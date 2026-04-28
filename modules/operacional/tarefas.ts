import type { VercelResponse } from '@vercel/node';
import type { AuthenticatedRequest } from '../shared/middleware.js';

export async function handleTarefas(_req: AuthenticatedRequest, res: VercelResponse) {
  return res.status(501).json({ error: 'Recurso de tarefas ainda não implementado neste backend.' });
}
