"use client";

import Script from "next/script";
import { useState } from "react";
import type { Issue } from "@/lib/types";
import { KAKAO_SDK_SRC, ensureKakaoInitialized } from "@/lib/kakao";

export default function KakaoSendButton({ issue }: { issue: Issue }) {
  const [error, setError] = useState("");

  const hasKey = Boolean(process.env.NEXT_PUBLIC_KAKAO_JS_KEY);

  function handleClick() {
    setError("");
    if (!ensureKakaoInitialized()) {
      setError(
        "카카오 설정이 필요합니다. .env.local에 NEXT_PUBLIC_KAKAO_JS_KEY 값을 설정한 뒤 서버를 재시작하세요.",
      );
      return;
    }
    // Kakao JS SDK v2 sends the browser through a full redirect to Kakao's
    // login page; there is no popup/callback API anymore. The callback
    // route exchanges the code for a token and sends the message server-side.
    window.Kakao!.Auth.authorize({
      redirectUri: `${window.location.origin}/api/kakao/callback`,
      state: String(issue.id),
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <Script src={KAKAO_SDK_SRC} strategy="afterInteractive" />
      <button
        type="button"
        onClick={handleClick}
        disabled={!hasKey}
        title={
          !hasKey
            ? "NEXT_PUBLIC_KAKAO_JS_KEY 환경변수가 설정되어야 사용할 수 있습니다."
            : undefined
        }
        className="inline-flex items-center justify-center gap-2 rounded-md bg-[#FEE500] px-4 py-2 text-sm font-semibold text-[#191919] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        카카오톡으로 요약 발송
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
