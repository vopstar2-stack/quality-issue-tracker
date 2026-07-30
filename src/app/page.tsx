import Link from "next/link";
import { listDistinctValues, listIssues } from "@/lib/issues";
import { ISSUE_STATUSES } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

const selectClass =
  "rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; manufacturer?: string; country?: string }>;
}) {
  const params = await searchParams;
  const filters = {
    q: params.q?.trim() || undefined,
    status: params.status || undefined,
    manufacturer: params.manufacturer || undefined,
    country: params.country || undefined,
  };
  const hasFilters = Boolean(filters.q || filters.status || filters.manufacturer || filters.country);

  const [issues, manufacturers, countries] = await Promise.all([
    listIssues(filters),
    listDistinctValues("manufacturer"),
    listDistinctValues("country"),
  ]);

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

      <form
        method="get"
        className="mb-6 flex flex-wrap items-end gap-3 rounded-md border border-neutral-200 p-4 dark:border-neutral-800"
      >
        <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700 dark:text-neutral-300">검색</span>
          <input
            type="text"
            name="q"
            defaultValue={filters.q ?? ""}
            placeholder="제목/제품명/부품명/제조업체/시리얼번호/내용"
            className={selectClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700 dark:text-neutral-300">진행상황</span>
          <select name="status" defaultValue={filters.status ?? ""} className={selectClass}>
            <option value="">전체</option>
            {ISSUE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700 dark:text-neutral-300">제조업체</span>
          <select name="manufacturer" defaultValue={filters.manufacturer ?? ""} className={selectClass}>
            <option value="">전체</option>
            {manufacturers.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700 dark:text-neutral-300">발생국가</span>
          <select name="country" defaultValue={filters.country ?? ""} className={selectClass}>
            <option value="">전체</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
          >
            검색
          </button>
          {hasFilters && (
            <Link
              href="/"
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              초기화
            </Link>
          )}
        </div>
      </form>

      {issues.length === 0 ? (
        <p className="rounded-md border border-dashed border-neutral-300 p-8 text-center text-neutral-500 dark:border-neutral-700">
          {hasFilters ? "검색/필터 조건에 맞는 이슈가 없습니다." : "등록된 이슈가 없습니다."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">
              <tr>
                <th className="px-3 py-2">순번</th>
                <th className="px-3 py-2">접수일자</th>
                <th className="px-3 py-2">제목</th>
                <th className="px-3 py-2">제품명</th>
                <th className="px-3 py-2">부품명</th>
                <th className="px-3 py-2">제조업체</th>
                <th className="px-3 py-2">발생국가</th>
                <th className="px-3 py-2">시리얼번호</th>
                <th className="px-3 py-2">수량</th>
                <th className="px-3 py-2">진행상황</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {issues.map((issue) => (
                <tr key={issue.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900">
                  <td className="px-3 py-2 text-neutral-500 dark:text-neutral-400">
                    {issue.seq_num}
                  </td>
                  <td className="px-3 py-2">{issue.occurred_at}</td>
                  <td className="px-3 py-2 font-medium">
                    <Link
                      href={`/issues/${issue.id}`}
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {issue.title}
                    </Link>
                  </td>
                  <td className="px-3 py-2 font-medium">{issue.product_name}</td>
                  <td className="px-3 py-2">{issue.part_name ?? "-"}</td>
                  <td className="px-3 py-2">{issue.manufacturer ?? "-"}</td>
                  <td className="px-3 py-2">{issue.country ?? "-"}</td>
                  <td className="px-3 py-2">{issue.serial_number ?? "-"}</td>
                  <td className="px-3 py-2">{issue.quantity ?? "-"}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={issue.status} />
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
