import { NextRequest } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 메일 상황판 브리핑 '읽음' 표시.
// - 폰에서 보는 웹 사본(public/mail-dashboard.html)이 읽음을 누르면 POST로 저장한다.
// - 같은 화면이 GET으로 읽어서 이미 읽은 브리핑을 숨긴다.
// - 사내 PC의 메일 정리 예약 작업이 GET으로 읽어 claude.ai 상황판 DB(briefs.readAt)로 옮긴다.
// 웹 상황판 자체가 공개(사용자 선택)라 인증은 두지 않고, 대신 브리핑 id 형식과 개수만 엄격히 제한한다.
// (할 수 있는 일은 '읽음' 표시뿐이라 잘못 눌려도 브리핑 기록에는 그대로 남는다.)

const BRIEF_ID = /^b-\d{8}-\d{4}[A-Za-z0-9-]{0,12}$/;
const MAX_IDS = 60;

type Row = { brief_id: string; read_at: string };

export async function GET() {
  // 브리핑은 최근 것만 의미가 있으므로 30일 지난 기록은 돌려주지 않는다.
  const rows = await query<Row>(
    "SELECT brief_id, read_at FROM mail_brief_reads WHERE read_at > now() - interval '30 days' ORDER BY read_at DESC LIMIT 500",
  );
  const reads: Record<string, string> = {};
  for (const r of rows) reads[r.brief_id] = new Date(r.read_at).toISOString();
  return Response.json({ reads }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON 형식이 아닙니다." }, { status: 400 });
  }
  const ids = (body as { ids?: unknown })?.ids;
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > MAX_IDS) {
    return Response.json({ error: `ids는 1~${MAX_IDS}개 배열이어야 합니다.` }, { status: 400 });
  }
  const clean = [...new Set(ids)].filter((x): x is string => typeof x === "string" && BRIEF_ID.test(x));
  if (clean.length !== ids.length) {
    return Response.json({ error: "브리핑 id 형식이 올바르지 않습니다." }, { status: 400 });
  }
  // 이미 읽음인 건 처음 읽은 시각을 유지한다.
  await query(
    "INSERT INTO mail_brief_reads (brief_id) SELECT unnest($1::text[]) ON CONFLICT (brief_id) DO NOTHING",
    [clean],
  );
  return Response.json({ ok: true, count: clean.length });
}
