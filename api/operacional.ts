/**
 * api/operacional.ts
 * Função serverless do módulo Operacional.
 *
 *   /api/operacional?resource=embarques
 *   /api/operacional?resource=cadastros-embarque
 *   /api/operacional?resource=containers
 *   /api/operacional?resource=ctes
 *   /api/operacional?resource=tarefas
 *   /api/operacional?resource=veiculos-embarque
 *   /api/operacional?resource=motoristas-embarque
 *   /api/operacional?resource=balancete
 *   /api/operacional?resource=sofit
 */
import type { VercelResponse } from '@vercel/node';
import { withAuth, AuthenticatedRequest } from '../modules/shared/middleware.js';
import { handleEmbarques } from '../modules/operacional/embarques.js';
import { handleCadastrosEmbarque } from '../modules/operacional/cadastros-embarque.js';
import { handleContainers } from '../modules/operacional/containers.js';
import { handleCtes }      from '../modules/operacional/ctes.js';
import { handleTarefas }   from '../modules/operacional/tarefas.js';
import { handleMotoristasEmbarque, handleVeiculosEmbarque } from '../modules/operacional/apoio-frota.js';
import { handleBalancete, handleSofit } from '../modules/operacional/bases-balancete-sofit.js';

const RESOURCES = ['embarques', 'cadastros-embarque', 'containers', 'ctes', 'tarefas', 'veiculos-embarque', 'motoristas-embarque', 'balancete', 'sofit'] as const;
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
    case 'cadastros-embarque': return handleCadastrosEmbarque(req, res);
    case 'containers': return handleContainers(req, res);
    case 'ctes':      return handleCtes(req, res);
    case 'tarefas':   return handleTarefas(req, res);
    case 'veiculos-embarque': return handleVeiculosEmbarque(req, res);
    case 'motoristas-embarque': return handleMotoristasEmbarque(req, res);
    case 'balancete': return handleBalancete(req, res);
    case 'sofit': return handleSofit(req, res);
  }
});
