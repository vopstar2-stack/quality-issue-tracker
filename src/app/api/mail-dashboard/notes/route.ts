import { NextRequest } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 메일 상황판 '내 확인 기록' (불량품을 직접 검증·확인한 내용).
// - 폰에서 보는 웹 사본(public/mail-dashboard.html)이 새 기록을 POST로 저장한다.
// - 같은 화면이 GET으로 읽어 아직 상황판에 합쳐지지 않은 폰 기록도 바로 보여 준다.
// - 사내 PC의 메일 정리 예약 작업이 GET으로 읽어 claude.ai 상황판 DB(notes)로 옮긴다.
// 웹 상황판이 공개(사용자 선택)라 브리핑 읽음과 같은 방식으로 인증 없이 받되,
// 새 기록 추가만 허용하고(수정·삭제 없음) 모양과 크기를 엄격히 제한한다.

const NOTE_ID = /^n-\d{8}-[a-z0-9]{4,8}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const VERDICTS = ["원인 확정", "원인 아님", "재현 안 됨", "진행 중", "처리 완료", "참고"];
const MAX_PHOTOS = 3;
const MAX_PHOTO_CHARS = 200_000; // 낮은 화질(약 800px) JPEG data URI 한 장 상한
const PHOTO = /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/;

type Photo = { w: number; h: number; d: string };
type Note = {
  id: string;
  date: string;
  codes: string[];
  issueId: string;
  defKind: string;
  defId: string;
  qmId: string; // 품질회의 안건 id (2026-11-25)
  what: string;
  result: string;
  verdict: string;
  photos: Photo[];
  by: string;
  source: "phone";
  createdAt: string;
};

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function clean(raw: unknown): Note | string {
  if (!raw || typeof raw !== "object") return "기록 형식이 아닙니다.";
  const r = raw as Record<string, unknown>;
  const id = str(r.id, 40);
  if (!NOTE_ID.test(id)) return "기록 id 형식이 올바르지 않습니다.";
  const date = str(r.date, 10);
  if (!DATE.test(date)) return "날짜 형식이 올바르지 않습니다.";
  const what = str(r.what, 4000);
  if (!what) return "확인한 내용을 적어 주세요.";
  const verdict = str(r.verdict, 20);
  if (verdict && !VERDICTS.includes(verdict)) return "판정 값이 올바르지 않습니다.";
  const codes = Array.isArray(r.codes)
    ? [...new Set(r.codes.map((c) => str(c, 60)).filter(Boolean))].slice(0, 20)
    : [];
  const photosIn = Array.isArray(r.photos) ? r.photos : [];
  if (photosIn.length > MAX_PHOTOS) return `사진은 ${MAX_PHOTOS}장까지예요.`;
  const photos: Photo[] = [];
  for (const p of photosIn) {
    const o = (p || {}) as Record<string, unknown>;
    const d = typeof o.d === "string" ? o.d : "";
    if (!PHOTO.test(d) || d.length > MAX_PHOTO_CHARS) return "사진 형식이나 크기가 올바르지 않습니다.";
    photos.push({ w: Number(o.w) || 0, h: Number(o.h) || 0, d });
  }
  return {
    id,
    date,
    codes,
    issueId: str(r.issueId, 80),
    defKind: ["iqc", "field"].includes(str(r.defKind, 10)) ? str(r.defKind, 10) : "",
    defId: str(r.defId, 80),
    qmId: str(r.qmId, 80),
    what,
    result: str(r.result, 4000),
    verdict,
    photos,
    by: "김원수",
    source: "phone",
    createdAt: new Date().toISOString(),
  };
}

export async function GET() {
  const rows = await query<{ data: Note }>(
    "SELECT data FROM mail_notes ORDER BY created_at DESC LIMIT 500",
  );
  return Response.json({ notes: rows.map((r) => r.data) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON 형식이 아닙니다." }, { status: 400 });
  }
  const note = clean((body as { note?: unknown })?.note);
  if (typeof note === "string") {
    return Response.json({ error: note }, { status: 400 });
  }
  // 같은 id로 두 번 눌러도 처음 저장한 것을 유지한다.
  await query("INSERT INTO mail_notes (id, data) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING", [
    note.id,
    JSON.stringify(note),
  ]);
  return Response.json({ ok: true, id: note.id });
}
