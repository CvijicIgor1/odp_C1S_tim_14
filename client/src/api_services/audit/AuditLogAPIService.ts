import axios from "axios";
import type { IAuditLogAPIService, AuditLogDto } from "./IAuditLogAPIService";
import type { ApiResponse } from "../team/ITeamAPIService";
import type { PaginatedList } from "../../models/team/TeamTypes";
import { readItem } from "../../helpers/local_storage";

const BASE = import.meta.env.VITE_API_URL;

const auth = () => {
  const token = readItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const err = <T>(e: unknown, fallback: string): ApiResponse<T> => ({
  success: false,
  message: axios.isAxiosError(e) ? (e.response?.data as { message?: string })?.message ?? fallback : fallback,
});

export const auditLogApi: IAuditLogAPIService = {
  async getLogs(page = 1, limit = 20) {
    return axios
      .get<ApiResponse<PaginatedList<AuditLogDto>>>(`${BASE}audits/logs`, { headers: auth(), params: { page, limit } })
      .then(r => r.data)
      .catch(e => err(e, "Failed to load audit logs"));
  },
};
