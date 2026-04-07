export class AuditLog {
  public constructor(
    public id: number = 0,
    public userId: number = 0,
    public action: string = "",
    public entityType: string = "",
    public entityId: number = 0,
    public detail: string = "",
    public createdAt: Date = new Date()
  ) {}
}
}
