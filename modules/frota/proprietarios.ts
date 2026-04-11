/**
 * modules/frota/proprietarios.ts
 * CRUD de proprietários.
 */
import type { VercelResponse } from '@vercel/node';
import { getDb } from '../../server/db.js';
import { AuthenticatedRequest, generateId } from '../shared/middleware.js';

export async function handleProprietarios(
  req: AuthenticatedRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  const sql = getDb();

  if (req.method === 'GET') {
    const { id } = req.query;
    if (id) {
      const rows = await sql`SELECT * FROM proprietarios WHERE id_proprietario = ${id as string}`;
      return res.status(200).json(rows[0] ?? null);
    }
    const rows = await sql`SELECT * FROM proprietarios ORDER BY nome`;
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const { nome, cpf_cnpj, telefone, email, endereco, cidade, uf, cep } = req.body;
    if (!nome) return res.status(400).json({ error: 'Campo obrigatório: nome.' });

    const id_proprietario = generateId('PRO');
    const rows = await sql`
      INSERT INTO proprietarios (id_proprietario, nome, cpf_cnpj, telefone, email, endereco, cidade, uf, cep)
      VALUES (${id_proprietario}, ${nome}, ${cpf_cnpj}, ${telefone}, ${email}, ${endereco}, ${cidade}, ${uf}, ${cep})
      RETURNING *
    `;
    return res.status(201).json(rows[0]);
  }

  if (req.method === 'PUT') {
    const { id } = req.query;
    const { nome, cpf_cnpj, telefone, email, endereco, cidade, uf, cep, ativo, bloqueado } = req.body;
    const rows = await sql`
      UPDATE proprietarios
      SET nome = ${nome}, cpf_cnpj = ${cpf_cnpj}, telefone = ${telefone}, email = ${email},
          endereco = ${endereco}, cidade = ${cidade}, uf = ${uf}, cep = ${cep},
          ativo = ${ativo}, bloqueado = ${bloqueado}
      WHERE id_proprietario = ${id as string}
      RETURNING *
    `;
    return res.status(200).json(rows[0]);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    await sql`UPDATE proprietarios SET ativo = FALSE WHERE id_proprietario = ${id as string}`;
    return res.status(200).json({ message: 'Proprietário desativado.' });
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
