/**
 * api/operacional.ts
 * Função serverless do módulo Operacional.
 *
 *   /api/operacional?resource=embarques
 *   /api/operacional?resource=ctes
 *   /api/operacional?resource=tarefas
 */
import type { VercelResponse } from '@vercel/node';
import { withAuth, AuthenticatedRequest } from '../modules/shared/middleware.js';
import { handleEmbarques } from '../modules/operacional/embarques.js';
import { handleCtes }      from '../modules/operacional/ctes.js';
import { handleTarefas }   from '../modules/operacional/tarefas.js';

const RESOURCES = ['embarques', 'ctes', 'tarefas'] as const;
type OperacionalResource = (typeof RESOURCES)[number];

export default withAuth(async (req: AuthenticatedRequest, res: VercelResponse) => {
  const resource = req.query['resource'] as OperacionalResource | undefined;

  if (!resource || !RESOURCES.includes(resource)) {
    return res.status(400).json({
      error: `Parâmetro "resource" inválido. Valores aceitos: ${RESOURCES.join(', ')}`,
    });
  }

  switch (resource) {
    case 'embarques': return handleEmbarques(req, res);
    case 'ctes':      return handleCtes(req, res);
    case 'tarefas':   return handleTarefas(req, res);
  }
});
