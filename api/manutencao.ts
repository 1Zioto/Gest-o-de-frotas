/**
 * api/manutencao.ts
 * Função serverless do módulo Manutenção.
 * Seleciona o sub-módulo pelo query param `resource`:
 *
 *   /api/manutencao?resource=manutencoes
 *   /api/manutencao?resource=multas
 *   /api/manutencao?resource=pneus
 */
import type { VercelResponse } from '@vercel/node';
import { withAuth, AuthenticatedRequest } from '../modules/shared/middleware.js';
import { handleManutencoes } from '../modules/manutencao/manutencoes.js';
import { handleMultas } from '../modules/manutencao/multas.js';
import { handlePneus } from '../modules/manutencao/pneus.js';

const RESOURCES = ['manutencoes', 'multas', 'pneus'] as const;
type ManutencaoResource = (typeof RESOURCES)[number];

export default withAuth(async (req: AuthenticatedRequest, res: VercelResponse) => {
  const resource = req.query['resource'] as ManutencaoResource | undefined;

  if (!resource || !RESOURCES.includes(resource)) {
    return res.status(400).json({
      error: `Parâmetro "resource" inválido. Valores aceitos: ${RESOURCES.join(', ')}`,
    });
  }

  switch (resource) {
    case 'manutencoes': return handleManutencoes(req, res);
    case 'multas':      return handleMultas(req, res);
    case 'pneus':       return handlePneus(req, res);
  }
});
