import { NextRequest } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 메일 상황판 '요청(부탁)' 카드의 ◀ ▶ 단계 이동을 폰(웹 사본)에서 저장한다.
// - 웹 사본이 POST로 저장하고, GET으로 읽어 화면에 바로 반영한다.
// - 사내 PC의 메일 정리 예약 작업이 GET으로 읽어 claude.ai 상황판 DB(asks.stage)로 옮긴다.
// 웹 상황판 자체가 공개(사용자 선택)라 인증은 두지 않고, id 형식과 단계 값만 엄격히 제한한다.
// (할 수 있는 일은 카드 단계 이동뿐이라 잘못 눌려도 다시 옮기면 된다.)

const ASK_ID = /^[A-Za-z0-9][A-Za-z0-9_.~-]{0,99}$/;
const STAGES = ["requested", "waiting", "progress", "done"];

type Row = { ask_id: string; stage: string; moved_at: string };

export async function GET() {
  const rows = await query<Row>(
    "SELECT ask_id, stage, moved_at FROM mail_ask_moves WHERE moved_at > now() - interval '60 days' ORDER BY moved_at DESC LIMIT 500",
  );
  const moves: Record<string, { stage: string; at: string }> = {};
  for (const r of rows) moves[r.ask_id] = { stage: r.stage, at: new Date(r.moved_at).toISOString() };
  return Response.json({ moves }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON 형식이 아닙니다." }, { status: 400 });
  }
  const { id, stage } = (body ?? {}) as { id?: unknown; stage?: unknown };
  if (typeof id !== "string" || !ASK_ID.test(id)) {
    return Response.json({ error: "요청 id 형식이 올바르지 않습니다." }, { status: 400 });
  }
  if (typeof stage !== "string" || !STAGES.includes(stage)) {
    return Response.json({ error: "단계 값이 올바르지 않습니다." }, { status: 400 });
  }
  const rows = await query<Row>(
    `INSERT INTO mail_ask_moves (ask_id, stage, moved_at) VALUES ($1, $2, now())
     ON CONFLICT (ask_id) DO UPDATE SET stage = EXCLUDED.stage, moved_at = now()
     RETURNING ask_id, stage, moved_at`,
    [id, stage],
  );
  return Response.json({ ok: true, at: new Date(rows[0].moved_at).toISOString() });
}
