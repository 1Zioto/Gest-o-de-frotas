import { neon } from '@neondatabase/serverless';

let authInitPromise: Promise<void> | null = null;
let coreInitPromise: Promise<void> | null = null;

export function getDb() {
  const databaseUrl = process.env['DATABASE_URL'];

  if (!databaseUrl) {
    throw new Error('DATABASE_URL não configurada.');
  }

  return neon(databaseUrl);
}

/**
 * Garante que a tabela `users` (autenticação) existe.
 * Chamada pelo módulo de login.
 */
export async function ensureAuthDbInitialized() {
  if (!authInitPromise) {
    authInitPromise = (async () => {
      const sql = getDb();

      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          nome TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          senha_hash TEXT NOT NULL,
          perfil TEXT DEFAULT 'operador',
          ativo BOOLEAN DEFAULT TRUE,
          criado_em TIMESTAMP DEFAULT NOW(),
          atualizado_em TIMESTAMP DEFAULT NOW()
        )
      `;
    })().catch(error => {
      authInitPromise = null;
      throw error;
    });
  }
  return authInitPromise;
}

/**
 * Verifica a conexão com o banco de dados principal (Neon).
 * Em produção, as tabelas core já existem no Neon. Aqui fazemos apenas
 * um ping e validamos a existência das tabelas-base sem tentar migrá-las.
 */
export async function ensureCoreDbInitialized() {
  if (!coreInitPromise) {
    coreInitPromise = (async () => {
      const sql = getDb();
      await sql`SELECT 1`;

      const rows = await sql`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN ('proprietarios', 'veiculos', 'motoristas')
      `;

      const present = new Set(rows.map(row => String(row['table_name'])));
      const requiredTables = ['proprietarios', 'veiculos', 'motoristas'];
      const missing = requiredTables.filter(table => !present.has(table));

      if (missing.length > 0) {
        throw new Error(`Tabelas ausentes no banco: ${missing.join(', ')}`);
      }
    })().catch(error => {
      coreInitPromise = null;
      throw error;
    });
  }
  return coreInitPromise;
}
