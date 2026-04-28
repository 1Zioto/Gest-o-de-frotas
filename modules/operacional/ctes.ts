import type { VercelResponse } from '@vercel/node';
import { getDb } from '../../server/db.js';
import type { AuthenticatedRequest } from '../shared/middleware.js';
import { asBody, ensureOperationalDbInitialized, newId, toNumber } from './db.js';

function nullable(value: unknown) {
  return value === undefined || value === '' ? null : value;
}

export async function handleCtes(req: AuthenticatedRequest, res: VercelResponse) {
  await ensureOperationalDbInitialized();
  const sql = getDb();

  if (req.method === 'GET') {
    const rows = await sql`
      SELECT
        c.*,
        e.codigo_embarque,
        ctr.codigo_viagem,
        ctr.numero_container
      FROM ctes c
      LEFT JOIN embarques e ON e.id_embarque = c.id_embarque
      LEFT JOIN containers ctr ON ctr.id_container = c.id_container
      ORDER BY c.created_at DESC
    `;
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const body = asBody(req.body);
    if (!body['numero_cte']) return res.status(400).json({ error: 'Número do CT-e é obrigatório.' });
    if (!body['id_embarque']) return res.status(400).json({ error: 'Embarque é obrigatório.' });

    const id = newId('CTE');
    const rows = await sql`
      INSERT INTO ctes (
        id_cte, numero_cte, serie, chave_acesso, id_embarque, id_container, remetente_nome,
        remetente_cnpj_cpf, destinatario_nome, destinatario_cnpj_cpf, origem_cidade, origem_uf,
        destino_cidade, destino_uf, valor_total, valor_frete, valor_imposto, data_emissao,
        data_autorizacao, status, xml_url, pdf_url
      ) VALUES (
        ${id}, ${body['numero_cte']}, ${nullable(body['serie'])}, ${nullable(body['chave_acesso'])},
        ${nullable(body['id_embarque'])}, ${nullable(body['id_container'])}, ${nullable(body['remetente_nome'])},
        ${nullable(body['remetente_cnpj_cpf'])}, ${nullable(body['destinatario_nome'])},
        ${nullable(body['destinatario_cnpj_cpf'])}, ${nullable(body['origem_cidade'])}, ${nullable(body['origem_uf'])},
        ${nullable(body['destino_cidade'])}, ${nullable(body['destino_uf'])}, ${toNumber(body['valor_total'])},
        ${toNumber(body['valor_frete'])}, ${toNumber(body['valor_imposto'])}, ${nullable(body['data_emissao'])},
        ${nullable(body['data_autorizacao'])}, ${body['status'] || 'emitido'}, ${nullable(body['xml_url'])},
        ${nullable(body['pdf_url'])}
      )
      RETURNING *
    `;

    if (body['id_container']) {
      await sql`UPDATE containers SET id_cte = ${id}, updated_at = NOW() WHERE id_container = ${body['id_container']}`;
    }

    return res.status(201).json(rows[0]);
  }

  if (req.method === 'PUT') {
    const id = String(req.query['id'] || '');
    const body = asBody(req.body);
    if (!id) return res.status(400).json({ error: 'ID do CT-e é obrigatório.' });

    const rows = await sql`
      UPDATE ctes SET
        numero_cte = ${body['numero_cte']},
        serie = ${nullable(body['serie'])},
        chave_acesso = ${nullable(body['chave_acesso'])},
        id_embarque = ${nullable(body['id_embarque'])},
        id_container = ${nullable(body['id_container'])},
        remetente_nome = ${nullable(body['remetente_nome'])},
        remetente_cnpj_cpf = ${nullable(body['remetente_cnpj_cpf'])},
        destinatario_nome = ${nullable(body['destinatario_nome'])},
        destinatario_cnpj_cpf = ${nullable(body['destinatario_cnpj_cpf'])},
        origem_cidade = ${nullable(body['origem_cidade'])},
        origem_uf = ${nullable(body['origem_uf'])},
        destino_cidade = ${nullable(body['destino_cidade'])},
        destino_uf = ${nullable(body['destino_uf'])},
        valor_total = ${toNumber(body['valor_total'])},
        valor_frete = ${toNumber(body['valor_frete'])},
        valor_imposto = ${toNumber(body['valor_imposto'])},
        data_emissao = ${nullable(body['data_emissao'])},
        data_autorizacao = ${nullable(body['data_autorizacao'])},
        status = ${body['status'] || 'emitido'},
        xml_url = ${nullable(body['xml_url'])},
        pdf_url = ${nullable(body['pdf_url'])},
        updated_at = NOW()
      WHERE id_cte = ${id}
      RETURNING *
    `;

    if (!rows[0]) return res.status(404).json({ error: 'CT-e não encontrado.' });

    await sql`UPDATE containers SET id_cte = NULL WHERE id_cte = ${id}`;
    if (body['id_container']) {
      await sql`UPDATE containers SET id_cte = ${id}, updated_at = NOW() WHERE id_container = ${body['id_container']}`;
    }

    return res.status(200).json(rows[0]);
  }

  if (req.method === 'DELETE') {
    const id = String(req.query['id'] || '');
    if (!id) return res.status(400).json({ error: 'ID do CT-e é obrigatório.' });
    await sql`UPDATE containers SET id_cte = NULL WHERE id_cte = ${id}`;
    await sql`DELETE FROM ctes WHERE id_cte = ${id}`;
    return res.status(204).end();
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
