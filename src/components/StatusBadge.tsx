import type { IssueStatus } from "@/lib/types";

const COLORS: Record<IssueStatus, string> = {
  접수: "bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-100",
  조사중: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  조치중: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  완료: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  보류: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function StatusBadge({ status }: { status: IssueStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${COLORS[status]}`}
    >
      {status}
    </span>
  );
}
