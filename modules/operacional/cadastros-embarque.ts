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
] as const;

const TABELAS_PROPRIAS = new Set(['cliente', 'mercadoria', 'armazem_carregamento', 'exportador', 'armador', 'importador', 'destino']);

type TipoCadastro = (typeof TIPOS_VALIDOS)[number];

function nullable(value: unknown) {
  return value === undefined || value === '' ? null : value;
}

function str(value: unknown): string {
  return String(value || '').trim();
}

function parseAtivo(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true;
  return value === true || value === 'true' || value === 1 || value === '1';
}

function isTipo(value: unknown): value is TipoCadastro {
  return TIPOS_VALIDOS.includes(String(value || '') as TipoCadastro);
}

function validate(body: Record<string, any>): string | null {
  if (!isTipo(body['tipo'])) return 'Tipo de cadastro inválido.';
  if (!str(body['nome'])) return 'Nome é obrigatório.';
  return null;
}

function decodeId(id: string): { source: string; rawId: string } {
  const [source, ...rest] = id.split(':');
  return { source, rawId: rest.join(':') || id };
}

function rowCadastro(tipo: TipoCadastro, row: Record<string, any>, source: string, nome: string, codigo?: string | null, uf?: string | null, observacoes?: string | null) {
  return {
    id_cadastro: `${source}:${row['id']}`,
    tipo,
    nome,
    codigo: codigo || '',
    uf: uf || '',
    observacoes: observacoes || '',
    ativo: true,
    source,
    created_at: row['created_at'] || null,
  };
}

async function nextIntegerId(sql: ReturnType<typeof getDb>, table: string): Promise<number> {
  switch (table) {
    case 'clientes': {
      const rows = await sql`SELECT COALESCE(MAX(id), 0)::int + 1 AS id FROM clientes`;
      return Number(rows[0]['id']);
    }
    case 'mercadorias': {
      const rows = await sql`SELECT COALESCE(MAX(id), 0)::int + 1 AS id FROM mercadorias`;
      return Number(rows[0]['id']);
    }
    case 'armadores': {
      const rows = await sql`SELECT COALESCE(MAX(id), 0)::int + 1 AS id FROM armadores`;
      return Number(rows[0]['id']);
    }
    case 'armazens': {
      const rows = await sql`SELECT COALESCE(MAX(id), 0)::int + 1 AS id FROM armazens`;
      return Number(rows[0]['id']);
    }
    case 'destinos': {
      const rows = await sql`SELECT COALESCE(MAX(id), 0)::int + 1 AS id FROM destinos`;
      return Number(rows[0]['id']);
    }
    case 'empresas': {
      const rows = await sql`SELECT COALESCE(MAX(id), 0)::int + 1 AS id FROM empresas`;
      return Number(rows[0]['id']);
    }
    default:
      throw new Error(`Tabela sem geração de ID configurada: ${table}`);
  }
}

async function listTipo(sql: ReturnType<typeof getDb>, tipo: TipoCadastro) {
  switch (tipo) {
    case 'cliente': {
      const rows = await sql`SELECT * FROM clientes ORDER BY nome ASC`;
      return rows.map(r => rowCadastro(tipo, r, 'clientes', String(r['nome']), r['cnpj'] as string | null, null, r['contato'] as string | null));
    }
    case 'mercadoria': {
      const rows = await sql`SELECT * FROM mercadorias ORDER BY descricao ASC`;
      return rows.map(r => rowCadastro(tipo, r, 'mercadorias', String(r['descricao']), r['ncm'] as string | null, null, r['unidade'] as string | null));
    }
    case 'armador': {
      const rows = await sql`SELECT * FROM armadores ORDER BY nome ASC`;
      return rows.map(r => rowCadastro(tipo, r, 'armadores', String(r['nome']), r['codigo'] as string | null));
    }
    case 'armazem_carregamento': {
      const rows = await sql`SELECT * FROM armazens ORDER BY nome ASC`;
      return rows.map(r => rowCadastro(tipo, r, 'armazens', String(r['nome']), r['municipio'] as string | null, r['uf'] as string | null, r['endereco'] as string | null));
    }
    case 'destino': {
      const rows = await sql`SELECT * FROM destinos ORDER BY pais ASC, porto ASC`;
      return rows.map(r => rowCadastro(tipo, r, 'destinos', String(r['porto'] || r['pais']), r['codigo'] as string | null, null, r['pais'] as string | null));
    }
    case 'exportador':
    case 'importador': {
      const rows = await sql`SELECT * FROM empresas ORDER BY razao_social ASC`;
      return rows.map(r => rowCadastro(tipo, r, 'empresas', String(r['razao_social']), r['cnpj'] as string | null, r['uf'] as string | null, r['cidade'] as string | null));
    }
    default: {
      const rows = await sql`
        SELECT *
        FROM embarque_cadastros
        WHERE tipo = ${tipo}
        ORDER BY ativo DESC, nome ASC
      `;
      return rows;
    }
  }
}

