/**
 * modules/operacional/ctes.ts
 * CRUD de CTEs (Conhecimentos de Transporte Eletrônico).
 */
import type { VercelResponse } from '@vercel/node';
import { getDb } from '../../server/db.js';
import { AuthenticatedRequest } from '../shared/middleware.js';

export async function handleCtes(
  req: AuthenticatedRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  const sql = getDb();

  if (req.method === 'GET') {
    const { id, id_embarque, status, search } = req.query;

    if (id) {
      const rows = await sql`
        SELECT c.*, e.codigo_embarque
        FROM ctes c
        LEFT JOIN embarques e ON c.id_embarque = e.id_embarque
        WHERE c.id_cte = ${id as string}
      `;
      return res.status(200).json(rows[0] ?? null);
    }

    const rows = await sql`
      SELECT c.*, e.codigo_embarque,
             e.origem_cidade, e.destino_cidade
      FROM ctes c
      LEFT JOIN embarques e ON c.id_embarque = e.id_embarque
      WHERE (${id_embarque ? sql`c.id_embarque = ${id_embarque as string}` : sql`TRUE`})
        AND (${status ? sql`c.status = ${status as string}` : sql`TRUE`})
        AND (${search ? sql`
          c.numero_cte       ILIKE ${'%' + search + '%'} OR
          c.remetente_nome   ILIKE ${'%' + search + '%'} OR
          c.destinatario_nome ILIKE ${'%' + search + '%'} OR
          e.codigo_embarque  ILIKE ${'%' + search + '%'}
        ` : sql`TRUE`})
      ORDER BY c.created_at DESC
      LIMIT 200
    `;
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const d = req.body;
    if (!d.numero_cte || !d.id_embarque)
      return res.status(400).json({ error: 'numero_cte e id_embarque são obrigatórios.' });

    const rows = await sql`
      INSERT INTO ctes (
        numero_cte, serie, chave_acesso,
        id_embarque,
        remetente_nome, remetente_cnpj_cpf,
        destinatario_nome, destinatario_cnpj_cpf,
        origem_cidade, origem_uf,
        destino_cidade, destino_uf,
        valor_total, valor_frete, valor_imposto,
        data_emissao, data_autorizacao,
        status, xml_url, pdf_url
      ) VALUES (
        ${d.numero_cte}, ${d.serie ?? null}, ${d.chave_acesso ?? null},
        ${d.id_embarque},
        ${d.remetente_nome ?? null}, ${d.remetente_cnpj_cpf ?? null},
        ${d.destinatario_nome ?? null}, ${d.destinatario_cnpj_cpf ?? null},
        ${d.origem_cidade ?? null}, ${d.origem_uf ?? null},
        ${d.destino_cidade ?? null}, ${d.destino_uf ?? null},
        ${d.valor_total ?? null}, ${d.valor_frete ?? null}, ${d.valor_imposto ?? null},
        ${d.data_emissao ?? null}, ${d.data_autorizacao ?? null},
        ${d.status ?? 'emitido'}, ${d.xml_url ?? null}, ${d.pdf_url ?? null}
      )
      RETURNING *
    `;
    return res.status(201).json(rows[0]);
  }

  if (req.method === 'PUT') {
    const { id } = req.query;
    const d = req.body;
    const rows = await sql`
      UPDATE ctes SET
        numero_cte           = ${d.numero_cte},
        serie                = ${d.serie ?? null},
        chave_acesso         = ${d.chave_acesso ?? null},
        remetente_nome       = ${d.remetente_nome ?? null},
        remetente_cnpj_cpf   = ${d.remetente_cnpj_cpf ?? null},
        destinatario_nome    = ${d.destinatario_nome ?? null},
        destinatario_cnpj_cpf = ${d.destinatario_cnpj_cpf ?? null},
        origem_cidade        = ${d.origem_cidade ?? null},
        origem_uf            = ${d.origem_uf ?? null},
        destino_cidade       = ${d.destino_cidade ?? null},
        destino_uf           = ${d.destino_uf ?? null},
        valor_total          = ${d.valor_total ?? null},
        valor_frete          = ${d.valor_frete ?? null},
        valor_imposto        = ${d.valor_imposto ?? null},
        data_emissao         = ${d.data_emissao ?? null},
        data_autorizacao     = ${d.data_autorizacao ?? null},
        status               = ${d.status ?? 'emitido'},
        xml_url              = ${d.xml_url ?? null},
        pdf_url              = ${d.pdf_url ?? null}
      WHERE id_cte = ${id as string}
      RETURNING *
    `;
    return res.status(200).json(rows[0]);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    await sql`DELETE FROM ctes WHERE id_cte = ${id as string}`;
    return res.status(200).json({ message: 'CT-e removido.' });
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
