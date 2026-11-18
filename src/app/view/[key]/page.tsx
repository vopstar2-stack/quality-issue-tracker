import { notFound } from "next/navigation";

// 상단 링크 바(layout.tsx)가 그대로 유지된 채 아래 영역에 다른 페이지를 띄워서,
// 보다가 다른 탭으로 가려고 뒤로가기를 누르지 않아도 되게 한다.
const FRAMES: Record<string, { title: string; src: string }> = {
  crm: { title: "CRM", src: "https://ray-service-crm.netlify.app/" },
  dashboard: { title: "품질검사 대시보드", src: "/quality-dashboard" },
  mail: { title: "메일 상황판", src: "/mail-dashboard.html" },
};

export default async function ViewPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const frame = FRAMES[key];
  if (!frame) notFound();

  return (
    <iframe
      title={frame.title}
      src={frame.src}
      className="block h-[calc(100dvh-25px)] w-full border-0 bg-white"
    />
  );
}
