import Link from "next/link";
import { listIssues } from "@/lib/issues";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const issues = await listIssues();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">품질 이슈 목록</h1>
        <Link
          href="/issues/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
        >
          + 새 이슈 등록
        </Link>
      </div>

      {issues.length === 0 ? (
        <p className="rounded-md border border-dashed border-neutral-300 p-8 text-center text-neutral-500 dark:border-neutral-700">
          등록된 이슈가 없습니다.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">
              <tr>
                <th className="px-3 py-2">순번</th>
                <th className="px-3 py-2">발생일자</th>
                <th className="px-3 py-2">제목</th>
                <th className="px-3 py-2">제품명</th>
                <th className="px-3 py-2">부품명</th>
                <th className="px-3 py-2">제조업체</th>
                <th className="px-3 py-2">발생국가</th>
                <th className="px-3 py-2">시리얼번호</th>
                <th className="px-3 py-2">수량</th>
                <th className="px-3 py-2">진행상황</th>
                <th className="px-3 py-2">처리자</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {issues.map((issue, index) => (
                <tr key={issue.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900">
                  <td className="px-3 py-2 text-neutral-500 dark:text-neutral-400">
                    {index + 1}
                  </td>
                  <td className="px-3 py-2">{issue.occurred_at}</td>
                  <td className="px-3 py-2 font-medium">{issue.title}</td>
                  <td className="px-3 py-2 font-medium">{issue.product_name}</td>
                  <td className="px-3 py-2">{issue.part_name ?? "-"}</td>
                  <td className="px-3 py-2">{issue.manufacturer ?? "-"}</td>
                  <td className="px-3 py-2">{issue.country ?? "-"}</td>
                  <td className="px-3 py-2">{issue.serial_number ?? "-"}</td>
                  <td className="px-3 py-2">{issue.quantity ?? "-"}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={issue.status} />
                  </td>
                  <td className="px-3 py-2">{issue.handler ?? "-"}</td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      href={`/issues/${issue.id}`}
                      className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      상세보기
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
