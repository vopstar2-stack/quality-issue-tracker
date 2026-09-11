import { notFound } from "next/navigation";
import { getTankReplacement } from "@/lib/tank-replacements";
import TankReplacementForm from "@/components/TankReplacementForm";
import DeleteButton from "@/components/DeleteButton";

export const dynamic = "force-dynamic";

export default async function TankReplacementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) notFound();

  const record = await getTankReplacement(numId);
  if (!record) notFound();

  const received = Boolean(record.inbound_date);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-bold">
          {record.title}
          <span className="ml-2 text-sm font-normal text-neutral-400 dark:text-neutral-500">
            #{record.id}
          </span>
        </h1>
        <div className="flex items-start gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              received
                ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
            }`}
          >
            {received ? "대체품 입고완료" : "대체품 입고대기"}
          </span>
          <DeleteButton
            id={record.id}
            basePath="/api/tank-replacements"
            redirectTo="/tank-replacements"
            label="기록 삭제 확인"
          />
        </div>
      </div>

      <TankReplacementForm mode="edit" record={record} />
    </div>
  );
}
