"use client";

import { useState } from "react";

// file:// 링크는 https 페이지에서 클릭하면 대부분 브라우저(특히 Chrome/Edge)가 보안상
// 차단해서 아무 반응이 없다. 그래서 최선의 시도로 file:// 이동을 시도하면서, 동시에
// 실제 경로를 클립보드에 복사해 탐색기 주소창에 붙여넣어 실행할 수 있게 대비한다.
const WINDOWS_PATH =
  String.raw`Y:\06. 수입검사현황\15 2026년도 수입검사 현황\_dashboard_tool\desktop_app\dist\품질검사_통합_대쉬보드.exe`;
const FILE_URI =
  "file:///Y:/06.%20%EC%88%98%EC%9E%85%EA%B2%80%EC%82%AC%ED%98%84%ED%99%A9/15%202026%EB%85%84%EB%8F%84%20%EC%88%98%EC%9E%85%EA%B2%80%EC%82%AC%20%ED%98%84%ED%99%A9/_dashboard_tool/desktop_app/dist/%ED%92%88%EC%A7%88%EA%B2%80%EC%82%AC_%ED%86%B5%ED%95%A9_%EB%8C%80%EC%89%AC%EB%B3%B4%EB%93%9C.exe";

export default function ExeShortcutButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(WINDOWS_PATH);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // 클립보드 접근이 막혀있으면 조용히 넘어간다 - file:// 이동 시도는 그대로 한다.
    }
    window.location.href = FILE_URI;
  }

  return (
    <span className="relative">
      <button type="button" onClick={handleClick} className={className} title="품질검사 대시보드 (exe)">
        {children}
      </button>
      {copied && (
        <span className="absolute left-1/2 top-full z-10 mt-1 w-56 -translate-x-1/2 rounded-md bg-neutral-900 px-2 py-1 text-center text-xs text-white shadow-lg dark:bg-white dark:text-neutral-900">
          경로가 복사됐습니다. 안 열리면 탐색기 주소창에 붙여넣으세요.
        </span>
      )}
    </span>
  );
}
