import Link from "next/link";
import { notFound } from "next/navigation";
import { getTankReplacement } from "@/lib/tank-replacements";
import { STATUS_STYLE, needsReceiptAction, statusLabel } from "@/lib/tank-replacement-status";
import TankReplacementForm from "@/components/TankReplacementForm";
import DeleteButton from "@/components/DeleteButton";
import ReceiptRow from "@/components/ReceiptRow";

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
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[record.status]}`}>
            {statusLabel(record)}
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

      <div className="mt-8 rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            대체품 입고 내역 (출고 {record.outbound_quantity ?? "-"}개 · 입고 {record.received_quantity}개)
          </h2>
          {needsReceiptAction(record.status) && (
            <Link
              href={`/tank-replacements/${record.id}/receive`}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
            >
              + 대체품 수령 등록
            </Link>
          )}
        </div>

        {record.receipts.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">아직 입고된 대체품이 없습니다.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-neutral-500 dark:text-neutral-400">
              <tr>
                <th className="py-1 pr-3">입고일자</th>
                <th className="py-1 pr-3">수량</th>
                <th className="py-1 pr-3">SN</th>
                <th className="py-1"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {record.receipts.map((r) => (
                <ReceiptRow key={r.id} tankReplacementId={record.id} receipt={r} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
