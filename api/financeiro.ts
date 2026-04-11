/**
 * api/financeiro.ts
 * Função serverless do módulo Financeiro.
 * Seleciona o sub-módulo pelo query param `resource`:
 *
 *   /api/financeiro?resource=abastecimentos
 *   /api/financeiro?resource=despesas
 *   /api/financeiro?resource=registros
 */
import type { VercelResponse } from '@vercel/node';
import { withAuth, AuthenticatedRequest } from '../modules/shared/middleware.js';
import { handleAbastecimentos } from '../modules/financeiro/abastecimentos.js';
import { handleDespesas } from '../modules/financeiro/despesas.js';
import { handleRegistros } from '../modules/financeiro/registros.js';

const RESOURCES = ['abastecimentos', 'despesas', 'registros'] as const;
type FinanceiroResource = (typeof RESOURCES)[number];

export default withAuth(async (req: AuthenticatedRequest, res: VercelResponse) => {
  const resource = req.query['resource'] as FinanceiroResource | undefined;

  if (!resource || !RESOURCES.includes(resource)) {
    return res.status(400).json({
      error: `Parâmetro "resource" inválido. Valores aceitos: ${RESOURCES.join(', ')}`,
    });
  }

  switch (resource) {
    case 'abastecimentos': return handleAbastecimentos(req, res);
    case 'despesas':       return handleDespesas(req, res);
    case 'registros':      return handleRegistros(req, res);
  }
});
