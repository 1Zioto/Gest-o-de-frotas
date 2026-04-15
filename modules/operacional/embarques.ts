/**
 * modules/operacional/embarques.ts
 * CRUD de embarques.
 */
import type { VercelResponse } from '@vercel/node';
import { getDb } from '../../server/db.js';
import { AuthenticatedRequest } from '../shared/middleware.js';

export async function handleEmbarques(
  req: AuthenticatedRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  const sql = getDb();

  if (req.method === 'GET') {
    const { id, status, search } = req.query;

    if (id) {
      const rows = await sql`
        SELECT e.*,
               v.placa, v.modelo AS veiculo_modelo,
               m.nome AS motorista_nome
        FROM embarques e
        LEFT JOIN veiculos   v ON e.id_veiculo   = v.id
        LEFT JOIN motoristas m ON e.id_motorista::text = m.id_motorista
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
      LEFT JOIN motoristas m ON e.id_motorista::text = m.id_motorista
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

  if (req.method === 'POST') {
    const d = req.body;
    if (!d.codigo_embarque) return res.status(400).json({ error: 'código do embarque é obrigatório.' });

    // Resolver veiculo id (uuid)
    let veiculoId: string | null = null;
    if (d.id_veiculo) {
      const v = await sql`SELECT id FROM veiculos WHERE id_veiculo = ${d.id_veiculo} OR id::text = ${d.id_veiculo} LIMIT 1`;
      veiculoId = v[0]?.['id'] ?? null;
    }

    // Resolver motorista id (uuid tentativo via cast)
    let motoristaId: string | null = null;
    if (d.id_motorista) {
      // tenta UUID direto; se não for UUID válido, deixa null
      try {
        const m = await sql`SELECT id_motorista FROM motoristas WHERE id_motorista = ${d.id_motorista} LIMIT 1`;
        if (m[0]) motoristaId = d.id_motorista; // guarda como texto convertível
      } catch { motoristaId = null; }
    }

    const rows = await sql`
      INSERT INTO embarques (
        codigo_embarque,
        origem_nome, origem_cidade, origem_uf, origem_endereco,
        destino_nome, destino_cidade, destino_uf, destino_endereco,
        data_coleta, data_previsao_entrega,
        id_veiculo,
        descricao_carga, tipo_carga, peso_kg, volume_m3, quantidade,
        valor_frete, custo_estimado, lucro_estimado,
        status, observacoes
      ) VALUES (
        ${d.codigo_embarque},
        ${d.origem_nome ?? null}, ${d.origem_cidade ?? null}, ${d.origem_uf ?? null}, ${d.origem_endereco ?? null},
        ${d.destino_nome ?? null}, ${d.destino_cidade ?? null}, ${d.destino_uf ?? null}, ${d.destino_endereco ?? null},
        ${d.data_coleta ?? null}, ${d.data_previsao_entrega ?? null},
        ${veiculoId},
        ${d.descricao_carga ?? null}, ${d.tipo_carga ?? null}, ${d.peso_kg ?? null}, ${d.volume_m3 ?? null}, ${d.quantidade ?? null},
        ${d.valor_frete ?? null}, ${d.custo_estimado ?? null}, ${d.lucro_estimado ?? null},
        ${d.status ?? 'pendente'}, ${d.observacoes ?? null}
      )
      RETURNING *
    `;
    return res.status(201).json(rows[0]);
  }

  if (req.method === 'PUT') {
    const { id } = req.query;
    const d = req.body;

    let veiculoId: string | null = null;
    if (d.id_veiculo) {
      const v = await sql`SELECT id FROM veiculos WHERE id_veiculo = ${d.id_veiculo} OR id::text = ${d.id_veiculo} LIMIT 1`;
      veiculoId = v[0]?.['id'] ?? null;
    }

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

  if (req.method === 'DELETE') {
    const { id } = req.query;
    await sql`DELETE FROM embarques WHERE id_embarque = ${id as string}`;
    return res.status(200).json({ message: 'Embarque removido.' });
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
