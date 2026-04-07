import { NodeStatus } from "../enums/NodeStatus";

export class DbNode {
  public constructor(
    public name: string = "",
    public host: string = "",
    public port: number = 3306,
    public user: string = "",
    public password: string = "",
    public database: string = "",
    public status: NodeStatus = NodeStatus.HEALTHY,
    public lastCheck: Date | null = null,
    public successfulWrites: number = 0,
    public failedWrites: number = 0
  ) {}
}
