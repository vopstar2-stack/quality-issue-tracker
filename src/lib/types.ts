export const ISSUE_STATUSES = ["접수", "조사중", "조치중", "완료", "보류"] as const;

export type IssueStatus = (typeof ISSUE_STATUSES)[number];

export interface Issue {
  id: number;
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

export interface IssueInput {
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
