import type { VercelResponse } from '@vercel/node';
import { getDb } from '../../server/db.js';
import type { AuthenticatedRequest } from '../shared/middleware.js';
import { ensureOperationalDbInitialized } from './db.js';

export async function handleVeiculosEmbarque(req: AuthenticatedRequest, res: VercelResponse) {
  await ensureOperationalDbInitialized();
  const sql = getDb();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const rows = await sql`
    SELECT
      id::text AS id,
      COALESCE(id_veiculo, id::text) AS id_veiculo,
      placa,
      modelo,
      marca,
      ano,
      COALESCE(ativo, TRUE) AS ativo
    FROM veiculos
    WHERE COALESCE(ativo, TRUE) = TRUE
    ORDER BY placa ASC, modelo ASC
  `;

  return res.status(200).json(rows);
}

export async function handleMotoristasEmbarque(req: AuthenticatedRequest, res: VercelResponse) {
  await ensureOperationalDbInitialized();
  const sql = getDb();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const rows = await sql`
    SELECT
      id::text AS id,
      COALESCE(id_motorista, id::text) AS id_motorista,
      nome,
      cnh,
      COALESCE(cel, telefone) AS cel,
      email,
      COALESCE(ativo, TRUE) AS ativo
    FROM motoristas
    WHERE COALESCE(ativo, TRUE) = TRUE
    ORDER BY nome ASC
  `;

  return res.status(200).json(rows);
}
