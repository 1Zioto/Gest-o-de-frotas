/**
 * modules/frota/veiculos.ts
 * CRUD de veículos — alinhado ao schema real do banco Neon.
 *
 * Schema relevante:
 *   veiculos.id              uuid PK (gen_random_uuid)
 *   veiculos.id_veiculo      text NOT NULL  (chave de negócio)
 *   veiculos.placa           text NOT NULL
 *   veiculos.modelo          text NOT NULL  ← precisa de valor ou ''
 *   veiculos.proprietario_id uuid           ← FK para proprietarios.id (uuid)
 *
 *   proprietarios.id              uuid PK
 *   proprietarios.id_proprietario text      ← ID de negócio enviado pelo frontend
 */
import type { VercelResponse } from '@vercel/node';
import { getDb } from '../../server/db.js';
import { AuthenticatedRequest, generateId } from '../shared/middleware.js';

export async function handleVeiculos(
  req: AuthenticatedRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  const sql = getDb();

  // ─── GET ───────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { id, search } = req.query;

    if (id) {
      const rows = await sql`
        SELECT v.*, p.nome AS proprietario_nome
        FROM veiculos v
        LEFT JOIN proprietarios p ON v.proprietario_id = p.id
        WHERE v.id_veiculo = ${id as string}
      `;
      return res.status(200).json(rows[0] ?? null);
    }

    const rows = search
      ? await sql`
          SELECT v.*, p.nome AS proprietario_nome
          FROM veiculos v
          LEFT JOIN proprietarios p ON v.proprietario_id = p.id
          WHERE COALESCE(v.placa, '') ILIKE ${'%' + search + '%'}
             OR COALESCE(v.marca, '') ILIKE ${'%' + search + '%'}
             OR COALESCE(v.modelo, '') ILIKE ${'%' + search + '%'}
          ORDER BY COALESCE(v.placa, '')
        `
      : await sql`
          SELECT v.*, p.nome AS proprietario_nome
          FROM veiculos v
          LEFT JOIN proprietarios p ON v.proprietario_id = p.id
          ORDER BY COALESCE(v.placa, '')
        `;

    return res.status(200).json(rows);
  }

  // ─── POST ──────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const {
      placa, marca, modelo, ano, tipo_combustivel,
      numero_chassi, proprietario_id, odometro, renavam, cor, foto
    } = req.body ?? {};

    if (!placa?.trim()) {
      return res.status(400).json({ error: 'Campo obrigatório: placa.' });
    }

    const id_veiculo = generateId('VEI');

    // proprietario_id chega como id_proprietario (text) do frontend.
    // Precisamos converter para o uuid (id) da tabela proprietarios.
    let proprietarioUuid: string | null = null;
    if (proprietario_id) {
      const propRows = await sql`
        SELECT id FROM proprietarios
        WHERE id_proprietario = ${proprietario_id}
        LIMIT 1
      `;
      proprietarioUuid = propRows[0]?.['id'] ?? null;
    }

    const rows = await sql`
      INSERT INTO veiculos (
        id_veiculo, placa, modelo, marca, ano,
        tipo_combustivel, numero_chassi, proprietario_id,
        odometro, renavam, cor, foto
      ) VALUES (
        ${id_veiculo},
        ${(placa as string).toUpperCase()},
        ${(modelo as string | undefined) || ''},
        ${marca ?? null},
        ${ano ? parseInt(String(ano)) : null},
        ${tipo_combustivel ?? null},
        ${numero_chassi ?? null},
        ${proprietarioUuid},
        ${odometro ?? null},
        ${renavam ?? null},
        ${cor ?? null},
        ${foto ?? null}
      )
      RETURNING *
    `;
    return res.status(201).json(rows[0]);
  }

  // ─── PUT ───────────────────────────────────────────────────────────────────
  if (req.method === 'PUT') {
    const { id } = req.query;
    const {
      placa, marca, modelo, ano, tipo_combustivel,
      numero_chassi, proprietario_id, odometro, renavam, cor, foto, ativo
    } = req.body ?? {};

    // Resolver uuid do proprietário
    let proprietarioUuid: string | null = null;
    if (proprietario_id) {
      const propRows = await sql`
        SELECT id FROM proprietarios
        WHERE id_proprietario = ${proprietario_id}
        LIMIT 1
      `;
      proprietarioUuid = propRows[0]?.['id'] ?? null;
    }

    const rows = await sql`
      UPDATE veiculos SET
        placa            = ${placa ? (placa as string).toUpperCase() : null},
        modelo           = ${(modelo as string | undefined) || ''},
        marca            = ${marca ?? null},
        ano              = ${ano ? parseInt(String(ano)) : null},
        tipo_combustivel = ${tipo_combustivel ?? null},
        numero_chassi    = ${numero_chassi ?? null},
        proprietario_id  = ${proprietarioUuid},
        odometro         = ${odometro ?? null},
        renavam          = ${renavam ?? null},
        cor              = ${cor ?? null},
        foto             = ${foto ?? null},
        status           = ${ativo === false ? 'Inativo' : 'Ativo'},
        atualizado_em    = NOW()
      WHERE id_veiculo = ${id as string}
      RETURNING *
    `;
    return res.status(200).json(rows[0] ?? null);
  }

  // ─── DELETE ────────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const { id } = req.query;
    await sql`
      UPDATE veiculos SET status = 'Inativo', atualizado_em = NOW()
      WHERE id_veiculo = ${id as string}
    `;
    return res.status(200).json({ message: 'Veículo desativado.' });
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
