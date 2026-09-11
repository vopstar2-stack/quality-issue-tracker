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
  /** 대책 (사용자 입력) */
  countermeasure: string | null;
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
  countermeasure?: string | null;
  conclusion?: string | null;
}

/** 포스콤 탱크 누유대체: 누유 이슈 발생 시 신품을 먼저 출고하고, 포스콤에서 대체품 탱크를
 * 받아오는 흐름을 기록한다. 대체품 입고 전에는 inbound_* 값이 비어있을 수 있다. */
export interface TankReplacement {
  id: number;
  title: string;
  /** 신품 출고일자 */
  outbound_date: string;
  outbound_quantity: number | null;
  outbound_serial: string | null;
  /** 대체품 입고일자 (아직 안 받았으면 null) */
  inbound_date: string | null;
  inbound_quantity: number | null;
  inbound_serial: string | null;
  created_at: string;
  updated_at: string;
}

export interface TankReplacementInput {
  title: string;
  outbound_date: string;
  outbound_quantity?: number | null;
  outbound_serial?: string | null;
  inbound_date?: string | null;
  inbound_quantity?: number | null;
  inbound_serial?: string | null;
}
