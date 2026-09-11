import Link from "next/link";
import { listTankReplacements } from "@/lib/tank-replacements";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  대기: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  부분입고: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  완료: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
};

export default async function TankReplacementsPage() {
  const records = await listTankReplacements();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">포스콤 Tank 누유대체 신품출고</h1>
        <div className="flex gap-2">
          <Link
            href="/tank-replacements/receive"
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            대체품 수령 등록
          </Link>
          <Link
            href="/tank-replacements/new"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
          >
            + 신품출고 등록
          </Link>
        </div>
      </div>

      {records.length === 0 ? (
        <p className="rounded-md border border-dashed border-neutral-300 p-8 text-center text-neutral-500 dark:border-neutral-700">
          등록된 기록이 없습니다.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">
              <tr>
                <th className="px-3 py-2">제목</th>
                <th className="px-3 py-2">출고일자</th>
                <th className="px-3 py-2">출고수량</th>
                <th className="px-3 py-2">출고 SN</th>
                <th className="px-3 py-2">입고수량</th>
                <th className="px-3 py-2">상태</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {records.map((r) => {
                const statusLabel =
                  r.status === "부분입고" && r.remaining_quantity !== null
                    ? `${r.remaining_quantity}개 미입고`
                    : r.status === "완료"
                      ? "입고완료"
                      : "입고대기";
                return (
                  <tr key={r.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900">
                    <td className="px-3 py-2 font-medium">
                      <Link
                        href={`/tank-replacements/${r.id}`}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {r.title}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{r.outbound_date}</td>
                    <td className="px-3 py-2">{r.outbound_quantity ?? "-"}</td>
                    <td className="px-3 py-2">{r.outbound_serial ?? "-"}</td>
                    <td className="px-3 py-2">{r.received_quantity}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[r.status]}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {r.status !== "완료" && (
                        <Link
                          href={`/tank-replacements/${r.id}/receive`}
                          className="text-blue-600 hover:underline dark:text-blue-400"
                        >
                          수령 등록
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
