import { NextRequest } from "next/server";
import { getIssue } from "@/lib/issues";
import { buildIssueSummaryMessage } from "@/lib/kakao";

export const runtime = "nodejs";

function redirectWithMessage(origin: string, path: string, kakao: "sent" | "error", message?: string) {
  const url = new URL(path, origin);
  url.searchParams.set("kakao", kakao);
  if (message) url.searchParams.set("kakaoMsg", message);
  return Response.redirect(url.toString(), 302);
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const origin = host ? `${proto}://${host}` : request.nextUrl.origin;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const kakaoError = searchParams.get("error");

  const issueId = state ? Number(state) : NaN;
  const backPath = Number.isInteger(issueId) ? `/issues/${issueId}` : "/";

  if (kakaoError) {
    return redirectWithMessage(origin, backPath, "error", `카카오 인증 취소/실패: ${kakaoError}`);
  }
  if (!code) {
    return redirectWithMessage(origin, backPath, "error", "인가 코드가 없습니다.");
  }

  const restApiKey = process.env.KAKAO_REST_API_KEY;
  if (!restApiKey) {
    return redirectWithMessage(
      origin,
      backPath,
      "error",
      "서버에 KAKAO_REST_API_KEY 환경변수가 설정되지 않았습니다.",
    );
  }

  const tokenParams: Record<string, string> = {
    grant_type: "authorization_code",
    client_id: restApiKey,
    redirect_uri: `${origin}/api/kakao/callback`,
    code,
  };
  if (process.env.KAKAO_CLIENT_SECRET) {
    tokenParams.client_secret = process.env.KAKAO_CLIENT_SECRET;
  }

  const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body: new URLSearchParams(tokenParams),
  });
  const tokenData = await tokenRes.json().catch(() => ({}));

  if (!tokenRes.ok || typeof tokenData.access_token !== "string") {
    const detail = tokenData.error_description ?? tokenData.error ?? `HTTP ${tokenRes.status}`;
    return redirectWithMessage(origin, backPath, "error", `토큰 발급 실패: ${detail}`);
  }

  if (!Number.isInteger(issueId)) {
    return redirectWithMessage(origin, backPath, "error", "잘못된 이슈 ID입니다.");
  }
  const issue = await getIssue(issueId);
  if (!issue) {
    return redirectWithMessage(origin, backPath, "error", "이슈를 찾을 수 없습니다.");
  }

  const pageUrl = `${origin}/issues/${issue.id}`;
  const sendRes = await fetch("https://kapi.kakao.com/v2/api/talk/memo/default/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    body: new URLSearchParams({
      template_object: JSON.stringify({
        object_type: "text",
        text: buildIssueSummaryMessage(issue),
        link: { web_url: pageUrl, mobile_web_url: pageUrl },
      }),
    }),
  });
  const sendData = await sendRes.json().catch(() => ({}));

  if (!sendRes.ok) {
    const detail = sendData.msg ?? sendData.error_description ?? `HTTP ${sendRes.status}`;
    return redirectWithMessage(origin, backPath, "error", `발송 실패: ${detail}`);
  }

  return redirectWithMessage(origin, backPath, "sent");
}
