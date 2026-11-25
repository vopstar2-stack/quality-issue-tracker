// 홈(첫 화면) = 메일 상황판 (2026-11-25 사용자 요청). 위쪽 메뉴 줄은 그대로 두고 아래에 상황판을 띄운다.
// 예전 홈이던 메모(업무일지)는 /memo 로 옮겼다.
export default function HomePage() {
  return (
    <iframe
      title="메일 상황판"
      src="/mail-dashboard.html"
      className="block h-[calc(100dvh-25px)] w-full border-0 bg-white"
    />
  );
}
