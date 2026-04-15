/**
 * modules/frota/transportes.ts
 * CRUD de transportes — cria a tabela automaticamente se não existir.
 */
import type { VercelResponse } from '@vercel/node';
import { getDb } from '../../server/db.js';
import { AuthenticatedRequest, generateId } from '../shared/middleware.js';

async function ensureTable() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS transportes (
      id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      id_transporte         text NOT NULL UNIQUE,
      data                  date,
      contrato_frete        text,
      veiculo_id            uuid,
      motorista_id          text,
      carreta_id            text,
      tipo_veiculo          text,
      origem                text,
      destino               text,
      distancia             numeric,
      tonelada              numeric,
      km_inicial            numeric,
      km_final              numeric,
      quantidade_eixos_rodo integer,
      valor_frete           numeric,
      frete_total           numeric,
      adiantamento_frete    numeric,
      saldo_frete           numeric,
      descontos             numeric,
      frete_liquido         numeric,
      valor_diaria          numeric,
      quantidade_diarias    integer,
      valor_total_diarias   numeric,
      valor_pedagio         numeric,
      resultado_liquido     numeric,
      margem_lucro          numeric,
      media_km_l            numeric,
      stl                   numeric,
      status                text DEFAULT 'Em andamento',
      viagem                text,
      observacoes           text,
      criado_em             timestamptz DEFAULT NOW()
    )
  `;
}

export async function handleTransportes(
  req: AuthenticatedRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  const sql = getDb();
  await ensureTable();

  if (req.method === 'GET') {
    const { id, from, to } = req.query;

    if (id) {
      const rows = await sql`
        SELECT t.*,
               v.placa,
               v.modelo,
               m.nome AS motorista_nome,
               c.placa AS carreta_placa
        FROM transportes t
        LEFT JOIN veiculos   v ON t.veiculo_id   = v.id
        LEFT JOIN motoristas m ON t.motorista_id  = m.id_motorista
        LEFT JOIN carretas   c ON t.carreta_id    = c.id_carreta
        WHERE t.id_transporte = ${id as string}
      `;
      return res.status(200).json(rows[0] ?? null);
    }

    const rows = await sql`
      SELECT t.*,
             v.placa,
             v.modelo,
             m.nome AS motorista_nome,
             c.placa AS carreta_placa
      FROM transportes t
      LEFT JOIN veiculos   v ON t.veiculo_id   = v.id
      LEFT JOIN motoristas m ON t.motorista_id  = m.id_motorista
      LEFT JOIN carretas   c ON t.carreta_id    = c.id_carreta
      WHERE (${from ? sql`t.data >= ${from as string}` : sql`TRUE`})
        AND (${to   ? sql`t.data <= ${to   as string}` : sql`TRUE`})
      ORDER BY COALESCE(t.data, t.criado_em::date) DESC
      LIMIT 300
    `;
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const d = req.body;
    const id_transporte = generateId('TRA');

    // Resolver veiculo_id (uuid) a partir de id_veiculo (text)
    let veiculoUuid: string | null = null;
    const veiculoParam = d.veiculo_id || d.id_veiculo;
    if (veiculoParam) {
      const v = await sql`SELECT id FROM veiculos WHERE id_veiculo = ${veiculoParam} OR id::text = ${veiculoParam} LIMIT 1`;
      veiculoUuid = v[0]?.['id'] ?? null;
    }

    // motorista_id e carreta_id ficam como text (id_motorista / id_carreta)
    const motoristaId = d.motorista_id || d.id_motorista || null;
    const carretaId   = d.carreta_id   || d.id_carreta   || null;

    const rows = await sql`
      INSERT INTO transportes (
        id_transporte, data, contrato_frete,
        veiculo_id, motorista_id, carreta_id, tipo_veiculo,
        origem, destino, distancia, tonelada,
        km_inicial, km_final, quantidade_eixos_rodo,
        valor_frete, frete_total, adiantamento_frete, saldo_frete, descontos,
        frete_liquido, valor_diaria, quantidade_diarias, valor_total_diarias,
        valor_pedagio, resultado_liquido, margem_lucro, media_km_l, stl,
        status, viagem, observacoes
      ) VALUES (
        ${id_transporte},
        ${d.data ?? null},
        ${d.contrato_frete ?? null},
        ${veiculoUuid},
        ${motoristaId},
        ${carretaId},
        ${d.tipo_veiculo ?? null},
        ${d.origem ?? null},
        ${d.destino ?? null},
        ${d.distancia ?? null},
        ${d.tonelada ?? null},
        ${d.km_inicial ?? null},
        ${d.km_final ?? null},
        ${d.quantidade_eixos_rodo ?? null},
        ${d.valor_frete ?? null},
        ${d.frete_total ?? null},
        ${d.adiantamento_frete ?? null},
        ${d.saldo_frete ?? null},
        ${d.descontos ?? null},
        ${d.frete_liquido ?? null},
        ${d.valor_diaria ?? null},
        ${d.quantidade_diarias ?? null},
        ${d.valor_total_diarias ?? null},
        ${d.valor_pedagio ?? null},
        ${d.resultado_liquido ?? null},
        ${d.margem_lucro ?? null},
        ${d.media_km_l ?? null},
        ${d.stl ?? null},
        ${d.status ?? 'Em andamento'},
        ${d.viagem ?? null},
        ${d.observacoes ?? null}
      )
      RETURNING *
    `;
    return res.status(201).json(rows[0]);
  }

  if (req.method === 'PUT') {
    const { id } = req.query;
    const d = req.body;

    let veiculoUuid: string | null = null;
    const veiculoParam = d.veiculo_id || d.id_veiculo;
    if (veiculoParam) {
      const v = await sql`SELECT id FROM veiculos WHERE id_veiculo = ${veiculoParam} OR id::text = ${veiculoParam} LIMIT 1`;
      veiculoUuid = v[0]?.['id'] ?? null;
    }

    const motoristaId = d.motorista_id || d.id_motorista || null;
    const carretaId   = d.carreta_id   || d.id_carreta   || null;

    const rows = await sql`
      UPDATE transportes SET
        data                  = ${d.data ?? null},
        contrato_frete        = ${d.contrato_frete ?? null},
        veiculo_id            = ${veiculoUuid},
        motorista_id          = ${motoristaId},
        carreta_id            = ${carretaId},
        tipo_veiculo          = ${d.tipo_veiculo ?? null},
        origem                = ${d.origem ?? null},
        destino               = ${d.destino ?? null},
        distancia             = ${d.distancia ?? null},
        tonelada              = ${d.tonelada ?? null},
        km_inicial            = ${d.km_inicial ?? null},
        km_final              = ${d.km_final ?? null},
        quantidade_eixos_rodo = ${d.quantidade_eixos_rodo ?? null},
        valor_frete           = ${d.valor_frete ?? null},
        frete_total           = ${d.frete_total ?? null},
        adiantamento_frete    = ${d.adiantamento_frete ?? null},
        saldo_frete           = ${d.saldo_frete ?? null},
        descontos             = ${d.descontos ?? null},
        frete_liquido         = ${d.frete_liquido ?? null},
        valor_diaria          = ${d.valor_diaria ?? null},
        quantidade_diarias    = ${d.quantidade_diarias ?? null},
        valor_total_diarias   = ${d.valor_total_diarias ?? null},
        valor_pedagio         = ${d.valor_pedagio ?? null},
        resultado_liquido     = ${d.resultado_liquido ?? null},
        margem_lucro          = ${d.margem_lucro ?? null},
        media_km_l            = ${d.media_km_l ?? null},
        stl                   = ${d.stl ?? null},
        status                = ${d.status ?? 'Em andamento'},
        viagem                = ${d.viagem ?? null},
        observacoes           = ${d.observacoes ?? null}
      WHERE id_transporte = ${id as string}
      RETURNING *
    `;
    return res.status(200).json(rows[0]);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    await sql`DELETE FROM transportes WHERE id_transporte = ${id as string}`;
    return res.status(200).json({ message: 'Transporte removido.' });
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
