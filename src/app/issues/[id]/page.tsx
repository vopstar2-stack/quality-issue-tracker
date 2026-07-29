import { notFound } from "next/navigation";
import { getIssue } from "@/lib/issues";
import { listPhotos } from "@/lib/photos";
import IssueForm from "@/components/IssueForm";
import KakaoSendButton from "@/components/KakaoSendButton";
import DeleteButton from "@/components/DeleteButton";
import PhotoManager from "@/components/PhotoManager";

export const dynamic = "force-dynamic";

export default async function IssueDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ kakao?: string; kakaoMsg?: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) notFound();

  const issue = await getIssue(numId);
  if (!issue) notFound();

  const [{ kakao, kakaoMsg }, photos] = await Promise.all([searchParams, listPhotos(issue.id)]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      {kakao === "sent" && (
        <div className="mb-4 rounded-md border border-green-300 bg-green-50 px-4 py-2 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          카카오톡으로 발송했습니다.
        </div>
      )}
      {kakao === "error" && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          카카오톡 발송 실패: {kakaoMsg ?? "알 수 없는 오류"}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-bold">이슈 #{issue.id}</h1>
        <div className="flex items-start gap-3">
          <KakaoSendButton issue={issue} />
          <DeleteButton id={issue.id} />
        </div>
      </div>

      <div className="mb-6">
        <h2 className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          불량 사진
        </h2>
        <PhotoManager issueId={issue.id} initialPhotos={photos} />
      </div>

      <IssueForm mode="edit" issue={issue} />
    </div>
  );
}
