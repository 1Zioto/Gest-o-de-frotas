/**
 * api/catalogos.ts
 * Função serverless do módulo Catálogos (tabelas auxiliares).
 * Seleciona o sub-módulo pelo query param `resource`:
 *
 *   /api/catalogos?resource=carretas
 *   /api/catalogos?resource=oficinas
 *   /api/catalogos?resource=pneus        ← também disponível em /api/manutencao?resource=pneus
 *   /api/catalogos?resource=valores
 */
import type { VercelResponse } from '@vercel/node';
import { withAuth, AuthenticatedRequest } from '../modules/shared/middleware.js';
import { handleCarretas } from '../modules/catalogos/carretas.js';
import { handleOficinas } from '../modules/catalogos/oficinas.js';
import { handleValores } from '../modules/catalogos/valores.js';

const RESOURCES = ['carretas', 'oficinas', 'valores'] as const;
type CatalogosResource = (typeof RESOURCES)[number];

export default withAuth(async (req: AuthenticatedRequest, res: VercelResponse) => {
  const resource = req.query['resource'] as CatalogosResource | undefined;

  if (!resource || !RESOURCES.includes(resource)) {
    return res.status(400).json({
      error: `Parâmetro "resource" inválido. Valores aceitos: ${RESOURCES.join(', ')}`,
    });
  }

  switch (resource) {
    case 'carretas': return handleCarretas(req, res);
    case 'oficinas': return handleOficinas(req, res);
    case 'valores':  return handleValores(req, res);
  }
});
