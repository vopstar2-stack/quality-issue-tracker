import { notFound } from "next/navigation";
import { getTankReplacement } from "@/lib/tank-replacements";
import TankReceiptForm from "@/components/TankReceiptForm";

export const dynamic = "force-dynamic";

export default async function ReceiveTankReplacementPage({
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
      <h1 className="mb-2 text-2xl font-bold">대체품 수령 등록</h1>
      <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
        {record.title} · 출고일자 {record.outbound_date} · 출고 {record.outbound_quantity ?? "-"}개
        {record.received_quantity > 0 && ` · 이미 입고 ${record.received_quantity}개`}
        {record.remaining_quantity !== null && ` · 남은 수량 ${record.remaining_quantity}개`}
      </p>
      <TankReceiptForm tankReplacementId={record.id} />
    </div>
  );
}
