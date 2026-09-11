import { notFound } from "next/navigation";
import { getTankReplacement } from "@/lib/tank-replacements";
import TankReplacementForm from "@/components/TankReplacementForm";

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
      <h1 className="mb-6 text-2xl font-bold">대체품 수령 등록</h1>
      <TankReplacementForm mode="edit" record={record} section="inbound" />
    </div>
  );
}
