import { list } from "@vercel/blob";

// 클비서 메일 상황판의 최신 스냅샷(JSON). 사내 PC의 예약 작업이 메일을 정리할 때마다
// 이 고정 경로에 덮어써서 최신 1개만 저장 공간을 쓴다.
export const MAIL_DASHBOARD_BLOB_PATHNAME = "mail-dashboard/latest.json";

// 업로드 크기 상한. 이슈·추적 문서 수백 개여도 수 MB를 넘지 않는다.
export const MAIL_DASHBOARD_MAX_BYTES = 8 * 1024 * 1024;

// iqc: 수입검사 불량 대장, field: 필드 불량 대장 — 메일 상황판의 불량 탭이 쓴다.
const COLLECTIONS = ["issues", "asks", "briefs", "trace", "iqc", "field", "notes"] as const;

export function validateMailDashboardSnapshot(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "JSON 객체가 아닙니다.";
  }
  const snapshot = value as Record<string, unknown>;
  for (const key of COLLECTIONS) {
    if (snapshot[key] !== undefined && !Array.isArray(snapshot[key])) {
      return `${key}는 배열이어야 합니다.`;
    }
  }
  if (!Array.isArray(snapshot.issues)) {
    return "issues 배열이 없습니다.";
  }
  return null;
}

// 저장된 최신 스냅샷 원문을 가져온다. 없으면 null.
export async function fetchLatestSnapshotResponse(): Promise<Response | null> {
  const { blobs } = await list({ prefix: MAIL_DASHBOARD_BLOB_PATHNAME, limit: 1 });
  const latest = blobs[0];
  if (!latest) return null;
  const res = await fetch(latest.url, { cache: "no-store" });
  return res.ok ? res : null;
}

export async function readLatestSnapshot(): Promise<Record<string, unknown> | null> {
  const res = await fetchLatestSnapshotResponse();
  if (!res) return null;
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// 상황판 화면 코드(HTML). 사내 PC의 메일 정리가 데이터와 함께 매번 올려서,
// 화면을 고쳐도 Vercel 재배포 없이 다음 정리 때 웹(폰)에 반영되게 한다 (2026-11-25 사용자 요청).
export const MAIL_DASHBOARD_PAGE_PATHNAME = "mail-dashboard/page.html";
export const MAIL_DASHBOARD_PAGE_MAX_BYTES = 3 * 1024 * 1024;

export async function fetchLatestPageHtml(): Promise<string | null> {
  const { blobs } = await list({ prefix: MAIL_DASHBOARD_PAGE_PATHNAME, limit: 1 });
  const latest = blobs[0];
  if (!latest) return null;
  const res = await fetch(latest.url, { cache: "no-store" });
  return res.ok ? await res.text() : null;
}
