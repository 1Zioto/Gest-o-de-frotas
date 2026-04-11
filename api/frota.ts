/**
 * api/frota.ts
 * Função serverless do módulo Frota.
 * Seleciona o sub-módulo pelo query param `resource`:
 *
 *   /api/frota?resource=veiculos
 *   /api/frota?resource=motoristas
 *   /api/frota?resource=proprietarios
 *   /api/frota?resource=inspecoes
 *   /api/frota?resource=transportes
 */
import type { VercelResponse } from '@vercel/node';
import { withAuth, AuthenticatedRequest } from '../modules/shared/middleware.js';
import { handleVeiculos } from '../modules/frota/veiculos.js';
import { handleMotoristas } from '../modules/frota/motoristas.js';
import { handleProprietarios } from '../modules/frota/proprietarios.js';
import { handleInspecoes } from '../modules/frota/inspecoes.js';
import { handleTransportes } from '../modules/frota/transportes.js';

const RESOURCES = ['veiculos', 'motoristas', 'proprietarios', 'inspecoes', 'transportes'] as const;
type FrotaResource = (typeof RESOURCES)[number];

export default withAuth(async (req: AuthenticatedRequest, res: VercelResponse) => {
  const resource = req.query['resource'] as FrotaResource | undefined;

  if (!resource || !RESOURCES.includes(resource)) {
    return res.status(400).json({
      error: `Parâmetro "resource" inválido. Valores aceitos: ${RESOURCES.join(', ')}`,
    });
  }

  switch (resource) {
    case 'veiculos':      return handleVeiculos(req, res);
    case 'motoristas':    return handleMotoristas(req, res);
    case 'proprietarios': return handleProprietarios(req, res);
    case 'inspecoes':     return handleInspecoes(req, res);
    case 'transportes':   return handleTransportes(req, res);
  }
});
