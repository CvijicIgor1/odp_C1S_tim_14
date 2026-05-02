export class AuditLogDto {
  public constructor(
    public id: number = 0,
    public user_id: number | null = null,
    public action: string = "",
    public entity_type: string | null = null,
    public entity_id: number | null = null,
    public detail: Record<string, unknown> | null = null,
    public ip_address: string | null = null,
    public created_at: Date = new Date()
  ) {}
}
