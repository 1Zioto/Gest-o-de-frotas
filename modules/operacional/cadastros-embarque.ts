import type { VercelResponse } from '@vercel/node';
import { getDb } from '../../server/db.js';
import type { AuthenticatedRequest } from '../shared/middleware.js';
import { asBody, ensureOperationalDbInitialized, newId } from './db.js';

const TIPOS_VALIDOS = [
  'cliente',
  'mercadoria',
  'terminal',
  'armazem_carregamento',
  'municipio',
  'uf',
  'exportador',
  'navio_viagem',
  'armador',
  'embalagem',
  'importador',
  'destino',
  'descarga',
];

function nullable(value: unknown) {
  return value === undefined || value === '' ? null : value;
}

function parseAtivo(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true;
  return value === true || value === 'true' || value === 1 || value === '1';
}

function validate(body: Record<string, any>): string | null {
  if (!TIPOS_VALIDOS.includes(String(body['tipo'] || ''))) return 'Tipo de cadastro inválido.';
  if (!String(body['nome'] || '').trim()) return 'Nome é obrigatório.';
  return null;
}

export async function handleCadastrosEmbarque(req: AuthenticatedRequest, res: VercelResponse) {
  await ensureOperationalDbInitialized();
  const sql = getDb();

  if (req.method === 'GET') {
    const tipo = String(req.query['tipo'] || '');
    const rows = tipo
      ? await sql`
          SELECT *
          FROM embarque_cadastros
          WHERE tipo = ${tipo}
          ORDER BY ativo DESC, nome ASC
        `
      : await sql`
          SELECT *
          FROM embarque_cadastros
          ORDER BY tipo ASC, ativo DESC, nome ASC
        `;
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const body = asBody(req.body);
    const error = validate(body);
    if (error) return res.status(400).json({ error });

    const rows = await sql`
      INSERT INTO embarque_cadastros (id_cadastro, tipo, nome, codigo, uf, observacoes, ativo)
      VALUES (
        ${newId('CAD-EMB')},
        ${body['tipo']},
        ${String(body['nome']).trim()},
        ${nullable(body['codigo'])},
        ${nullable(body['uf'])},
        ${nullable(body['observacoes'])},
        ${parseAtivo(body['ativo'])}
      )
      RETURNING *
    `;
    return res.status(201).json(rows[0]);
  }

  if (req.method === 'PUT') {
    const id = String(req.query['id'] || '');
    const body = asBody(req.body);
    if (!id) return res.status(400).json({ error: 'ID do cadastro é obrigatório.' });
    const error = validate(body);
    if (error) return res.status(400).json({ error });

    const rows = await sql`
      UPDATE embarque_cadastros
      SET
        tipo = ${body['tipo']},
        nome = ${String(body['nome']).trim()},
        codigo = ${nullable(body['codigo'])},
        uf = ${nullable(body['uf'])},
        observacoes = ${nullable(body['observacoes'])},
        ativo = ${parseAtivo(body['ativo'])},
        updated_at = NOW()
      WHERE id_cadastro = ${id}
      RETURNING *
    `;
    return rows[0] ? res.status(200).json(rows[0]) : res.status(404).json({ error: 'Cadastro não encontrado.' });
  }

  if (req.method === 'DELETE') {
    const id = String(req.query['id'] || '');
    if (!id) return res.status(400).json({ error: 'ID do cadastro é obrigatório.' });
    await sql`DELETE FROM embarque_cadastros WHERE id_cadastro = ${id}`;
    return res.status(204).end();
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
