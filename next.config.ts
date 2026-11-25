import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 메일 상황판 화면은 메일 정리가 매번 올리는 최신본(blob)을 쓴다 → 재배포 없이 반영.
  // public 파일보다 먼저 적용되도록 beforeFiles에 둔다. 배포에 든 기본 사본은 /mail-dashboard-base.html.
  async rewrites() {
    return {
      beforeFiles: [{ source: "/mail-dashboard.html", destination: "/api/mail-dashboard/page" }],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
