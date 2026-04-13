export class AuditLog {
  public constructor(
    public id: number = 0,
    public user_id: number = 0,
    public action: string = "",
    public entity_type: string = "",
    public entity_id: number = 0,
    public detail: string = "",
    public created_at: Date = new Date()
  ) {}
}
}
