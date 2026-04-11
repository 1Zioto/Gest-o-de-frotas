/**
 * modules/catalogos/valores.ts
 * CRUD de valores de combustível.
 */
import type { VercelResponse } from '@vercel/node';
import { getDb } from '../../server/db.js';
import { AuthenticatedRequest, generateId } from '../shared/middleware.js';

export async function handleValores(
  req: AuthenticatedRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  const sql = getDb();

  if (req.method === 'GET') {
    const { id } = req.query;

    if (id) {
      const rows = await sql`SELECT * FROM valor_combustivel WHERE id_valor = ${id as string}`;
      return res.status(200).json(rows[0] ?? null);
    }

    const rows = await sql`SELECT * FROM valor_combustivel ORDER BY data DESC`;
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const { tipo_combustivel, valor, data, responsavel } = req.body;
    const id_valor = generateId('VAL');
    const rows = await sql`
      INSERT INTO valor_combustivel (id_valor, tipo_combustivel, valor, data, responsavel)
      VALUES (${id_valor}, ${tipo_combustivel}, ${valor}, ${data}, ${responsavel})
      RETURNING *
    `;
    return res.status(201).json(rows[0]);
  }

  if (req.method === 'PUT') {
    const { id } = req.query;
    const { tipo_combustivel, valor, data, responsavel } = req.body;
    const rows = await sql`
      UPDATE valor_combustivel SET
        tipo_combustivel = ${tipo_combustivel}, valor = ${valor},
        data = ${data}, responsavel = ${responsavel}
      WHERE id_valor = ${id as string}
      RETURNING *
    `;
    return res.status(200).json(rows[0]);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    await sql`DELETE FROM valor_combustivel WHERE id_valor = ${id as string}`;
    return res.status(200).json({ message: 'Valor removido.' });
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
