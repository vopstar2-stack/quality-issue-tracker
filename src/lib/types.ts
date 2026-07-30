export const ISSUE_STATUSES = ["진행중", "완료", "처리없음"] as const;

export type IssueStatus = (typeof ISSUE_STATUSES)[number];

export interface Issue {
  id: number;
  title: string;
  /** 접수일자 */
  occurred_at: string;
  /** 발생일자 */
  occurrence_date: string | null;
  product_name: string;
  part_name: string | null;
  manufacturer: string | null;
  location: string | null;
  country: string | null;
  serial_number: string | null;
  quantity: number | null;
  description: string | null;
  status: IssueStatus;
  /** 발생원인 (사용자 입력) */
  cause: string | null;
  /** AI추정원인 */
  ai_estimated_cause: string | null;
  /** 대책 (사용자 입력) */
  countermeasure: string | null;
  /** AI추정대책 */
  ai_estimated_countermeasure: string | null;
  /** 결론 (사용자 입력) */
  conclusion: string | null;
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
  occurrence_date?: string | null;
  product_name: string;
  part_name?: string | null;
  manufacturer?: string | null;
  location?: string | null;
  country?: string | null;
  serial_number?: string | null;
  quantity?: number | null;
  description?: string | null;
  status: IssueStatus;
  cause?: string | null;
  ai_estimated_cause?: string | null;
  countermeasure?: string | null;
  ai_estimated_countermeasure?: string | null;
  conclusion?: string | null;
}