async function createCadastro(sql: ReturnType<typeof getDb>, body: Record<string, any>) {
  const tipo = body['tipo'] as TipoCadastro;
  const nome = str(body['nome']);

  switch (tipo) {
    case 'cliente': {
      const id = await nextIntegerId(sql, 'clientes');
      const rows = await sql`INSERT INTO clientes (id, nome, cnpj, contato) VALUES (${id}, ${nome}, ${nullable(body['codigo'])}, ${nullable(body['observacoes'])}) RETURNING *`;
      return rowCadastro(tipo, rows[0], 'clientes', String(rows[0]['nome']), rows[0]['cnpj'] as string | null, null, rows[0]['contato'] as string | null);
    }
    case 'mercadoria': {
      const id = await nextIntegerId(sql, 'mercadorias');
      const rows = await sql`INSERT INTO mercadorias (id, descricao, ncm, unidade) VALUES (${id}, ${nome}, ${nullable(body['codigo'])}, ${nullable(body['observacoes'])}) RETURNING *`;
      return rowCadastro(tipo, rows[0], 'mercadorias', String(rows[0]['descricao']), rows[0]['ncm'] as string | null, null, rows[0]['unidade'] as string | null);
    }
    case 'armador': {
      const id = await nextIntegerId(sql, 'armadores');
      const rows = await sql`INSERT INTO armadores (id, nome, codigo) VALUES (${id}, ${nome}, ${nullable(body['codigo'])}) RETURNING *`;
      return rowCadastro(tipo, rows[0], 'armadores', String(rows[0]['nome']), rows[0]['codigo'] as string | null);
    }
    case 'armazem_carregamento': {
      const id = await nextIntegerId(sql, 'armazens');
      const rows = await sql`INSERT INTO armazens (id, nome, municipio, uf, endereco) VALUES (${id}, ${nome}, ${nullable(body['codigo'])}, ${nullable(body['uf'])}, ${nullable(body['observacoes'])}) RETURNING *`;
      return rowCadastro(tipo, rows[0], 'armazens', String(rows[0]['nome']), rows[0]['municipio'] as string | null, rows[0]['uf'] as string | null, rows[0]['endereco'] as string | null);
    }
    case 'destino': {
      const id = await nextIntegerId(sql, 'destinos');
      const pais = str(body['observacoes']) || nome;
      const rows = await sql`INSERT INTO destinos (id, pais, porto, codigo) VALUES (${id}, ${pais}, ${nome}, ${nullable(body['codigo'])}) RETURNING *`;
      return rowCadastro(tipo, rows[0], 'destinos', String(rows[0]['porto'] || rows[0]['pais']), rows[0]['codigo'] as string | null, null, rows[0]['pais'] as string | null);
    }
    case 'exportador':
    case 'importador': {
      const id = await nextIntegerId(sql, 'empresas');
      const rows = await sql`INSERT INTO empresas (id, razao_social, cnpj, cidade, uf) VALUES (${id}, ${nome}, ${nullable(body['codigo'])}, ${nullable(body['observacoes'])}, ${nullable(body['uf'])}) RETURNING *`;
      return rowCadastro(tipo, rows[0], 'empresas', String(rows[0]['razao_social']), rows[0]['cnpj'] as string | null, rows[0]['uf'] as string | null, rows[0]['cidade'] as string | null);
    }
    default: {
      const rows = await sql`
        INSERT INTO embarque_cadastros (id_cadastro, tipo, nome, codigo, uf, observacoes, ativo)
        VALUES (${newId('CAD-EMB')}, ${tipo}, ${nome}, ${nullable(body['codigo'])}, ${nullable(body['uf'])}, ${nullable(body['observacoes'])}, ${parseAtivo(body['ativo'])})
        RETURNING *
      `;
      return rows[0];
    }
  }
}

