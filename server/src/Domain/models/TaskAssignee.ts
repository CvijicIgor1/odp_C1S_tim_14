export class TaskAssignee {
  public constructor(
    public taskId: number = 0,
    public userId: number = 0,
    public assignedBy: number = 0,
    public assignedAt: Date = new Date(),
  ) {}
}