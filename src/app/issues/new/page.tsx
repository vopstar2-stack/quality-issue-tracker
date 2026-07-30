import IssueForm from "@/components/IssueForm";

export default function NewIssuePage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">새 품질 이슈 등록</h1>
      <IssueForm mode="create" />
    </div>
  );
}
