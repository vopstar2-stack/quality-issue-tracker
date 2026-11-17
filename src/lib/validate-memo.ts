export type MemoInput = { body?: string; due?: string | null; done?: boolean; pinned?: boolean };

// requireBody=true: 새 메모(본문 필수). false: 부분 수정.
export function parseMemoInput(raw: unknown, requireBody: boolean): MemoInput | { error: string } {
  if (!raw || typeof raw !== "object") return { error: "요청 형식이 올바르지 않습니다." };
  const r = raw as Record<string, unknown>;
  const out: MemoInput = {};
  if (r.body !== undefined) {
    if (typeof r.body !== "string" || !r.body.trim()) return { error: "메모 내용을 입력하세요." };
    if (r.body.length > 4000) return { error: "메모가 너무 깁니다 (4000자 이하)." };
    out.body = r.body.trim();
  } else if (requireBody) {
    return { error: "메모 내용을 입력하세요." };
  }
  if (r.due !== undefined) {
    if (r.due === null || r.due === "") out.due = null;
    else if (typeof r.due === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.due)) out.due = r.due;
    else return { error: "기한은 YYYY-MM-DD 형식이어야 합니다." };
  }
  for (const key of ["done", "pinned"] as const) {
    if (r[key] !== undefined) {
      if (typeof r[key] !== "boolean") return { error: `${key} 값이 올바르지 않습니다.` };
      out[key] = r[key] as boolean;
    }
  }
  return out;
}
