import { neon } from '@neondatabase/serverless';

let authInitPromise: Promise<void> | null = null;

export function getDb() {
  const databaseUrl = process.env['DATABASE_URL'];

  if (!databaseUrl) {
    throw new Error('DATABASE_URL não configurada.');
  }

  return neon(databaseUrl);
}

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

  await authInitPromise;
}
