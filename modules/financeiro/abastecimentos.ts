/**
 * modules/financeiro/abastecimentos.ts
 * CRUD de abastecimentos — alinhado ao schema real do Neon.
 *
 * Schema:
 *   abastecimentos.id               uuid PK
 *   abastecimentos.id_abastecimento text NOT NULL
 *   abastecimentos.data             date NOT NULL (default CURRENT_DATE)
 *   abastecimentos.data_hora        timestamptz
 *   abastecimentos.frentista        text
 *   abastecimentos.veiculo_id       uuid FK → veiculos.id
 *   abastecimentos.motorista_id     uuid (sem FK real para motoristas)
 *   abastecimentos.proprietario_id  uuid FK → proprietarios.id
 *   abastecimentos.local            text
 *   abastecimentos.tipo_combustivel text
 *   abastecimentos.km_atual         numeric
 *   abastecimentos.litros           numeric
 *   abastecimentos.valor_litro      numeric
 *   abastecimentos.valor_total      numeric
 *   abastecimentos.tanque_cheio     boolean
 *   abastecimentos.numero_nota      text
 *   abastecimentos.observacoes      text
 */
import type { VercelResponse } from '@vercel/node';
import { getDb } from '../../server/db.js';
import { AuthenticatedRequest, generateId } from '../shared/middleware.js';

export async function handleAbastecimentos(
  req: AuthenticatedRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  const sql = getDb();

  if (req.method === 'GET') {
    const { id, veiculo, motorista, from, to } = req.query;

    if (id) {
      const rows = await sql`
        SELECT a.*, v.placa, v.modelo, p.nome AS proprietario_nome
        FROM abastecimentos a
        LEFT JOIN veiculos v      ON a.veiculo_id      = v.id
        LEFT JOIN proprietarios p ON a.proprietario_id = p.id
        WHERE a.id_abastecimento = ${id as string}
      `;
      return res.status(200).json(rows[0] ?? null);
    }

    const rows = await sql`
      SELECT a.*, v.placa, v.modelo, p.nome AS proprietario_nome
      FROM abastecimentos a
      LEFT JOIN veiculos v      ON a.veiculo_id      = v.id
      LEFT JOIN proprietarios p ON a.proprietario_id = p.id
      WHERE (${veiculo  ? sql`v.id_veiculo = ${veiculo as string}` : sql`TRUE`})
        AND (${from     ? sql`a.data >= ${from as string}`          : sql`TRUE`})
        AND (${to       ? sql`a.data <= ${to as string}`            : sql`TRUE`})
      ORDER BY COALESCE(a.data_hora, a.data::timestamptz) DESC
      LIMIT 200
    `;
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const d = req.body;
    const id_abastecimento = generateId('ABA');

    // Resolver veiculo_id (uuid) a partir de id_veiculo (text) ou uuid direto
    let veiculoUuid: string | null = null;
    const veiculoParam = d.veiculo_id || d.id_veiculo;
    if (veiculoParam) {
      const v = await sql`SELECT id FROM veiculos WHERE id_veiculo = ${veiculoParam} OR id::text = ${veiculoParam} LIMIT 1`;
      veiculoUuid = v[0]?.['id'] ?? null;
    }

    // Resolver proprietario_id (uuid)
    let proprietarioUuid: string | null = null;
    const propParam = d.proprietario_id;
    if (propParam) {
      const p = await sql`SELECT id FROM proprietarios WHERE id_proprietario = ${propParam} OR id::text = ${propParam} LIMIT 1`;
      proprietarioUuid = p[0]?.['id'] ?? null;
    }

    const rows = await sql`
      INSERT INTO abastecimentos (
        id_abastecimento, data, data_hora, frentista,
        veiculo_id, proprietario_id, local,
        tipo_combustivel, km_atual, litros, valor_litro, valor_total,
        tanque_cheio, numero_nota, observacoes
      ) VALUES (
        ${id_abastecimento},
        ${d.data ?? new Date().toISOString().slice(0, 10)},
        ${d.data_hora ?? null},
        ${d.frentista ?? null},
        ${veiculoUuid},
        ${proprietarioUuid},
        ${d.local ?? null},
        ${d.tipo_combustivel ?? null},
        ${d.km_atual ?? d.odometro_atual ?? null},
        ${d.litros ?? null},
        ${d.valor_litro ?? null},
        ${d.valor_total ?? null},
        ${d.tanque_cheio ?? false},
        ${d.numero_nota ?? d.numero_nf ?? null},
        ${d.observacoes ?? null}
      )
      RETURNING *
    `;
    return res.status(201).json(rows[0]);
  }

  if (req.method === 'PUT') {
    const { id } = req.query;
    const d = req.body;
    const rows = await sql`
      UPDATE abastecimentos SET
        litros       = ${d.litros ?? null},
        valor_litro  = ${d.valor_litro ?? null},
        valor_total  = ${d.valor_total ?? null},
        numero_nota  = ${d.numero_nota ?? d.numero_nf ?? null},
        observacoes  = ${d.observacoes ?? null},
        tanque_cheio = ${d.tanque_cheio ?? false}
      WHERE id_abastecimento = ${id as string}
      RETURNING *
    `;
    return res.status(200).json(rows[0]);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    await sql`DELETE FROM abastecimentos WHERE id_abastecimento = ${id as string}`;
    return res.status(200).json({ message: 'Abastecimento removido.' });
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