async function updateCadastro(sql: ReturnType<typeof getDb>, id: string, body: Record<string, any>) {
  const tipo = body['tipo'] as TipoCadastro;
  const nome = str(body['nome']);
  const { source, rawId } = decodeId(id);

  switch (source) {
    case 'clientes': {
      const rows = await sql`UPDATE clientes SET nome = ${nome}, cnpj = ${nullable(body['codigo'])}, contato = ${nullable(body['observacoes'])} WHERE id = ${Number(rawId)} RETURNING *`;
      return rows[0] ? rowCadastro(tipo, rows[0], 'clientes', String(rows[0]['nome']), rows[0]['cnpj'] as string | null, null, rows[0]['contato'] as string | null) : null;
    }
    case 'mercadorias': {
      const rows = await sql`UPDATE mercadorias SET descricao = ${nome}, ncm = ${nullable(body['codigo'])}, unidade = ${nullable(body['observacoes'])} WHERE id = ${Number(rawId)} RETURNING *`;
      return rows[0] ? rowCadastro(tipo, rows[0], 'mercadorias', String(rows[0]['descricao']), rows[0]['ncm'] as string | null, null, rows[0]['unidade'] as string | null) : null;
    }
    case 'armadores': {
      const rows = await sql`UPDATE armadores SET nome = ${nome}, codigo = ${nullable(body['codigo'])} WHERE id = ${Number(rawId)} RETURNING *`;
      return rows[0] ? rowCadastro(tipo, rows[0], 'armadores', String(rows[0]['nome']), rows[0]['codigo'] as string | null) : null;
    }
    case 'armazens': {
      const rows = await sql`UPDATE armazens SET nome = ${nome}, municipio = ${nullable(body['codigo'])}, uf = ${nullable(body['uf'])}, endereco = ${nullable(body['observacoes'])} WHERE id = ${Number(rawId)} RETURNING *`;
      return rows[0] ? rowCadastro(tipo, rows[0], 'armazens', String(rows[0]['nome']), rows[0]['municipio'] as string | null, rows[0]['uf'] as string | null, rows[0]['endereco'] as string | null) : null;
    }
    case 'destinos': {
      const pais = str(body['observacoes']) || nome;
      const rows = await sql`UPDATE destinos SET pais = ${pais}, porto = ${nome}, codigo = ${nullable(body['codigo'])} WHERE id = ${Number(rawId)} RETURNING *`;
      return rows[0] ? rowCadastro(tipo, rows[0], 'destinos', String(rows[0]['porto'] || rows[0]['pais']), rows[0]['codigo'] as string | null, null, rows[0]['pais'] as string | null) : null;
    }
    case 'empresas': {
      const rows = await sql`UPDATE empresas SET razao_social = ${nome}, cnpj = ${nullable(body['codigo'])}, cidade = ${nullable(body['observacoes'])}, uf = ${nullable(body['uf'])} WHERE id = ${Number(rawId)} RETURNING *`;
      return rows[0] ? rowCadastro(tipo, rows[0], 'empresas', String(rows[0]['razao_social']), rows[0]['cnpj'] as string | null, rows[0]['uf'] as string | null, rows[0]['cidade'] as string | null) : null;
    }
    default: {
      const rows = await sql`
        UPDATE embarque_cadastros
        SET tipo = ${tipo}, nome = ${nome}, codigo = ${nullable(body['codigo'])}, uf = ${nullable(body['uf'])}, observacoes = ${nullable(body['observacoes'])}, ativo = ${parseAtivo(body['ativo'])}, updated_at = NOW()
        WHERE id_cadastro = ${id}
        RETURNING *
      `;
      return rows[0] || null;
    }
  }
}

async function deleteCadastro(sql: ReturnType<typeof getDb>, id: string) {
  const { source, rawId } = decodeId(id);
  switch (source) {
    case 'clientes': return sql`DELETE FROM clientes WHERE id = ${Number(rawId)}`;
    case 'mercadorias': return sql`DELETE FROM mercadorias WHERE id = ${Number(rawId)}`;
    case 'armadores': return sql`DELETE FROM armadores WHERE id = ${Number(rawId)}`;
    case 'armazens': return sql`DELETE FROM armazens WHERE id = ${Number(rawId)}`;
    case 'destinos': return sql`DELETE FROM destinos WHERE id = ${Number(rawId)}`;
    case 'empresas': return sql`DELETE FROM empresas WHERE id = ${Number(rawId)}`;
    default: return sql`DELETE FROM embarque_cadastros WHERE id_cadastro = ${id}`;
  }
}

export async function handleCadastrosEmbarque(req: AuthenticatedRequest, res: VercelResponse) {
  await ensureOperationalDbInitialized();
  const sql = getDb();

  if (req.method === 'GET') {
    const tipo = String(req.query['tipo'] || '');
    if (tipo && isTipo(tipo)) return res.status(200).json(await listTipo(sql, tipo));

    const grouped = await Promise.all(TIPOS_VALIDOS.map(t => listTipo(sql, t)));
    return res.status(200).json(grouped.flat());
  }

  if (req.method === 'POST') {
    const body = asBody(req.body);
    const error = validate(body);
    if (error) return res.status(400).json({ error });
    return res.status(201).json(await createCadastro(sql, body));
  }

  if (req.method === 'PUT') {
    const id = String(req.query['id'] || '');
    const body = asBody(req.body);
    if (!id) return res.status(400).json({ error: 'ID do cadastro é obrigatório.' });
    const error = validate(body);
    if (error) return res.status(400).json({ error });

    const updated = await updateCadastro(sql, id, body);
    return updated ? res.status(200).json(updated) : res.status(404).json({ error: 'Cadastro não encontrado.' });
  }

  if (req.method === 'DELETE') {
    const id = String(req.query['id'] || '');
    if (!id) return res.status(400).json({ error: 'ID do cadastro é obrigatório.' });
    await deleteCadastro(sql, id);
    return res.status(204).end();
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
