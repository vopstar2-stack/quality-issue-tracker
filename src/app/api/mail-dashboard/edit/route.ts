import { NextRequest } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 메일 상황판 웹 사본(폰)에서 누른 버튼 변경을 저장한다.
// - 이슈 카드: 완료 처리 / 다시 열기 (status), 처리로 올리기 / 지켜봄으로 내리기 (level)
// - 품질회의 안건: 종결 처리 / 다시 열기 / 단계 선택 (stage…), 우리 팀 요청 완료 처리 (asksMine)
// - 내 확인 기록: 고치기 (date, what, codes, photos) · 삭제 (deleted) — 불량품 히스토리 대장에서 옮긴 예전 기록(h-…)은 지울 수 없다
// 웹 사본이 POST로 저장하고 GET으로 읽어 화면에 반영한다. 사내 PC의 메일 정리 예약 작업이 GET으로 읽어
// claude.ai 상황판 DB에 옮긴 뒤, 업로드 토큰으로 DELETE해서 지운다.
// 웹 상황판 자체가 공개(사용자 선택)라 POST에는 인증을 두지 않고, 바꿀 수 있는 필드와 값을 엄격히 제한한다.

const ID = /^[A-Za-z0-9][A-Za-z0-9_.~-]{0,119}$/;
const QST = ["상정", "원인분석", "대책", "검증", "종결"];
const DAY = /^(\d{4}-\d{2}-\d{2})?$/;

type Patch = Record<string, unknown>;
type Row = { path: string; data: Patch; at: string };

function clean(coll: string, data: Patch): Patch | string {
  const out: Patch = {};
  for (const [k, v] of Object.entries(data)) {
    if (coll === "notes") {
      if (k === "deleted" && v === true) out[k] = true;
      else if ((k === "deletedAt" || k === "updatedAt") && typeof v === "string" && v.length <= 40) out[k] = v;
      else if (k === "date" && typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) out[k] = v;
      else if (k === "what" && typeof v === "string" && v.trim() && v.length <= 4000) out[k] = v.trim();
      else if (k === "codes" && Array.isArray(v) && v.length <= 20 && v.every((c) => typeof c === "string" && c.length <= 60)) out[k] = v;
      else if (
        k === "photos" && Array.isArray(v) && v.length <= 3 &&
        v.every((p) => p && typeof p === "object" && typeof (p as Patch).d === "string" &&
          /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test((p as Patch).d as string) && ((p as Patch).d as string).length <= 200_000)
      ) out[k] = v.map((p) => ({ w: Number((p as Patch).w) || 0, h: Number((p as Patch).h) || 0, d: (p as Patch).d }));
      else return `바꿀 수 없는 항목입니다: ${k}`;
    } else if (coll === "issues") {
      if (k === "status" && (v === "open" || v === "closed")) out[k] = v;
      else if (k === "level" && (v === "red" || v === "yellow" || v === "white")) out[k] = v;
      else return `바꿀 수 없는 항목입니다: ${k}`;
    } else {
      if ((k === "stage" && QST.includes(String(v))) || (k === "stageBefore" && (v === "" || QST.includes(String(v))))) out[k] = v;
      else if (k === "stageManual" && typeof v === "boolean") out[k] = v;
      else if (k === "closedAt" && typeof v === "string" && DAY.test(v)) out[k] = v;
      else if (k === "asksMine" && Array.isArray(v) && v.length <= 40) {
        // 메일 정리는 여기서 done/doneManual/doneAt만 옮긴다 (요청 내용은 바꾸지 않음).
        out[k] = v.map((x) => {
          const o = (x ?? {}) as Patch;
          return {
            what: String(o.what ?? "").slice(0, 300),
            done: o.done === true,
            doneManual: true,
            doneAt: typeof o.doneAt === "string" && DAY.test(o.doneAt) ? o.doneAt : "",
          };
        });
      } else return `바꿀 수 없는 항목입니다: ${k}`;
    }
  }
  return Object.keys(out).length ? out : "바꿀 내용이 없습니다.";
}

export async function GET() {
  const rows = await query<Row>("SELECT path, data, at FROM mail_web_edits ORDER BY at LIMIT 500");
  const edits: Record<string, { data: Patch; at: string }> = {};
  for (const r of rows) edits[r.path] = { data: r.data, at: new Date(r.at).toISOString() };
  return Response.json({ edits }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON 형식이 아닙니다." }, { status: 400 });
  }
  const { path, data } = (body ?? {}) as { path?: unknown; data?: unknown };
  const m = typeof path === "string" ? /^(issues|qmeet|notes)\/(.+)$/.exec(path) : null;
  if (m && m[1] === "notes" && m[2].startsWith("h-")) return Response.json({ error: "예전 대장 기록은 지울 수 없습니다." }, { status: 400 });
  if (!m || !ID.test(m[2])) return Response.json({ error: "대상 형식이 올바르지 않습니다." }, { status: 400 });
  if (!data || typeof data !== "object" || Array.isArray(data)) return Response.json({ error: "data가 필요합니다." }, { status: 400 });
  const c = clean(m[1], data as Patch);
  if (typeof c === "string") return Response.json({ error: c }, { status: 400 });
  const rows = await query<Row>(
    `INSERT INTO mail_web_edits (path, data, at) VALUES ($1, $2::jsonb, now())
     ON CONFLICT (path) DO UPDATE SET data = mail_web_edits.data || EXCLUDED.data, at = now()
     RETURNING path, data, at`,
    [path, JSON.stringify(c)],
  );
  return Response.json({ ok: true, data: rows[0].data, at: new Date(rows[0].at).toISOString() });
}

// 메일 정리가 DB에 옮긴 뒤 지운다: {paths:[...], before: ISO} — before 이후에 또 누른 건 남긴다.
export async function DELETE(request: NextRequest) {
  const expected = process.env.QUALITY_DASHBOARD_UPLOAD_TOKEN;
  if (!expected || request.headers.get("authorization") !== `Bearer ${expected}`) {
    return Response.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  const { paths, before } = ((await request.json().catch(() => ({}))) ?? {}) as { paths?: unknown; before?: unknown };
  if (!Array.isArray(paths) || !paths.every((p) => typeof p === "string") || typeof before !== "string") {
    return Response.json({ error: "paths 배열과 before가 필요합니다." }, { status: 400 });
  }
  const rows = await query<{ path: string }>(
    "DELETE FROM mail_web_edits WHERE path = ANY($1::text[]) AND at <= $2::timestamptz RETURNING path",
    [paths, before],
  );
  return Response.json({ ok: true, deleted: rows.length });
}
