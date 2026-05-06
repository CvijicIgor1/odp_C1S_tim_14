import type { ApiResponse } from "../team/ITeamAPIService";
import type { PaginatedList } from "../../models/team/TeamTypes";

export type AuditLogDto = {
  id: number;
  user_id: number | null;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  detail: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
};

export interface IAuditLogAPIService {
  getLogs(page?: number, limit?: number): Promise<ApiResponse<PaginatedList<AuditLogDto>>>;
}
