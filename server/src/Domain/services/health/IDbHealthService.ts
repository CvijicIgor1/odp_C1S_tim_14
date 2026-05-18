import { DbNode } from "../../models/DbNode";

export interface IDbHealthService {
  getNodes(): DbNode[];
  promoteSlaveToMaster(slaveIndex: 0 | 1): Promise<{ success: boolean; message: string }>;
}
