/**
 * modules/operacional/embarques.ts
 * CRUD de embarques.
 *
 * Relacionamentos:
 *   embarques.id_veiculo  UUID → veiculos.id       (uuid PK)
 *   embarques.id_motorista UUID → motoristas.id    (uuid, adicionado por migração lazy em motoristas.ts)
 *
 * Os forms enviam o id de negócio (id_veiculo TEXT, id_motorista TEXT).
 * O backend resolve para UUID antes de persistir.
 */
import type { VercelResponse } from '@vercel/node';
import { getDb } from '../../server/db.js';
import { AuthenticatedRequest } from '../shared/middleware.js';

export async function handleEmbarques(
  req: AuthenticatedRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  const sql = getDb();

  // ── helpers ─────────────────────────────────────────────────────────────
  async function resolveVeiculoUuid(val?: string): Promise<string | null> {
    if (!val) return null;
    const r = await sql`
      SELECT id FROM veiculos
      WHERE id_veiculo = ${val} OR id::text = ${val}
      LIMIT 1
    `;
    return r[0]?.['id'] ?? null;
  }

  async function resolveMotoristUuid(val?: string): Promise<string | null> {
    if (!val) return null;
    // val pode ser o UUID direto (id) ou o text key (id_motorista)
    const r = await sql`
      SELECT id FROM motoristas
      WHERE id::text = ${val} OR id_motorista = ${val}
      LIMIT 1
    `;
    return r[0]?.['id'] ?? null;
  }

  // ── GET ──────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { id, status, search } = req.query;

    if (id) {
      const rows = await sql`
        SELECT e.*,
               v.placa, v.modelo AS veiculo_modelo,
               m.nome AS motorista_nome
        FROM embarques e
        LEFT JOIN veiculos   v ON e.id_veiculo   = v.id
        LEFT JOIN motoristas m ON e.id_motorista  = m.id
        WHERE e.id_embarque = ${id as string}
      `;
      return res.status(200).json(rows[0] ?? null);
    }

    const rows = await sql`
      SELECT e.*,
             v.placa, v.modelo AS veiculo_modelo,
             m.nome AS motorista_nome
      FROM embarques e
      LEFT JOIN veiculos   v ON e.id_veiculo   = v.id
      LEFT JOIN motoristas m ON e.id_motorista  = m.id
      WHERE (${status ? sql`e.status = ${status as string}` : sql`TRUE`})
        AND (${search ? sql`
          e.codigo_embarque ILIKE ${'%' + search + '%'} OR
          e.origem_cidade   ILIKE ${'%' + search + '%'} OR
          e.destino_cidade  ILIKE ${'%' + search + '%'} OR
          e.descricao_carga ILIKE ${'%' + search + '%'}
        ` : sql`TRUE`})
      ORDER BY e.created_at DESC
      LIMIT 200
    `;
    return res.status(200).json(rows);
  }

  // ── POST ─────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const d = req.body;
    if (!d.codigo_embarque)
      return res.status(400).json({ error: 'Código do embarque é obrigatório.' });

    const veiculoId    = await resolveVeiculoUuid(d.id_veiculo);
    const motoristaId  = await resolveMotoristUuid(d.id_motorista);

    const rows = await sql`
      INSERT INTO embarques (
        codigo_embarque,
        origem_nome, origem_cidade, origem_uf, origem_endereco,
        destino_nome, destino_cidade, destino_uf, destino_endereco,
        data_coleta, data_previsao_entrega,
        id_veiculo, id_motorista,
        descricao_carga, tipo_carga, peso_kg, volume_m3, quantidade,
        valor_frete, custo_estimado, lucro_estimado,
        status, observacoes
      ) VALUES (
        ${d.codigo_embarque},
        ${d.origem_nome ?? null}, ${d.origem_cidade ?? null}, ${d.origem_uf ?? null}, ${d.origem_endereco ?? null},
        ${d.destino_nome ?? null}, ${d.destino_cidade ?? null}, ${d.destino_uf ?? null}, ${d.destino_endereco ?? null},
        ${d.data_coleta ?? null}, ${d.data_previsao_entrega ?? null},
        ${veiculoId}, ${motoristaId},
        ${d.descricao_carga ?? null}, ${d.tipo_carga ?? null},
        ${d.peso_kg ?? null}, ${d.volume_m3 ?? null}, ${d.quantidade ?? null},
        ${d.valor_frete ?? null}, ${d.custo_estimado ?? null}, ${d.lucro_estimado ?? null},
        ${d.status ?? 'pendente'}, ${d.observacoes ?? null}
      )
      RETURNING *
    `;
    return res.status(201).json(rows[0]);
  }

  // ── PUT ──────────────────────────────────────────────────────────────────
  if (req.method === 'PUT') {
    const { id } = req.query;
    const d = req.body;

    const veiculoId   = await resolveVeiculoUuid(d.id_veiculo);
    const motoristaId = await resolveMotoristUuid(d.id_motorista);

    const rows = await sql`
      UPDATE embarques SET
        codigo_embarque        = ${d.codigo_embarque},
        origem_nome            = ${d.origem_nome ?? null},
        origem_cidade          = ${d.origem_cidade ?? null},
        origem_uf              = ${d.origem_uf ?? null},
        origem_endereco        = ${d.origem_endereco ?? null},
        destino_nome           = ${d.destino_nome ?? null},
        destino_cidade         = ${d.destino_cidade ?? null},
        destino_uf             = ${d.destino_uf ?? null},
        destino_endereco       = ${d.destino_endereco ?? null},
        data_coleta            = ${d.data_coleta ?? null},
        data_previsao_entrega  = ${d.data_previsao_entrega ?? null},
        data_entrega_real      = ${d.data_entrega_real ?? null},
        id_veiculo             = ${veiculoId},
        id_motorista           = ${motoristaId},
        descricao_carga        = ${d.descricao_carga ?? null},
        tipo_carga             = ${d.tipo_carga ?? null},
        peso_kg                = ${d.peso_kg ?? null},
        volume_m3              = ${d.volume_m3 ?? null},
        quantidade             = ${d.quantidade ?? null},
        valor_frete            = ${d.valor_frete ?? null},
        custo_estimado         = ${d.custo_estimado ?? null},
        lucro_estimado         = ${d.lucro_estimado ?? null},
        status                 = ${d.status ?? 'pendente'},
        observacoes            = ${d.observacoes ?? null}
      WHERE id_embarque = ${id as string}
      RETURNING *
    `;
    return res.status(200).json(rows[0]);
  }

  // ── DELETE ────────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const { id } = req.query;
    await sql`DELETE FROM embarques WHERE id_embarque = ${id as string}`;
    return res.status(200).json({ message: 'Embarque removido.' });
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
