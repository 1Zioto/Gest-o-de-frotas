/**
 * modules/frota/motoristas.ts
 * CRUD de motoristas.
 *
 * Migração lazy: adiciona coluna `id UUID` à tabela motoristas caso não exista,
 * garantindo que embarques e tarefas possam referenciar motoristas por UUID.
 */
import type { VercelResponse } from '@vercel/node';
import { getDb } from '../../server/db.js';
import { AuthenticatedRequest, generateId } from '../shared/middleware.js';

let migrationDone = false;

async function ensureMotoristasUuid() {
  if (migrationDone) return;
  const sql = getDb();
  // Adiciona coluna UUID se ainda não existir
  await sql`
    ALTER TABLE motoristas
    ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid()
  `;
  // Preenche linhas que ainda não têm UUID
  await sql`
    UPDATE motoristas SET id = gen_random_uuid() WHERE id IS NULL
  `;
  migrationDone = true;
}

export async function handleMotoristas(
  req: AuthenticatedRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  const sql = getDb();
  await ensureMotoristasUuid();

  if (req.method === 'GET') {
    const { id, search } = req.query;

    if (id) {
      const rows = await sql`
        SELECT m.*, p.nome AS proprietario_nome
        FROM motoristas m
        LEFT JOIN proprietarios p ON m.proprietario_id = p.id_proprietario
        WHERE m.id_motorista = ${id as string}
      `;
      return res.status(200).json(rows[0] ?? null);
    }

    const rows = search
      ? await sql`
          SELECT m.*, p.nome AS proprietario_nome
          FROM motoristas m
          LEFT JOIN proprietarios p ON m.proprietario_id = p.id_proprietario
          WHERE m.nome ILIKE ${'%' + search + '%'}
          ORDER BY m.nome
        `
      : await sql`
          SELECT m.*, p.nome AS proprietario_nome
          FROM motoristas m
          LEFT JOIN proprietarios p ON m.proprietario_id = p.id_proprietario
          ORDER BY m.nome
        `;

    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const { nome, proprietario_id, cnh, cel, email } = req.body;
    if (!nome) return res.status(400).json({ error: 'Campo obrigatório: nome.' });

    const id_motorista = generateId('MOT');
    const rows = await sql`
      INSERT INTO motoristas (id_motorista, nome, proprietario_id, cnh, cel, email)
      VALUES (${id_motorista}, ${nome}, ${proprietario_id}, ${cnh}, ${cel}, ${email})
      RETURNING *
    `;
    return res.status(201).json(rows[0]);
  }

  if (req.method === 'PUT') {
    const { id } = req.query;
    const { nome, proprietario_id, cnh, cel, email, ativo } = req.body;
    const rows = await sql`
      UPDATE motoristas
      SET nome = ${nome}, proprietario_id = ${proprietario_id}, cnh = ${cnh},
          cel = ${cel}, email = ${email}, ativo = ${ativo}
      WHERE id_motorista = ${id as string}
      RETURNING *
    `;
    return res.status(200).json(rows[0]);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    await sql`UPDATE motoristas SET ativo = FALSE WHERE id_motorista = ${id as string}`;
    return res.status(200).json({ message: 'Motorista desativado.' });
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
