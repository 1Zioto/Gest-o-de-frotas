import { randomUUID } from 'crypto';
import { getDb } from '../../server/db.js';

let initPromise: Promise<void> | null = null;

const UFS_BRASIL = [
  ['AC', 'Acre'],
  ['AL', 'Alagoas'],
  ['AP', 'Amapá'],
  ['AM', 'Amazonas'],
  ['BA', 'Bahia'],
  ['CE', 'Ceará'],
  ['DF', 'Distrito Federal'],
  ['ES', 'Espírito Santo'],
  ['GO', 'Goiás'],
  ['MA', 'Maranhão'],
  ['MT', 'Mato Grosso'],
  ['MS', 'Mato Grosso do Sul'],
  ['MG', 'Minas Gerais'],
  ['PA', 'Pará'],
  ['PB', 'Paraíba'],
  ['PR', 'Paraná'],
  ['PE', 'Pernambuco'],
  ['PI', 'Piauí'],
  ['RJ', 'Rio de Janeiro'],
  ['RN', 'Rio Grande do Norte'],
  ['RS', 'Rio Grande do Sul'],
  ['RO', 'Rondônia'],
  ['RR', 'Roraima'],
  ['SC', 'Santa Catarina'],
  ['SP', 'São Paulo'],
  ['SE', 'Sergipe'],
  ['TO', 'Tocantins'],
];

export function newId(prefix: string): string {
  return `${prefix}-${randomUUID()}`;
}

export function asBody(body: unknown): Record<string, any> {
  return typeof body === 'string' ? JSON.parse(body || '{}') : (body || {}) as Record<string, any>;
}

