/**
 * modules/operacional/tarefas.ts
 * CRUD de tarefas operacionais.
 */
import type { VercelResponse } from '@vercel/node';
import { getDb } from '../../server/db.js';
import { AuthenticatedRequest } from '../shared/middleware.js';

export async function handleTarefas(
  req: AuthenticatedRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  const sql = getDb();

  if (req.method === 'GET') {
    const { id, status, prioridade, search } = req.query;

    if (id) {
      const rows = await sql`
        SELECT t.*,
               e.codigo_embarque,
               m.nome AS motorista_nome,
               v.placa
        FROM tarefas t
        LEFT JOIN embarques  e ON t.id_embarque  = e.id_embarque
        LEFT JOIN motoristas m ON t.id_motorista::text = m.id_motorista
        LEFT JOIN veiculos   v ON t.id_veiculo   = v.id
        WHERE t.id_tarefa = ${id as string}
      `;
      return res.status(200).json(rows[0] ?? null);
    }

    const rows = await sql`
      SELECT t.*,
             e.codigo_embarque,
             m.nome AS motorista_nome,
             v.placa
      FROM tarefas t
      LEFT JOIN embarques  e ON t.id_embarque  = e.id_embarque
      LEFT JOIN motoristas m ON t.id_motorista::text = m.id_motorista
      LEFT JOIN veiculos   v ON t.id_veiculo   = v.id
      WHERE (${status    ? sql`t.status    = ${status as string}`    : sql`TRUE`})
        AND (${prioridade? sql`t.prioridade = ${prioridade as string}`: sql`TRUE`})
        AND (${search    ? sql`t.titulo ILIKE ${'%' + search + '%'} OR t.descricao ILIKE ${'%' + search + '%'}` : sql`TRUE`})
      ORDER BY
        CASE t.prioridade WHEN 'alta' THEN 1 WHEN 'media' THEN 2 ELSE 3 END,
        CASE t.status WHEN 'atrasado' THEN 1 WHEN 'em_andamento' THEN 2 WHEN 'pendente' THEN 3 ELSE 4 END,
        t.data_prazo ASC NULLS LAST
      LIMIT 300
    `;
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const d = req.body;
    if (!d.titulo) return res.status(400).json({ error: 'Título é obrigatório.' });

    // Resolver id_veiculo (uuid)
    let veiculoId: string | null = null;
    if (d.id_veiculo) {
      const v = await sql`SELECT id FROM veiculos WHERE id_veiculo = ${d.id_veiculo} OR id::text = ${d.id_veiculo} LIMIT 1`;
      veiculoId = v[0]?.['id'] ?? null;
    }

    const rows = await sql`
      INSERT INTO tarefas (
        titulo, descricao,
        id_embarque, id_veiculo,
        data_prazo,
        status, prioridade, observacoes
      ) VALUES (
        ${d.titulo}, ${d.descricao ?? null},
        ${d.id_embarque ?? null}, ${veiculoId},
        ${d.data_prazo ?? null},
        ${d.status ?? 'pendente'}, ${d.prioridade ?? 'media'}, ${d.observacoes ?? null}
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
      UPDATE tarefas SET
        titulo         = ${d.titulo},
        descricao      = ${d.descricao ?? null},
        id_embarque    = ${d.id_embarque ?? null},
        id_veiculo     = ${veiculoId},
        data_prazo     = ${d.data_prazo ?? null},
        data_conclusao = ${d.status === 'concluido' ? sql`NOW()` : sql`${d.data_conclusao ?? null}`},
        status         = ${d.status ?? 'pendente'},
        prioridade     = ${d.prioridade ?? 'media'},
        observacoes    = ${d.observacoes ?? null}
      WHERE id_tarefa = ${id as string}
      RETURNING *
    `;
    return res.status(200).json(rows[0]);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    await sql`DELETE FROM tarefas WHERE id_tarefa = ${id as string}`;
    return res.status(200).json({ message: 'Tarefa removida.' });
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
