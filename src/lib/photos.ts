import { query } from "./db";

export interface IssuePhoto {
  id: number;
  issue_id: number;
  url: string;
  created_at: string;
}

type PhotoRow = Omit<IssuePhoto, "created_at"> & { created_at: string | Date };

function toPhoto(row: PhotoRow): IssuePhoto {
  return {
    ...row,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

export async function listPhotos(issueId: number): Promise<IssuePhoto[]> {
  const rows = await query<PhotoRow>(
    "SELECT * FROM issue_photos WHERE issue_id = $1 ORDER BY id ASC",
    [issueId],
  );
  return rows.map(toPhoto);
}

export async function addPhoto(issueId: number, url: string): Promise<IssuePhoto> {
  const rows = await query<PhotoRow>(
    "INSERT INTO issue_photos (issue_id, url) VALUES ($1, $2) RETURNING *",
    [issueId, url],
  );
  return toPhoto(rows[0]);
}

export async function deletePhoto(id: number): Promise<IssuePhoto | undefined> {
  const rows = await query<PhotoRow>(
    "DELETE FROM issue_photos WHERE id = $1 RETURNING *",
    [id],
  );
  return rows[0] ? toPhoto(rows[0]) : undefined;
}