export function toNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function ensureOperationalDbInitialized() {
  if (!initPromise) {
    initPromise = (async () => {
      const sql = getDb();

      await sql`
        CREATE TABLE IF NOT EXISTS embarques (
          id_embarque TEXT PRIMARY KEY,
          codigo_embarque TEXT UNIQUE NOT NULL,
          origem_nome TEXT,
          origem_cidade TEXT,
          origem_uf TEXT,
          origem_endereco TEXT,
          destino_nome TEXT,
          destino_cidade TEXT,
          destino_uf TEXT,
          destino_endereco TEXT,
          data_recebimento_carregamento TIMESTAMP,
          data_prevista_agendamento TIMESTAMP,
          data_coleta TIMESTAMP,
          data_previsao_entrega TIMESTAMP,
          data_entrega_real TIMESTAMP,
          id_veiculo TEXT,
          id_motorista TEXT,
          motorista_segue_viagem BOOLEAN DEFAULT TRUE,
          descricao_carga TEXT,
          tipo_carga TEXT,
          peso_kg NUMERIC,
          volume_m3 NUMERIC,
          quantidade NUMERIC,
          quantidade_containers INTEGER DEFAULT 0,
          valor_frete NUMERIC,
          custo_estimado NUMERIC,
          lucro_estimado NUMERIC,
          status TEXT DEFAULT 'fazer_agendamento',
          observacoes TEXT,
          observacao_erro TEXT,
          ordem_gerada BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS embarque_cadastros (
          id_cadastro TEXT PRIMARY KEY,
          tipo TEXT NOT NULL,
          nome TEXT NOT NULL,
          codigo TEXT,
          uf TEXT,
          observacoes TEXT,
          ativo BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;

      await sql`ALTER TABLE embarques ADD COLUMN IF NOT EXISTS id_embarque TEXT`;
      await sql`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'embarques' AND column_name = 'id'
          ) THEN
            EXECUTE 'UPDATE embarques SET id_embarque = ''EMB-LEG-'' || id::text WHERE (id_embarque IS NULL OR id_embarque = '''') AND id IS NOT NULL';
          ELSE
            EXECUTE 'UPDATE embarques SET id_embarque = ''EMB-LEG-'' || gen_random_uuid()::text WHERE id_embarque IS NULL OR id_embarque = ''''';
          END IF;
        END $$;
      `;
      await sql`ALTER TABLE embarques ADD COLUMN IF NOT EXISTS codigo_embarque TEXT`;
      await sql`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'embarques' AND column_name = 'booking'
          ) THEN
            EXECUTE 'UPDATE embarques SET codigo_embarque = COALESCE(NULLIF(codigo_embarque, ''''), booking, id_embarque) WHERE codigo_embarque IS NULL OR codigo_embarque = ''''';
          ELSE
            EXECUTE 'UPDATE embarques SET codigo_embarque = COALESCE(NULLIF(codigo_embarque, ''''), id_embarque) WHERE codigo_embarque IS NULL OR codigo_embarque = ''''';
          END IF;
        END $$;
      `;
      await sql`ALTER TABLE embarques ADD COLUMN IF NOT EXISTS origem_nome TEXT`;
      await sql`ALTER TABLE embarques ADD COLUMN IF NOT EXISTS origem_cidade TEXT`;
      await sql`ALTER TABLE embarques ADD COLUMN IF NOT EXISTS origem_uf TEXT`;
      await sql`ALTER TABLE embarques ADD COLUMN IF NOT EXISTS origem_endereco TEXT`;
      await sql`ALTER TABLE embarques ADD COLUMN IF NOT EXISTS destino_nome TEXT`;
      await sql`ALTER TABLE embarques ADD COLUMN IF NOT EXISTS destino_cidade TEXT`;
      await sql`ALTER TABLE embarques ADD COLUMN IF NOT EXISTS destino_uf TEXT`;
      await sql`ALTER TABLE embarques ADD COLUMN IF NOT EXISTS destino_endereco TEXT`;
      await sql`ALTER TABLE embarques ADD COLUMN IF NOT EXISTS data_entrega_real TIMESTAMP`;
      await sql`ALTER TABLE embarques ADD COLUMN IF NOT EXISTS id_veiculo TEXT`;
      await sql`ALTER TABLE embarques ADD COLUMN IF NOT EXISTS id_motorista TEXT`;
      await sql`ALTER TABLE embarques ADD COLUMN IF NOT EXISTS descricao_carga TEXT`;
      await sql`ALTER TABLE embarques ADD COLUMN IF NOT EXISTS tipo_carga TEXT`;
      await sql`ALTER TABLE embarques ADD COLUMN IF NOT EXISTS peso_kg NUMERIC`;
      await sql`ALTER TABLE embarques ADD COLUMN IF NOT EXISTS volume_m3 NUMERIC`;
      await sql`ALTER TABLE embarques ADD COLUMN IF NOT EXISTS quantidade NUMERIC`;
      await sql`ALTER TABLE embarques ADD COLUMN IF NOT EXISTS valor_frete NUMERIC`;
      await sql`ALTER TABLE embarques ADD COLUMN IF NOT EXISTS custo_estimado NUMERIC`;
      await sql`ALTER TABLE embarques ADD COLUMN IF NOT EXISTS lucro_estimado NUMERIC`;
      await sql`ALTER TABLE embarques ADD COLUMN IF NOT EXISTS observacoes TEXT`;
      await sql`CREATE UNIQUE INDEX IF NOT EXISTS embarques_id_embarque_key ON embarques (id_embarque)`;

      await sql`
        CREATE TABLE IF NOT EXISTS containers (
          id_container TEXT PRIMARY KEY,
          codigo_viagem TEXT UNIQUE NOT NULL,
          id_embarque TEXT NOT NULL REFERENCES embarques(id_embarque) ON DELETE CASCADE,
          numero_container TEXT,
          id_cte TEXT,
          status TEXT DEFAULT 'pendente',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS ctes (
          id_cte TEXT PRIMARY KEY,
          numero_cte TEXT NOT NULL,
          serie TEXT,
          chave_acesso TEXT,
          id_embarque TEXT REFERENCES embarques(id_embarque) ON DELETE SET NULL,
          id_container TEXT REFERENCES containers(id_container) ON DELETE SET NULL,
          remetente_nome TEXT,
          remetente_cnpj_cpf TEXT,
          destinatario_nome TEXT,
          destinatario_cnpj_cpf TEXT,
          origem_cidade TEXT,
          origem_uf TEXT,
          destino_cidade TEXT,
          destino_uf TEXT,
          valor_total NUMERIC,
          valor_frete NUMERIC,
          valor_imposto NUMERIC,
          data_emissao TIMESTAMP,
          data_autorizacao TIMESTAMP,
          status TEXT DEFAULT 'emitido',
          xml_url TEXT,
          pdf_url TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;

      await sql`ALTER TABLE embarques ADD COLUMN IF NOT EXISTS quantidade_containers INTEGER DEFAULT 0`;
      await sql`ALTER TABLE embarques ADD COLUMN IF NOT EXISTS ordem_gerada BOOLEAN DEFAULT FALSE`;
      await sql`ALTER TABLE embarques ADD COLUMN IF NOT EXISTS data_recebimento_carregamento TIMESTAMP`;
      await sql`ALTER TABLE embarques ADD COLUMN IF NOT EXISTS data_prevista_agendamento TIMESTAMP`;
      await sql`ALTER TABLE embarques ADD COLUMN IF NOT EXISTS data_previsao_entrega TIMESTAMP`;
      await sql`ALTER TABLE embarques ADD COLUMN IF NOT EXISTS motorista_segue_viagem BOOLEAN DEFAULT TRUE`;
      await sql`ALTER TABLE embarques ADD COLUMN IF NOT EXISTS observacao_erro TEXT`;
      await sql`ALTER TABLE ctes ADD COLUMN IF NOT EXISTS id_container TEXT`;
      await sql`ALTER TABLE containers ADD COLUMN IF NOT EXISTS id_cte TEXT`;

      for (const [codigo, nome] of UFS_BRASIL) {
        await sql`
          INSERT INTO embarque_cadastros (id_cadastro, tipo, nome, codigo, uf, observacoes, ativo)
          SELECT ${newId('CAD-EMB')}, 'uf', ${nome}, ${codigo}, ${codigo}, 'UF Brasil', TRUE
          WHERE NOT EXISTS (
            SELECT 1
            FROM embarque_cadastros
            WHERE tipo = 'uf' AND codigo = ${codigo}
          )
        `;
      }
    })().catch(error => {
      initPromise = null;
      throw error;
    });
  }

  return initPromise;
}
