import { Pool } from "pg";

const globalForDb = globalThis as unknown as { __qualityPgPool?: Pool };

function createPool(): Pool {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error(
      "POSTGRES_URL 환경변수가 설정되지 않았습니다. Vercel Postgres를 연결하거나 .env.local에 값을 추가하세요.",
    );
  }
  return new Pool({ connectionString });
}

function getPool(): Pool {
  if (!globalForDb.__qualityPgPool) {
    globalForDb.__qualityPgPool = createPool();
  }
  return globalForDb.__qualityPgPool;
}

let schemaReady: Promise<void> | null = null;

async function ensureSchema(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS issues (
      id SERIAL PRIMARY KEY,
      occurred_at TEXT NOT NULL,
      product_name TEXT NOT NULL,
      part_name TEXT,
      manufacturer TEXT,
      location TEXT,
      country TEXT,
      serial_number TEXT,
      quantity INTEGER,
      description TEXT,
      status TEXT NOT NULL DEFAULT '진행중',
      handler TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    ALTER TABLE issues ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT ''
  `);
  // occurred_at is now labeled "접수일자" (reception date) in the UI; this new
  // column holds the separate "발생일자" (actual defect occurrence date).
  await pool.query(`
    ALTER TABLE issues ADD COLUMN IF NOT EXISTS occurrence_date TEXT
  `);
  // Migrate rows still holding the old 5-value status set down to the new
  // 3-value set (진행중/완료/처리없음). No-op once every row has been migrated.
  await pool.query(`
    UPDATE issues SET status = '진행중' WHERE status IN ('접수', '조사중', '조치중')
  `);
  await pool.query(`
    UPDATE issues SET status = '처리없음' WHERE status = '보류'
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS issue_photos (
      id SERIAL PRIMARY KEY,
      issue_id INTEGER NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

export async function query<T>(text: string, params: unknown[] = []): Promise<T[]> {
  const pool = getPool();
  if (!schemaReady) {
    schemaReady = ensureSchema(pool);
  }
  await schemaReady;
  const result = await pool.query(text, params);
  return result.rows as T[];
}
