/**
 * modules/manutencao/manutencoes.ts
 * CRUD de manutenções — alinhado ao schema real do Neon.
 *
 * Schema:
 *   manutencoes.id              uuid PK
 *   manutencoes.id_manutencao   text NOT NULL (business key)
 *   manutencoes.veiculo_id      uuid FK → veiculos.id
 *   manutencoes.data_abertura   date
 *   manutencoes.data_conclusao  date
 *   manutencoes.tipo            text
 *   manutencoes.descricao       text NOT NULL
 *   manutencoes.oficina         text  (nome livre, NÃO FK)
 *   manutencoes.mecanico        text
 *   manutencoes.km_entrada      numeric
 *   manutencoes.valor_pecas     numeric
 *   manutencoes.valor_servico   numeric
 *   manutencoes.valor_total     numeric
 *   manutencoes.status          text
 *   manutencoes.nota_fiscal     text
 *   manutencoes.observacoes     text
 */
import type { VercelResponse } from '@vercel/node';
import { getDb } from '../../server/db.js';
import { AuthenticatedRequest, generateId } from '../shared/middleware.js';

export async function handleManutencoes(
  req: AuthenticatedRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  const sql = getDb();

  if (req.method === 'GET') {
    const { id, veiculo, from, to } = req.query;

    if (id) {
      const rows = await sql`
        SELECT m.*, v.placa, v.modelo
        FROM manutencoes m
        LEFT JOIN veiculos v ON m.veiculo_id = v.id
        WHERE m.id_manutencao = ${id as string}
      `;
      return res.status(200).json(rows[0] ?? null);
    }

    // veiculo param pode vir como id_veiculo (text) ou uuid
    const rows = await sql`
      SELECT m.*, v.placa, v.modelo
      FROM manutencoes m
      LEFT JOIN veiculos v ON m.veiculo_id = v.id
      WHERE (${veiculo ? sql`v.id_veiculo = ${veiculo as string}` : sql`TRUE`})
        AND (${from ? sql`m.data_abertura >= ${from as string}` : sql`TRUE`})
        AND (${to   ? sql`m.data_abertura <= ${to   as string}` : sql`TRUE`})
      ORDER BY COALESCE(m.data_abertura, m.criado_em::date) DESC
    `;
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const d = req.body;
    if (!d.descricao?.trim()) {
      return res.status(400).json({ error: 'Campo obrigatório: descricao.' });
    }

    const id_manutencao = generateId('MAN');

    // veiculo_id pode chegar como id_veiculo (text) — converter para uuid
    let veiculoUuid: string | null = null;
    const veiculoParam = d.veiculo_id || d.id_veiculo;
    if (veiculoParam) {
      const v = await sql`SELECT id FROM veiculos WHERE id_veiculo = ${veiculoParam} OR id::text = ${veiculoParam} LIMIT 1`;
      veiculoUuid = v[0]?.['id'] ?? null;
    }

    const rows = await sql`
      INSERT INTO manutencoes (
        id_manutencao, veiculo_id, data_abertura, data_conclusao,
        tipo, descricao, oficina, mecanico, km_entrada,
        valor_pecas, valor_servico, valor_total,
        nota_fiscal, observacoes, status
      ) VALUES (
        ${id_manutencao},
        ${veiculoUuid},
        ${d.data_abertura ?? d.data_manutencao ?? null},
        ${d.data_conclusao ?? null},
        ${d.tipo ?? d.tipo_manutencao ?? null},
        ${d.descricao ?? d.descricao_servico ?? ''},
        ${d.oficina ?? d.oficina_nome ?? null},
        ${d.mecanico ?? null},
        ${d.km_entrada ?? d.odometro_manutencao ?? null},
        ${d.valor_pecas ?? null},
        ${d.valor_servico ?? null},
        ${d.valor_total ?? d.custo_total ?? null},
        ${d.nota_fiscal ?? d.numero_nf ?? null},
        ${d.observacoes ?? null},
        ${d.status ?? 'Concluída'}
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
    }

    const rows = await sql`
      UPDATE manutencoes SET
        veiculo_id    = ${veiculoUuid},
        data_abertura = ${d.data_abertura ?? d.data_manutencao ?? null},
        data_conclusao= ${d.data_conclusao ?? null},
        tipo          = ${d.tipo ?? d.tipo_manutencao ?? null},
        descricao     = ${d.descricao ?? d.descricao_servico ?? ''},
        oficina       = ${d.oficina ?? null},
        mecanico      = ${d.mecanico ?? null},
        km_entrada    = ${d.km_entrada ?? d.odometro_manutencao ?? null},
        valor_pecas   = ${d.valor_pecas ?? null},
        valor_servico = ${d.valor_servico ?? null},
        valor_total   = ${d.valor_total ?? d.custo_total ?? null},
        nota_fiscal   = ${d.nota_fiscal ?? d.numero_nf ?? null},
        observacoes   = ${d.observacoes ?? null},
        status        = ${d.status ?? 'Concluída'}
      WHERE id_manutencao = ${id as string}
      RETURNING *
    `;
    return res.status(200).json(rows[0]);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    await sql`DELETE FROM manutencoes WHERE id_manutencao = ${id as string}`;
    return res.status(200).json({ message: 'Manutenção removida.' });
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
