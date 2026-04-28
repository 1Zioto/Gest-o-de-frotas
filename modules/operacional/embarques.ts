import type { VercelResponse } from '@vercel/node';
import { getDb } from '../../server/db.js';
import type { AuthenticatedRequest } from '../shared/middleware.js';
import { asBody, ensureOperationalDbInitialized, newId, toNumber } from './db.js';

function nullable(value: unknown) {
  return value === undefined || value === '' ? null : value;
}

export async function handleEmbarques(req: AuthenticatedRequest, res: VercelResponse) {
  await ensureOperationalDbInitialized();
  const sql = getDb();

  if (req.method === 'GET') {
    const rows = await sql`
      SELECT
        e.*,
        v.placa,
        v.modelo AS veiculo_modelo,
        m.nome AS motorista_nome,
        COUNT(c.id_container)::int AS containers_gerados
      FROM embarques e
      LEFT JOIN veiculos v ON v.id_veiculo = e.id_veiculo
      LEFT JOIN motoristas m ON m.id_motorista = e.id_motorista OR m.id::text = e.id_motorista
      LEFT JOIN containers c ON c.id_embarque = e.id_embarque
      GROUP BY e.id_embarque, v.placa, v.modelo, m.nome
      ORDER BY e.created_at DESC
    `;
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const body = asBody(req.body);
    if (!body['codigo_embarque']) return res.status(400).json({ error: 'Código do embarque é obrigatório.' });

    const id = newId('EMB');
    const rows = await sql`
      INSERT INTO embarques (
        id_embarque, codigo_embarque, origem_nome, origem_cidade, origem_uf, origem_endereco,
        destino_nome, destino_cidade, destino_uf, destino_endereco, data_coleta, data_previsao_entrega,
        data_entrega_real, id_veiculo, id_motorista, descricao_carga, tipo_carga, peso_kg, volume_m3,
        quantidade, quantidade_containers, valor_frete, custo_estimado, lucro_estimado, status, observacoes
      ) VALUES (
        ${id}, ${body['codigo_embarque']}, ${nullable(body['origem_nome'])}, ${nullable(body['origem_cidade'])},
        ${nullable(body['origem_uf'])}, ${nullable(body['origem_endereco'])}, ${nullable(body['destino_nome'])},
        ${nullable(body['destino_cidade'])}, ${nullable(body['destino_uf'])}, ${nullable(body['destino_endereco'])},
        ${nullable(body['data_coleta'])}, ${nullable(body['data_previsao_entrega'])}, ${nullable(body['data_entrega_real'])},
        ${nullable(body['id_veiculo'])}, ${nullable(body['id_motorista'])}, ${nullable(body['descricao_carga'])},
        ${nullable(body['tipo_carga'])}, ${toNumber(body['peso_kg'])}, ${toNumber(body['volume_m3'])},
        ${toNumber(body['quantidade'])}, ${toNumber(body['quantidade_containers']) || 0}, ${toNumber(body['valor_frete'])},
        ${toNumber(body['custo_estimado'])}, ${toNumber(body['lucro_estimado'])}, ${body['status'] || 'pendente'},
        ${nullable(body['observacoes'])}
      )
      RETURNING *
    `;
    return res.status(201).json(rows[0]);
  }

  if (req.method === 'PUT') {
    const id = String(req.query['id'] || '');
    const body = asBody(req.body);
    if (!id) return res.status(400).json({ error: 'ID do embarque é obrigatório.' });

    const rows = await sql`
      UPDATE embarques SET
        codigo_embarque = ${body['codigo_embarque']},
        origem_nome = ${nullable(body['origem_nome'])},
        origem_cidade = ${nullable(body['origem_cidade'])},
        origem_uf = ${nullable(body['origem_uf'])},
        origem_endereco = ${nullable(body['origem_endereco'])},
        destino_nome = ${nullable(body['destino_nome'])},
        destino_cidade = ${nullable(body['destino_cidade'])},
        destino_uf = ${nullable(body['destino_uf'])},
        destino_endereco = ${nullable(body['destino_endereco'])},
        data_coleta = ${nullable(body['data_coleta'])},
        data_previsao_entrega = ${nullable(body['data_previsao_entrega'])},
        data_entrega_real = ${nullable(body['data_entrega_real'])},
        id_veiculo = ${nullable(body['id_veiculo'])},
        id_motorista = ${nullable(body['id_motorista'])},
        descricao_carga = ${nullable(body['descricao_carga'])},
        tipo_carga = ${nullable(body['tipo_carga'])},
        peso_kg = ${toNumber(body['peso_kg'])},
        volume_m3 = ${toNumber(body['volume_m3'])},
        quantidade = ${toNumber(body['quantidade'])},
        quantidade_containers = ${toNumber(body['quantidade_containers']) || 0},
        valor_frete = ${toNumber(body['valor_frete'])},
        custo_estimado = ${toNumber(body['custo_estimado'])},
        lucro_estimado = ${toNumber(body['lucro_estimado'])},
        status = ${body['status'] || 'pendente'},
        observacoes = ${nullable(body['observacoes'])},
        updated_at = NOW()
      WHERE id_embarque = ${id}
      RETURNING *
    `;
    return rows[0] ? res.status(200).json(rows[0]) : res.status(404).json({ error: 'Embarque não encontrado.' });
  }

  if (req.method === 'DELETE') {
    const id = String(req.query['id'] || '');
    if (!id) return res.status(400).json({ error: 'ID do embarque é obrigatório.' });
    await sql`DELETE FROM embarques WHERE id_embarque = ${id}`;
    return res.status(204).end();
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
