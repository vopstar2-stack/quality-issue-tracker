import IssueForm from "@/components/IssueForm";

export default function NewIssuePage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">새 품질 이슈 등록</h1>
      <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
        불량 사진은 등록 후 상세 페이지에서 추가할 수 있습니다.
      </p>
      <IssueForm mode="create" />
    </div>
  );
}
