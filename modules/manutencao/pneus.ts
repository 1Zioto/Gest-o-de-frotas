/**
 * modules/manutencao/pneus.ts
 * CRUD de pneus — alinhado ao schema real do Neon.
 *
 * Schema:
 *   pneus.id                    uuid PK
 *   pneus.id_pneu               text NOT NULL
 *   pneus.numero                integer
 *   pneus.veiculo_id            uuid FK → veiculos.id
 *   pneus.posicao               text
 *   pneus.data_instalacao       date
 *   pneus.quilometragem_inicial numeric
 *   pneus.data_substituicao     date
 *   pneus.quilometragem_final   numeric
 *   pneus.status                text
 *   pneus.marca                 text
 *   pneus.modelo                text
 *   pneus.medida                text
 *   pneus.observacoes           text
 */
import type { VercelResponse } from '@vercel/node';
import { getDb } from '../../server/db.js';
import { AuthenticatedRequest, generateId } from '../shared/middleware.js';

export async function handlePneus(
  req: AuthenticatedRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  const sql = getDb();

  if (req.method === 'GET') {
    const { id, veiculo } = req.query;

    if (id) {
      const rows = await sql`
        SELECT p.*, v.placa
        FROM pneus p
        LEFT JOIN veiculos v ON p.veiculo_id = v.id
        WHERE p.id_pneu = ${id as string}
      `;
      return res.status(200).json(rows[0] ?? null);
    }

    const rows = await sql`
      SELECT p.*, v.placa
      FROM pneus p
      LEFT JOIN veiculos v ON p.veiculo_id = v.id
      WHERE (${veiculo ? sql`v.id_veiculo = ${veiculo as string} OR p.veiculo_id::text = ${veiculo as string}` : sql`TRUE`})
      ORDER BY COALESCE(p.criado_em, NOW()) DESC
    `;
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const d = req.body;
    const id_pneu = generateId('PNE');

    // veiculo_id pode chegar como id_veiculo (text) — converter para uuid
    let veiculoUuid: string | null = null;
    const veiculoParam = d.veiculo_id || d.id_veiculo;
    if (veiculoParam) {
      const v = await sql`SELECT id FROM veiculos WHERE id_veiculo = ${veiculoParam} OR id::text = ${veiculoParam} LIMIT 1`;
      veiculoUuid = v[0]?.['id'] ?? null;
    }

    const rows = await sql`
      INSERT INTO pneus (
        id_pneu, numero, marca, modelo, medida,
        quilometragem_inicial, veiculo_id, posicao,
        data_instalacao, data_substituicao,
        quilometragem_final, status, observacoes
      ) VALUES (
        ${id_pneu},
        ${d.numero ?? null},
        ${d.marca ?? null},
        ${d.modelo ?? null},
        ${d.medida ?? null},
        ${d.quilometragem_inicial ?? d.km_inicial ?? null},
        ${veiculoUuid},
        ${d.posicao ?? null},
        ${d.data_instalacao ?? null},
        ${d.data_substituicao ?? null},
        ${d.quilometragem_final ?? d.km_final ?? null},
        ${d.status ?? 'Ativo'},
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
    }

    const rows = await sql`
      UPDATE pneus SET
        numero                 = ${d.numero ?? null},
        marca                  = ${d.marca ?? null},
        modelo                 = ${d.modelo ?? null},
        medida                 = ${d.medida ?? null},
        quilometragem_inicial  = ${d.quilometragem_inicial ?? d.km_inicial ?? null},
        veiculo_id             = ${veiculoUuid},
        posicao                = ${d.posicao ?? null},
        data_instalacao        = ${d.data_instalacao ?? null},
        data_substituicao      = ${d.data_substituicao ?? null},
        quilometragem_final    = ${d.quilometragem_final ?? d.km_final ?? null},
        status                 = ${d.status ?? 'Ativo'},
        observacoes            = ${d.observacoes ?? null}
      WHERE id_pneu = ${id as string}
      RETURNING *
    `;
    return res.status(200).json(rows[0]);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    await sql`DELETE FROM pneus WHERE id_pneu = ${id as string}`;
    return res.status(200).json({ message: 'Pneu removido.' });
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
