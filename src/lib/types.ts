export const ISSUE_STATUSES = ["접수", "조사중", "조치중", "완료", "보류"] as const;

export type IssueStatus = (typeof ISSUE_STATUSES)[number];

export interface Issue {
  id: number;
  title: string;
  occurred_at: string;
  product_name: string;
  part_name: string | null;
  manufacturer: string | null;
  location: string | null;
  country: string | null;
  serial_number: string | null;
  quantity: number | null;
  description: string | null;
  status: IssueStatus;
  handler: string | null;
  created_at: string;
  updated_at: string;
}

export interface IssueWithSeq extends Issue {
  /** 등록 순서 기준 고정 번호 (id 오름차순). 정렬/검색/필터와 무관하게 동일한 이슈는 항상 같은 값을 가짐. */
  seq_num: number;
}

export interface IssueFilters {
  q?: string;
  status?: string;
  manufacturer?: string;
  country?: string;
}

export interface IssueInput {
  title: string;
  occurred_at: string;
  product_name: string;
  part_name?: string | null;
  manufacturer?: string | null;
  location?: string | null;
  country?: string | null;
  serial_number?: string | null;
  quantity?: number | null;
  description?: string | null;
  status: IssueStatus;
  handler?: string | null;
}
