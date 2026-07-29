import type { Issue } from "./types";

export const KAKAO_SDK_SRC = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js";

export function ensureKakaoInitialized(): boolean {
  if (typeof window === "undefined" || !window.Kakao) return false;
  const jsKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
  if (!jsKey) return false;
  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(jsKey);
  }
  return window.Kakao.isInitialized();
}

export function buildIssueSummaryMessage(issue: Issue): string {
  return [
    `[품질이슈 알림] ${issue.title}`,
    `제품명: ${issue.product_name}`,
    `발생일자: ${issue.occurred_at}`,
    `부품명: ${issue.part_name ?? "-"}`,
    `제조업체: ${issue.manufacturer ?? "-"}`,
    `발생위치: ${issue.location ?? "-"}`,
    `발생국가: ${issue.country ?? "-"}`,
    `시리얼번호: ${issue.serial_number ?? "-"}`,
    `수량: ${issue.quantity ?? "-"}`,
    `진행상황: ${issue.status}`,
    `처리자: ${issue.handler ?? "-"}`,
    "",
    "[내용]",
    issue.description && issue.description.length > 0 ? issue.description : "-",
  ].join("\n");
}
