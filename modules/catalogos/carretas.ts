/**
 * modules/catalogos/carretas.ts
 * CRUD de carretas — alinhado ao schema real do Neon.
 *
 * Schema:
 *   carretas.id              uuid PK
 *   carretas.id_carreta      text NOT NULL
 *   carretas.placa           text NOT NULL
 *   carretas.modelo          text
 *   carretas.marca           text   ← DB usa "marca", não "fabricante"
 *   carretas.ano             integer
 *   carretas.status          text
 *   carretas.proprietario_id uuid FK → proprietarios.id
 *   carretas.observacoes     text
 *   carretas.tipo_carroceria text
 */
import type { VercelResponse } from '@vercel/node';
import { getDb } from '../../server/db.js';
import { AuthenticatedRequest, generateId } from '../shared/middleware.js';

export async function handleCarretas(
  req: AuthenticatedRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  const sql = getDb();

  if (req.method === 'GET') {
    const { id, search } = req.query;

    if (id) {
      const rows = await sql`SELECT * FROM carretas WHERE id_carreta = ${id as string}`;
      return res.status(200).json(rows[0] ?? null);
    }

    const rows = search
      ? await sql`
          SELECT * FROM carretas
          WHERE placa            ILIKE ${'%' + search + '%'}
             OR COALESCE(modelo, '') ILIKE ${'%' + search + '%'}
             OR COALESCE(marca,  '') ILIKE ${'%' + search + '%'}
             OR COALESCE(tipo_carroceria, '') ILIKE ${'%' + search + '%'}
          ORDER BY placa
        `
      : await sql`SELECT * FROM carretas ORDER BY placa`;

    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const d = req.body;
    if (!d.placa?.trim()) {
      return res.status(400).json({ error: 'Campo obrigatório: placa.' });
    }

    // Resolver proprietario_id (uuid)
    let proprietarioUuid: string | null = null;
    if (d.proprietario_id) {
      const p = await sql`SELECT id FROM proprietarios WHERE id_proprietario = ${d.proprietario_id} OR id::text = ${d.proprietario_id} LIMIT 1`;
      proprietarioUuid = p[0]?.['id'] ?? null;
    }

    const id_carreta = generateId('CAR');
    const rows = await sql`
      INSERT INTO carretas (
        id_carreta, placa, modelo, marca, ano,
        tipo_carroceria, proprietario_id, status, observacoes
      ) VALUES (
        ${id_carreta},
        ${d.placa.toUpperCase()},
        ${d.modelo ?? null},
        ${d.marca ?? d.fabricante ?? null},
        ${d.ano ?? null},
        ${d.tipo_carroceria ?? null},
        ${proprietarioUuid},
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

    let proprietarioUuid: string | null = null;
    if (d.proprietario_id) {
      const p = await sql`SELECT id FROM proprietarios WHERE id_proprietario = ${d.proprietario_id} OR id::text = ${d.proprietario_id} LIMIT 1`;
      proprietarioUuid = p[0]?.['id'] ?? null;
    }

    const rows = await sql`
      UPDATE carretas SET
        placa           = ${d.placa?.toUpperCase() ?? null},
        modelo          = ${d.modelo ?? null},
        marca           = ${d.marca ?? d.fabricante ?? null},
        ano             = ${d.ano ?? null},
        tipo_carroceria = ${d.tipo_carroceria ?? null},
        proprietario_id = ${proprietarioUuid},
        status          = ${d.status ?? 'Ativo'},
        observacoes     = ${d.observacoes ?? null}
      WHERE id_carreta = ${id as string}
      RETURNING *
    `;
    return res.status(200).json(rows[0]);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    await sql`UPDATE carretas SET status = 'Inativo' WHERE id_carreta = ${id as string}`;
    return res.status(200).json({ message: 'Carreta desativada.' });
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
