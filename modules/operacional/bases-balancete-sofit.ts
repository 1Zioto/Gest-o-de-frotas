import type { VercelResponse } from '@vercel/node';
import { getDb } from '../../server/db.js';
import type { AuthenticatedRequest } from '../shared/middleware.js';

function asBody(body: unknown): Record<string, any> {
  return typeof body === 'string' ? JSON.parse(body || '{}') : (body || {}) as Record<string, any>;
}

function queryText(req: AuthenticatedRequest): string {
  return String(req.query['q'] || '').trim();
}

function nullable(value: unknown) {
  return value === undefined || value === '' ? null : value;
}

function toNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export async function handleBalancete(req: AuthenticatedRequest, res: VercelResponse) {
  const sql = getDb();

  if (req.method === 'GET') {
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

  if (req.method === 'POST') {
    const body = asBody(req.body);
    if (!body['cte'] || !body['cliente']) return res.status(400).json({ error: 'Informe CTE e cliente.' });
    const sourceRows = await sql`SELECT COALESCE(MAX(source_row_number), 1)::int + 1 AS next FROM balancete`;
    const rows = await sql`
      INSERT INTO balancete (
        source_row_number, cte, data, cliente, remetente, destinatario, motorista,
        placa_cavalo, frete_emp, valor_mercadoria, lucro, vgm, vipe, despesa,
        check_status, nome_tomador, cidade_remetente, cidade_destinatario
      ) VALUES (
        ${Number(sourceRows[0]['next'])}, ${body['cte']}, ${nullable(body['data'])}, ${body['cliente']},
        ${nullable(body['remetente'])}, ${nullable(body['destinatario'])}, ${nullable(body['motorista'])},
        ${nullable(body['placa_cavalo'])}, ${toNumber(body['frete_emp'])}, ${toNumber(body['valor_mercadoria'])},
        ${toNumber(body['lucro'])}, ${nullable(body['vgm'])}, ${nullable(body['vipe'])}, ${nullable(body['despesa'])},
        ${nullable(body['check_status'])}, ${nullable(body['nome_tomador'])}, ${nullable(body['cidade_remetente'])},
        ${nullable(body['cidade_destinatario'])}
      )
      RETURNING *
    `;
    return res.status(201).json(rows[0]);
  }

  if (req.method === 'PUT') {
    const id = Number(req.query['id']);
    const body = asBody(req.body);
    if (!id) return res.status(400).json({ error: 'ID é obrigatório.' });
    if (!body['cte'] || !body['cliente']) return res.status(400).json({ error: 'Informe CTE e cliente.' });

    const rows = await sql`
      UPDATE balancete SET
        cte = ${body['cte']},
        data = ${nullable(body['data'])},
        cliente = ${body['cliente']},
        remetente = ${nullable(body['remetente'])},
        destinatario = ${nullable(body['destinatario'])},
        motorista = ${nullable(body['motorista'])},
        placa_cavalo = ${nullable(body['placa_cavalo'])},
        frete_emp = ${toNumber(body['frete_emp'])},
        valor_mercadoria = ${toNumber(body['valor_mercadoria'])},
        lucro = ${toNumber(body['lucro'])},
        vgm = ${nullable(body['vgm'])},
        vipe = ${nullable(body['vipe'])},
        despesa = ${nullable(body['despesa'])},
        check_status = ${nullable(body['check_status'])},
        nome_tomador = ${nullable(body['nome_tomador'])},
        cidade_remetente = ${nullable(body['cidade_remetente'])},
        cidade_destinatario = ${nullable(body['cidade_destinatario'])},
        imported_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return rows[0] ? res.status(200).json(rows[0]) : res.status(404).json({ error: 'Registro não encontrado.' });
  }

  if (req.method === 'DELETE') {
    const id = Number(req.query['id']);
    if (!id) return res.status(400).json({ error: 'ID é obrigatório.' });
    await sql`DELETE FROM balancete WHERE id = ${id}`;
    return res.status(204).end();
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}

export async function handleSofit(req: AuthenticatedRequest, res: VercelResponse) {
  const sql = getDb();

  if (req.method === 'GET') {
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

  if (req.method === 'POST') {
    const body = asBody(req.body);
    if (!body['vehicle_id']) return res.status(400).json({ error: 'Informe o veículo.' });
    const sourceRows = await sql`SELECT COALESCE(MAX(source_row_number), 1)::int + 1 AS next FROM sofit`;
    const rows = await sql`
      INSERT INTO sofit (
        source_row_number, external_id, vehicle_id, data, foreseen_start_date, foreseen_finish_date,
        status, route_id, observation, employee_id, id_interno, trip_id, id_novo,
        percentual, quantidade, beneficio
      ) VALUES (
        ${Number(sourceRows[0]['next'])}, ${nullable(body['external_id'])}, ${body['vehicle_id']},
        ${nullable(body['data'])}, ${nullable(body['foreseen_start_date'])}, ${nullable(body['foreseen_finish_date'])},
        ${nullable(body['status'])}, ${nullable(body['route_id'])}, ${nullable(body['observation'])},
        ${nullable(body['employee_id'])}, ${nullable(body['id_interno'])}, ${toNumber(body['trip_id'])},
        ${nullable(body['id_novo'])}, ${toNumber(body['percentual'])}, ${toNumber(body['quantidade'])},
        ${toNumber(body['beneficio'])}
      )
      RETURNING *
    `;
    return res.status(201).json(rows[0]);
  }

  if (req.method === 'PUT') {
    const id = Number(req.query['id']);
    const body = asBody(req.body);
    if (!id) return res.status(400).json({ error: 'ID é obrigatório.' });
    if (!body['vehicle_id']) return res.status(400).json({ error: 'Informe o veículo.' });

    const rows = await sql`
      UPDATE sofit SET
        external_id = ${nullable(body['external_id'])},
        vehicle_id = ${body['vehicle_id']},
        data = ${nullable(body['data'])},
        foreseen_start_date = ${nullable(body['foreseen_start_date'])},
        foreseen_finish_date = ${nullable(body['foreseen_finish_date'])},
        status = ${nullable(body['status'])},
        route_id = ${nullable(body['route_id'])},
        observation = ${nullable(body['observation'])},
        employee_id = ${nullable(body['employee_id'])},
        id_interno = ${nullable(body['id_interno'])},
        trip_id = ${toNumber(body['trip_id'])},
        id_novo = ${nullable(body['id_novo'])},
        percentual = ${toNumber(body['percentual'])},
        quantidade = ${toNumber(body['quantidade'])},
        beneficio = ${toNumber(body['beneficio'])},
        imported_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return rows[0] ? res.status(200).json(rows[0]) : res.status(404).json({ error: 'Registro não encontrado.' });
  }

  if (req.method === 'DELETE') {
    const id = Number(req.query['id']);
    if (!id) return res.status(400).json({ error: 'ID é obrigatório.' });
    await sql`DELETE FROM sofit WHERE id = ${id}`;
    return res.status(204).end();
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
