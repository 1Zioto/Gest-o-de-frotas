/**
 * modules/financeiro/despesas.ts
 * CRUD de despesas administrativas — alinhado ao schema real do Neon.
 *
 * Schema:
 *   despesas_administrativas.id          uuid PK
 *   despesas_administrativas.id_despesa  text NOT NULL
 *   despesas_administrativas.data        date
 *   despesas_administrativas.tipo        text
 *   despesas_administrativas.descricao   text NOT NULL
 *   despesas_administrativas.valor       numeric NOT NULL
 *   despesas_administrativas.veiculo_id  uuid FK → veiculos.id
 *   despesas_administrativas.observacoes text
 */
import type { VercelResponse } from '@vercel/node';
import { getDb } from '../../server/db.js';
import { AuthenticatedRequest, generateId } from '../shared/middleware.js';

export async function handleDespesas(
  req: AuthenticatedRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  const sql = getDb();

  if (req.method === 'GET') {
    const { id } = req.query;

    if (id) {
      const rows = await sql`
        SELECT d.*, v.placa
        FROM despesas_administrativas d
        LEFT JOIN veiculos v ON d.veiculo_id = v.id
        WHERE d.id_despesa = ${id as string}
      `;
      return res.status(200).json(rows[0] ?? null);
    }

    const rows = await sql`
      SELECT d.*, v.placa
      FROM despesas_administrativas d
      LEFT JOIN veiculos v ON d.veiculo_id = v.id
      ORDER BY COALESCE(d.data, d.criado_em::date, CURRENT_DATE) DESC
    `;
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const d = req.body;

    const descricao = d.descricao ?? d.detalhamento ?? d.classificacao ?? '';
    const valor = d.valor ?? 0;

    if (!descricao.trim()) {
      return res.status(400).json({ error: 'Campo obrigatório: descricao.' });
    }

    // Resolver veiculo_id (uuid)
    let veiculoUuid: string | null = null;
    const veiculoParam = d.veiculo_id || d.id_veiculo;
    if (veiculoParam) {
      const v = await sql`SELECT id FROM veiculos WHERE id_veiculo = ${veiculoParam} OR id::text = ${veiculoParam} LIMIT 1`;
      veiculoUuid = v[0]?.['id'] ?? null;
    }

    const id_despesa = generateId('DES');
    const rows = await sql`
      INSERT INTO despesas_administrativas (
        id_despesa, data, tipo, descricao, valor, veiculo_id, observacoes
      ) VALUES (
        ${id_despesa},
        ${d.data ?? d.data_registro ?? null},
        ${d.tipo ?? d.classificacao ?? d.pagamento ?? null},
        ${descricao},
        ${valor},
        ${veiculoUuid},
        ${d.observacoes ?? d.numero_doc ?? null}
      )
      RETURNING *
    `;
    return res.status(201).json(rows[0]);
  }

  if (req.method === 'PUT') {
    const { id } = req.query;
    const d = req.body;

    const descricao = d.descricao ?? d.detalhamento ?? '';
    const valor = d.valor ?? 0;

    let veiculoUuid: string | null = null;
    const veiculoParam = d.veiculo_id || d.id_veiculo;
    if (veiculoParam) {
      const v = await sql`SELECT id FROM veiculos WHERE id_veiculo = ${veiculoParam} OR id::text = ${veiculoParam} LIMIT 1`;
      veiculoUuid = v[0]?.['id'] ?? null;
    }

    const rows = await sql`
      UPDATE despesas_administrativas SET
        data        = ${d.data ?? null},
        tipo        = ${d.tipo ?? d.classificacao ?? null},
        descricao   = ${descricao},
        valor       = ${valor},
        veiculo_id  = ${veiculoUuid},
        observacoes = ${d.observacoes ?? null}
      WHERE id_despesa = ${id as string}
      RETURNING *
    `;
    return res.status(200).json(rows[0]);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    await sql`DELETE FROM despesas_administrativas WHERE id_despesa = ${id as string}`;
    return res.status(200).json({ message: 'Despesa removida.' });
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
