import Link from "next/link";
import { listTankReplacements } from "@/lib/tank-replacements";
import { needsReceiptAction } from "@/lib/tank-replacement-status";

export const dynamic = "force-dynamic";

export default async function ReceivePickerPage() {
  const records = await listTankReplacements();
  const pending = records
    .filter((r) => needsReceiptAction(r.status))
    .sort((a, b) => (a.outbound_date < b.outbound_date ? -1 : 1));

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">대체품 수령 등록</h1>
      <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
        어떤 출고 건에 대한 대체품인지 골라주세요.
      </p>

      {pending.length === 0 ? (
        <p className="rounded-md border border-dashed border-neutral-300 p-8 text-center text-neutral-500 dark:border-neutral-700">
          입고 대기 중인 출고 건이 없습니다.{" "}
          <Link href="/tank-replacements/new" className="text-blue-600 hover:underline dark:text-blue-400">
            신품출고 먼저 등록하기
          </Link>
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">
              <tr>
                <th className="px-3 py-2">출고일자</th>
                <th className="px-3 py-2">출고수량</th>
                <th className="px-3 py-2">이미 입고</th>
                <th className="px-3 py-2">남은 수량</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {pending.map((r) => (
                <tr key={r.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900">
                  <td className="px-3 py-2">{r.outbound_date}</td>
                  <td className="px-3 py-2">{r.outbound_quantity ?? "-"}</td>
                  <td className="px-3 py-2">{r.received_quantity}</td>
                  <td className="px-3 py-2">{r.remaining_quantity ?? "-"}</td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      href={`/tank-replacements/${r.id}/receive`}
                      className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
                    >
                      이 건 수령 등록
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
