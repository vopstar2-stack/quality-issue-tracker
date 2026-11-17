import { Pool } from "pg";

const globalForDb = globalThis as unknown as { __qualityPgPool?: Pool };

function createPool(): Pool {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error(
      "POSTGRES_URL 환경변수가 설정되지 않았습니다. Vercel Postgres를 연결하거나 .env.local에 값을 추가하세요.",
    );
  }
  const pool = new Pool({ connectionString });
  // Neon 쪽 프록시가 유휴 커넥션을 조용히 끊을 때가 있는데, pg.Pool은 그걸 'error'
  // 이벤트로 풀 전체에 다시 던진다. 여기서 받아주지 않으면 처리되지 않은 예외가 되어
  // 이 서버리스 인스턴스가 이후 요청까지 계속 죽은 채로 남는다. pg.Pool이 문제된
  // 커넥션은 내부적으로 알아서 제거하므로, 로그만 남기고 다음 쿼리에서 새 커넥션을
  // 새로 맺게 둔다.
  pool.on("error", (err) => {
    console.error("Postgres idle client error", err);
  });
  return pool;
}

function getPool(): Pool {
  if (!globalForDb.__qualityPgPool) {
    globalForDb.__qualityPgPool = createPool();
  }
  return globalForDb.__qualityPgPool;
}

let schemaReady: Promise<void> | null = null;

async function ensureSchema(pool: Pool): Promise<void> {
  // 모든 문에 파라미터가 없으므로 한 번의 simple query로 묶어 보낸다 — 콜드 스타트마다
  // 이 문들을 개별 await pool.query()로 14번 왕복하면 (특히 Neon처럼 원격 DB일 때)
  // 그 자체로 몇 초가 걸린다. 묶어도 각 문은 여전히 IF NOT EXISTS 등으로 멱등이다.
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
    );

    ALTER TABLE issues ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';

    -- occurred_at은 UI에서 "접수일자"로 표시된다; 이 컬럼은 별도의 "발생일자"
    -- (실제 불량 발생일)를 저장한다.
    ALTER TABLE issues ADD COLUMN IF NOT EXISTS occurrence_date TEXT;

    -- 예전 5단계 status 값을 새 3단계(진행중/완료/처리없음)로 내린다.
    -- 모든 행이 이미 마이그레이션됐다면 no-op.
    UPDATE issues SET status = '진행중' WHERE status IN ('접수', '조사중', '조치중');
    UPDATE issues SET status = '처리없음' WHERE status = '보류';

    ALTER TABLE issues ADD COLUMN IF NOT EXISTS cause TEXT;
    ALTER TABLE issues ADD COLUMN IF NOT EXISTS ai_estimated_cause TEXT;
    ALTER TABLE issues ADD COLUMN IF NOT EXISTS countermeasure TEXT;
    ALTER TABLE issues ADD COLUMN IF NOT EXISTS ai_estimated_countermeasure TEXT;
    ALTER TABLE issues ADD COLUMN IF NOT EXISTS conclusion TEXT;

    CREATE TABLE IF NOT EXISTS issue_photos (
      id SERIAL PRIMARY KEY,
      issue_id INTEGER NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- 포스콤 탱크 누유대체: 신품 출고 -> 포스콤 대체품 입고 흐름 기록
    CREATE TABLE IF NOT EXISTS tank_replacements (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '누유대체 신품출고',
      outbound_date TEXT NOT NULL,
      outbound_quantity INTEGER,
      outbound_serial TEXT,
      inbound_date TEXT,
      inbound_quantity INTEGER,
      inbound_serial TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- 대체품이 여러 번에 나눠서(부분입고) 들어올 수 있어, 입고 1건당 한 행으로 기록한다.
    -- 출고수량과 이 테이블의 합계를 비교해 미입고/완료 여부를 계산한다.
    CREATE TABLE IF NOT EXISTS tank_replacement_receipts (
      id SERIAL PRIMARY KEY,
      tank_replacement_id INTEGER NOT NULL REFERENCES tank_replacements(id) ON DELETE CASCADE,
      inbound_date TEXT NOT NULL,
      inbound_quantity INTEGER,
      inbound_serial TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- 위 receipts 테이블 도입 전에 tank_replacements 위에 직접 기록됐던 단일 입고값을
    -- 최초 1건의 receipt로 옮긴다(이미 옮겨진 건은 건너뛰는 멱등 처리).
    INSERT INTO tank_replacement_receipts (tank_replacement_id, inbound_date, inbound_quantity, inbound_serial, created_at)
    SELECT id, inbound_date, inbound_quantity, inbound_serial, updated_at
    FROM tank_replacements
    WHERE inbound_date IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM tank_replacement_receipts WHERE tank_replacement_id = tank_replacements.id
      );

    -- 내 할 일 앱(/todo.html): 직접 적는 메모
    CREATE TABLE IF NOT EXISTS my_memos (
      id SERIAL PRIMARY KEY,
      body TEXT NOT NULL,
      due TEXT,
      done BOOLEAN NOT NULL DEFAULT false,
      pinned BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- 메일에서 뽑은 할 일·직접 온 메일을 앱에서 '완료/확인' 표시한 상태
    CREATE TABLE IF NOT EXISTS my_item_state (
      item_key TEXT PRIMARY KEY,
      done BOOLEAN NOT NULL DEFAULT true,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- 웹 푸시 구독(폰마다 1행)
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      endpoint TEXT PRIMARY KEY,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

export async function query<T>(text: string, params: unknown[] = []): Promise<T[]> {
  const pool = getPool();
  if (!schemaReady) {
    schemaReady = ensureSchema(pool).catch((err) => {
      // ensureSchema가 커넥션 문제 등으로 실패하면 그 실패를 여기 캐시해두지 않는다.
      // 캐시해버리면 이 서버리스 인스턴스는 (재배포 전까지) 모든 요청에서 같은
      // 실패를 그대로 재현하게 된다 - 다음 호출에서 새로 시도하도록 초기화한다.
      schemaReady = null;
      throw err;
    });
  }
  await schemaReady;
  const result = await pool.query(text, params);
  return result.rows as T[];
}
