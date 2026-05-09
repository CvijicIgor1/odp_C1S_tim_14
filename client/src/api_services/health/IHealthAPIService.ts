import type { ApiResponse } from "../team/ITeamAPIService";

export type DbNodeInfo = {
  name: string;
  host: string;
  port: number;
  status: string;
  lastCheck: string | null;
  successfulConnections: number;
  failedConnections: number;
};

export interface IHealthAPIService {
  getDbHealth(): Promise<ApiResponse<DbNodeInfo[]>>;
  failover(slaveIndex: 0 | 1): Promise<ApiResponse<void>>;
}
