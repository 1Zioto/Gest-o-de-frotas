/**
 * modules/catalogos/oficinas.ts
 * CRUD de oficinas mecânicas.
 */
import type { VercelResponse } from '@vercel/node';
import { getDb } from '../../server/db.js';
import { AuthenticatedRequest, generateId } from '../shared/middleware.js';

export async function handleOficinas(
  req: AuthenticatedRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  const sql = getDb();

  if (req.method === 'GET') {
    const { id, search } = req.query;

    if (id) {
      const rows = await sql`SELECT * FROM oficinas WHERE id_oficina = ${id as string}`;
      return res.status(200).json(rows[0] ?? null);
    }

    const rows = search
      ? await sql`
          SELECT * FROM oficinas
          WHERE nome ILIKE ${'%' + search + '%'}
             OR COALESCE(cnpj, '') ILIKE ${'%' + search + '%'}
          ORDER BY nome
        `
      : await sql`SELECT * FROM oficinas ORDER BY nome`;

    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const { nome, cnpj, cel } = req.body;
    if (!nome) return res.status(400).json({ error: 'Campo obrigatório: nome.' });

    const id_oficina = generateId('OFI');
    const rows = await sql`
      INSERT INTO oficinas (id_oficina, nome, cnpj, cel)
      VALUES (${id_oficina}, ${nome}, ${cnpj}, ${cel})
      RETURNING *
    `;
    return res.status(201).json(rows[0]);
  }

  if (req.method === 'PUT') {
    const { id } = req.query;
    const { nome, cnpj, cel, ativo } = req.body;
    const rows = await sql`
      UPDATE oficinas SET nome = ${nome}, cnpj = ${cnpj}, cel = ${cel}, ativo = ${ativo}
      WHERE id_oficina = ${id as string}
      RETURNING *
    `;
    return res.status(200).json(rows[0]);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    await sql`UPDATE oficinas SET ativo = FALSE WHERE id_oficina = ${id as string}`;
    return res.status(200).json({ message: 'Oficina desativada.' });
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
