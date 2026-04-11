/**
 * modules/financeiro/registros.ts
 * CRUD de registros de ponto de motoristas.
 */
import type { VercelResponse } from '@vercel/node';
import { getDb } from '../../server/db.js';
import { AuthenticatedRequest, generateId } from '../shared/middleware.js';

export async function handleRegistros(
  req: AuthenticatedRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  const sql = getDb();

  if (req.method === 'GET') {
    const { id, motorista } = req.query;

    if (id) {
      const rows = await sql`
        SELECT r.*, m.nome AS motorista_nome
        FROM registros r
        LEFT JOIN motoristas m ON r.motorista_id = m.id_motorista
        WHERE r.id_registro = ${id as string}
      `;
      return res.status(200).json(rows[0] ?? null);
    }

    const rows = await sql`
      SELECT r.*, m.nome AS motorista_nome
      FROM registros r
      LEFT JOIN motoristas m ON r.motorista_id = m.id_motorista
      WHERE (${motorista ? sql`r.motorista_id = ${motorista as string}` : sql`TRUE`})
      ORDER BY r.data DESC, r.created_at DESC
    `;
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const d = req.body;
    const id_registro = generateId('REG');
    const rows = await sql`
      INSERT INTO registros (
        id_registro, motorista_id, status, data,
        hora_entrada1, hora_saida1, hora_entrada2, hora_saida2, total
      ) VALUES (
        ${id_registro}, ${d.motorista_id}, ${d.status ?? 'Aberto'}, ${d.data},
        ${d.hora_entrada1}, ${d.hora_saida1}, ${d.hora_entrada2}, ${d.hora_saida2}, ${d.total}
      )
      RETURNING *
    `;
    return res.status(201).json(rows[0]);
  }

  if (req.method === 'PUT') {
    const { id } = req.query;
    const d = req.body;
    const rows = await sql`
      UPDATE registros SET
        motorista_id = ${d.motorista_id}, status = ${d.status}, data = ${d.data},
        hora_entrada1 = ${d.hora_entrada1}, hora_saida1 = ${d.hora_saida1},
        hora_entrada2 = ${d.hora_entrada2}, hora_saida2 = ${d.hora_saida2},
        total = ${d.total}
      WHERE id_registro = ${id as string}
      RETURNING *
    `;
    return res.status(200).json(rows[0]);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    await sql`DELETE FROM registros WHERE id_registro = ${id as string}`;
    return res.status(200).json({ message: 'Registro removido.' });
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
