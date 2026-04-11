/**
 * modules/manutencao/multas.ts
 * CRUD de multas — alinhado ao schema real do Neon.
 *
 * Schema:
 *   multas.id             uuid PK
 *   multas.id_multa       text NOT NULL
 *   multas.veiculo_id     uuid FK → veiculos.id
 *   multas.motorista_id   uuid (sem FK real para motoristas — armazena null)
 *   multas.data_infracao  date
 *   multas.data_vencimento date
 *   multas.data_pagamento date
 *   multas.local_infracao text
 *   multas.descricao      text
 *   multas.orgao_autuador text
 *   multas.pontos         integer
 *   multas.valor          numeric
 *   multas.status         text
 *   multas.observacoes    text
 */
import type { VercelResponse } from '@vercel/node';
import { getDb } from '../../server/db.js';
import { AuthenticatedRequest, generateId } from '../shared/middleware.js';

export async function handleMultas(
  req: AuthenticatedRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  const sql = getDb();

  if (req.method === 'GET') {
    const { id, placa, veiculo } = req.query;
    const filtroVeiculo = veiculo || placa; // aceitar ambos os params

    if (id) {
      const rows = await sql`
        SELECT m.*, v.placa, v.modelo
        FROM multas m
        LEFT JOIN veiculos v ON m.veiculo_id = v.id
        WHERE m.id_multa = ${id as string}
      `;
      return res.status(200).json(rows[0] ?? null);
    }

    const rows = await sql`
      SELECT m.*, v.placa, v.modelo
      FROM multas m
      LEFT JOIN veiculos v ON m.veiculo_id = v.id
      WHERE (${filtroVeiculo ? sql`v.placa = ${(filtroVeiculo as string).toUpperCase()} OR v.id_veiculo = ${filtroVeiculo as string}` : sql`TRUE`})
      ORDER BY m.data_infracao DESC
    `;
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const d = req.body;
    const id_multa = generateId('MUL');

    // Aceitar placa ou veiculo_id para localizar o veiculo
    let veiculoUuid: string | null = null;
    const veiculoParam = d.veiculo_id || d.id_veiculo;
    if (veiculoParam) {
      const v = await sql`SELECT id FROM veiculos WHERE id_veiculo = ${veiculoParam} OR id::text = ${veiculoParam} LIMIT 1`;
      veiculoUuid = v[0]?.['id'] ?? null;
    } else if (d.placa) {
      const v = await sql`SELECT id FROM veiculos WHERE placa = ${(d.placa as string).toUpperCase()} LIMIT 1`;
      veiculoUuid = v[0]?.['id'] ?? null;
    }

    const rows = await sql`
      INSERT INTO multas (
        id_multa, veiculo_id, data_infracao, data_vencimento, data_pagamento,
        local_infracao, descricao, orgao_autuador, pontos,
        valor, status, observacoes
      ) VALUES (
        ${id_multa},
        ${veiculoUuid},
        ${d.data_infracao ?? d.data_emissao ?? null},
        ${d.data_vencimento ?? null},
        ${d.data_pagamento ?? null},
        ${d.local_infracao ?? null},
        ${d.descricao ?? d.enquadramento ?? null},
        ${d.orgao_autuador ?? d.uf ?? null},
        ${d.pontos ?? null},
        ${d.valor ?? null},
        ${d.status ?? 'Pendente'},
        ${d.observacoes ?? null}
      )
      RETURNING *
    `;
    return res.status(201).json(rows[0]);
  }

  if (req.method === 'PUT') {
    const { id } = req.query;
    const d = req.body;

    let veiculoUuid: string | null = null;
    const veiculoParam = d.veiculo_id || d.id_veiculo;
    if (veiculoParam) {
      const v = await sql`SELECT id FROM veiculos WHERE id_veiculo = ${veiculoParam} OR id::text = ${veiculoParam} LIMIT 1`;
      veiculoUuid = v[0]?.['id'] ?? null;
    } else if (d.placa) {
      const v = await sql`SELECT id FROM veiculos WHERE placa = ${(d.placa as string).toUpperCase()} LIMIT 1`;
      veiculoUuid = v[0]?.['id'] ?? null;
    }

    const rows = await sql`
      UPDATE multas SET
        veiculo_id     = ${veiculoUuid},
        data_infracao  = ${d.data_infracao ?? d.data_emissao ?? null},
        data_vencimento= ${d.data_vencimento ?? null},
        data_pagamento = ${d.data_pagamento ?? null},
        local_infracao = ${d.local_infracao ?? null},
        descricao      = ${d.descricao ?? d.enquadramento ?? null},
        orgao_autuador = ${d.orgao_autuador ?? null},
        pontos         = ${d.pontos ?? null},
        valor          = ${d.valor ?? null},
        status         = ${d.status ?? 'Pendente'},
        observacoes    = ${d.observacoes ?? null}
      WHERE id_multa = ${id as string}
      RETURNING *
    `;
    return res.status(200).json(rows[0]);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    await sql`DELETE FROM multas WHERE id_multa = ${id as string}`;
    return res.status(200).json({ message: 'Multa removida.' });
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
