// 클비서 메일 상황판의 최신 스냅샷(JSON). 사내 PC의 예약 작업이 메일을 정리할 때마다
// 이 고정 경로에 덮어써서 최신 1개만 저장 공간을 쓴다.
export const MAIL_DASHBOARD_BLOB_PATHNAME = "mail-dashboard/latest.json";

// 업로드 크기 상한. 이슈·추적 문서 수백 개여도 수 MB를 넘지 않는다.
export const MAIL_DASHBOARD_MAX_BYTES = 8 * 1024 * 1024;

const COLLECTIONS = ["issues", "asks", "briefs", "trace"] as const;

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
