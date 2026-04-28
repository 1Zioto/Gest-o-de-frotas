import type { VercelResponse } from '@vercel/node';
import { getDb } from '../../server/db.js';
import type { AuthenticatedRequest } from '../shared/middleware.js';
import { asBody, ensureOperationalDbInitialized, newId } from './db.js';

function nextVipeCode(existing: string[], offset: number): string {
  const max = existing.reduce((acc, code) => {
    const match = /^VIPE-(\d+)$/.exec(code || '');
    return match ? Math.max(acc, Number(match[1])) : acc;
  }, 0);
  return `VIPE-${String(max + offset).padStart(6, '0')}`;
}

export async function handleContainers(req: AuthenticatedRequest, res: VercelResponse) {
  await ensureOperationalDbInitialized();
  const sql = getDb();

  if (req.method === 'GET') {
    const rows = await sql`
      SELECT
        c.*,
        e.codigo_embarque,
        e.origem_cidade,
        e.origem_uf,
        e.destino_cidade,
        e.destino_uf,
        cte.numero_cte
      FROM containers c
      JOIN embarques e ON e.id_embarque = c.id_embarque
      LEFT JOIN ctes cte ON cte.id_cte = c.id_cte OR cte.id_container = c.id_container
      ORDER BY c.created_at DESC, c.codigo_viagem DESC
    `;
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const body = asBody(req.body);
    if (body['action'] !== 'gerar-ordem') return res.status(400).json({ error: 'Ação inválida para containers.' });

    const idEmbarque = String(body['id_embarque'] || '');
    if (!idEmbarque) return res.status(400).json({ error: 'Embarque é obrigatório.' });

    const embarques = await sql`SELECT * FROM embarques WHERE id_embarque = ${idEmbarque} LIMIT 1`;
    const embarque = embarques[0];
    if (!embarque) return res.status(404).json({ error: 'Embarque não encontrado.' });

    const desejado = Number(embarque['quantidade_containers']) || 0;
    if (desejado <= 0) return res.status(400).json({ error: 'O embarque não possui quantidade de containers informada.' });

    const existentes = await sql`SELECT id_container FROM containers WHERE id_embarque = ${idEmbarque}`;
    const faltantes = Math.max(desejado - existentes.length, 0);
    const codigos = await sql`SELECT codigo_viagem FROM containers WHERE codigo_viagem LIKE 'VIPE-%'`;
    const existingCodes = codigos.map(row => String(row['codigo_viagem']));

    for (let i = 1; i <= faltantes; i += 1) {
      await sql`
        INSERT INTO containers (id_container, codigo_viagem, id_embarque, status)
        VALUES (${newId('CTR')}, ${nextVipeCode(existingCodes, i)}, ${idEmbarque}, 'pendente')
      `;
    }

    await sql`UPDATE embarques SET ordem_gerada = TRUE, updated_at = NOW() WHERE id_embarque = ${idEmbarque}`;
    return res.status(201).json({ created: faltantes, total: Math.max(desejado, existentes.length) });
  }

  if (req.method === 'PUT') {
    const id = String(req.query['id'] || '');
    const body = asBody(req.body);
    if (!id) return res.status(400).json({ error: 'ID do container é obrigatório.' });

    const idCte = body['id_cte'] || null;
    const numeroContainer = body['numero_container'] || null;

    if (idCte) {
      await sql`UPDATE containers SET id_cte = NULL WHERE id_cte = ${idCte} AND id_container <> ${id}`;
    }

    const rows = await sql`
      UPDATE containers
      SET numero_container = ${numeroContainer}, id_cte = ${idCte}, updated_at = NOW()
      WHERE id_container = ${id}
      RETURNING *
    `;
    const container = rows[0];
    if (!container) return res.status(404).json({ error: 'Container não encontrado.' });

    if (idCte) {
      await sql`
        UPDATE ctes
        SET id_container = ${id}, id_embarque = ${container['id_embarque'] as string}, updated_at = NOW()
        WHERE id_cte = ${idCte}
      `;
    }

    return res.status(200).json(container);
  }

  if (req.method === 'DELETE') {
    const id = String(req.query['id'] || '');
    if (!id) return res.status(400).json({ error: 'ID do container é obrigatório.' });
    await sql`DELETE FROM containers WHERE id_container = ${id}`;
    return res.status(204).end();
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
