/**
 * api/admin.ts
 * Função serverless do módulo Admin.
 * Seleciona o sub-módulo pelo query param `resource`:
 *
 *   /api/admin?resource=dashboard
 *   /api/admin?resource=users
 */
import type { VercelResponse } from '@vercel/node';
import { withAuth, AuthenticatedRequest } from '../modules/shared/middleware.js';
import { handleDashboard } from '../modules/admin/dashboard.js';
import { handleUsers } from '../modules/admin/users.js';

const RESOURCES = ['dashboard', 'users'] as const;
type AdminResource = (typeof RESOURCES)[number];

export default withAuth(async (req: AuthenticatedRequest, res: VercelResponse) => {
  const resource = req.query['resource'] as AdminResource | undefined;

  if (!resource || !RESOURCES.includes(resource)) {
    return res.status(400).json({
      error: `Parâmetro "resource" inválido. Valores aceitos: ${RESOURCES.join(', ')}`,
    });
  }

  switch (resource) {
    case 'dashboard': return handleDashboard(req, res);
    case 'users':     return handleUsers(req, res);
  }
});
