import { randomUUID } from 'crypto';
import { getDb } from '../../server/db.js';

let initPromise: Promise<void> | null = null;

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
      await sql`ALTER TABLE embarques ADD COLUMN IF NOT EXISTS motorista_segue_viagem BOOLEAN DEFAULT TRUE`;
      await sql`ALTER TABLE embarques ADD COLUMN IF NOT EXISTS observacao_erro TEXT`;
      await sql`ALTER TABLE ctes ADD COLUMN IF NOT EXISTS id_container TEXT`;
      await sql`ALTER TABLE containers ADD COLUMN IF NOT EXISTS id_cte TEXT`;
    })().catch(error => {
      initPromise = null;
      throw error;
    });
  }

  return initPromise;
}
