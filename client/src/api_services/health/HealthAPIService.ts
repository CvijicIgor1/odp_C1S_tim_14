import axios from "axios";
import type { IHealthAPIService, DbNodeInfo } from "./IHealthAPIService";
import type { ApiResponse } from "../team/ITeamAPIService";
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

export const healthApi: IHealthAPIService = {
  async getDbHealth() {
    return axios
      .get<ApiResponse<DbNodeInfo[]>>(`${BASE}health/db`, { headers: auth() })
      .then(r => r.data)
      .catch(e => err(e, "Failed to load DB health"));
  },

  async failover(slaveIndex) {
    return axios
      .post<ApiResponse<void>>(`${BASE}health/failover`, { slaveIndex }, { headers: auth() })
      .then(r => r.data)
      .catch(e => err(e, "Failover failed"));
  },
};
