import type { VercelResponse } from '@vercel/node';
import { getDb } from '../../server/db.js';
import type { AuthenticatedRequest } from '../shared/middleware.js';

function queryText(req: AuthenticatedRequest): string {
  return String(req.query['q'] || '').trim();
}

export async function handleBalancete(req: AuthenticatedRequest, res: VercelResponse) {
  const sql = getDb();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const q = queryText(req);
  const rows = q
    ? await sql`
        SELECT
          id,
          source_row_number,
          cte,
          data,
          cliente,
          remetente,
          destinatario,
          motorista,
          placa_cavalo,
          frete_emp,
          valor_mercadoria,
          lucro,
          vgm,
          vipe,
          despesa,
          check_status,
          nome_tomador,
          cidade_remetente,
          cidade_destinatario
        FROM balancete
        WHERE
          cte ILIKE ${`%${q}%`}
          OR cliente ILIKE ${`%${q}%`}
          OR motorista ILIKE ${`%${q}%`}
          OR placa_cavalo ILIKE ${`%${q}%`}
          OR vgm ILIKE ${`%${q}%`}
        ORDER BY data DESC NULLS LAST, id DESC
        LIMIT 500
      `
    : await sql`
        SELECT
          id,
          source_row_number,
          cte,
          data,
          cliente,
          remetente,
          destinatario,
          motorista,
          placa_cavalo,
          frete_emp,
          valor_mercadoria,
          lucro,
          vgm,
          vipe,
          despesa,
          check_status,
          nome_tomador,
          cidade_remetente,
          cidade_destinatario
        FROM balancete
        ORDER BY data DESC NULLS LAST, id DESC
        LIMIT 500
      `;

  const stats = await sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE LOWER(COALESCE(check_status, '')) = 'ok' OR LOWER(COALESCE(vipe, '')) = 'sim')::int AS finalizados,
      COUNT(*) FILTER (WHERE NOT (LOWER(COALESCE(check_status, '')) = 'ok' OR LOWER(COALESCE(vipe, '')) = 'sim'))::int AS pendentes,
      COALESCE(SUM(frete_emp), 0)::float AS total_frete
    FROM balancete
  `;

  return res.status(200).json({ rows, stats: stats[0] });
}

export async function handleSofit(req: AuthenticatedRequest, res: VercelResponse) {
  const sql = getDb();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const q = queryText(req);
  const rows = q
    ? await sql`
        SELECT
          id,
          source_row_number,
          external_id,
          vehicle_id,
          data,
          foreseen_start_date,
          foreseen_finish_date,
          status,
          route_id,
          observation,
          employee_id,
          id_interno,
          trip_id,
          id_novo,
          percentual,
          quantidade,
          beneficio
        FROM sofit
        WHERE
          external_id ILIKE ${`%${q}%`}
          OR vehicle_id ILIKE ${`%${q}%`}
          OR employee_id ILIKE ${`%${q}%`}
          OR id_novo ILIKE ${`%${q}%`}
          OR status ILIKE ${`%${q}%`}
        ORDER BY data DESC NULLS LAST, id DESC
        LIMIT 500
      `
    : await sql`
        SELECT
          id,
          source_row_number,
          external_id,
          vehicle_id,
          data,
          foreseen_start_date,
          foreseen_finish_date,
          status,
          route_id,
          observation,
          employee_id,
          id_interno,
          trip_id,
          id_novo,
          percentual,
          quantidade,
          beneficio
        FROM sofit
        ORDER BY data DESC NULLS LAST, id DESC
        LIMIT 500
      `;

  const stats = await sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE LOWER(COALESCE(status, '')) = 'finalizado')::int AS finalizados,
      COUNT(DISTINCT vehicle_id)::int AS veiculos,
      COALESCE(SUM(beneficio), 0)::float AS total_beneficio
    FROM sofit
  `;

  return res.status(200).json({ rows, stats: stats[0] });
}
