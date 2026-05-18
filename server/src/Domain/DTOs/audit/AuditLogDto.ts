type JsonScalar = string | number | boolean | null;
type JsonValue = JsonScalar | JsonValue[] | { [key: string]: JsonValue };

export class AuditLogDto {
  public constructor(
    public id: number = 0,
    public user_id: number | null = null,
    public username: string | null = null,
    public action: string = "",
    public entity_type: string | null = null,
    public entity_id: number | null = null,
    public detail: { [key: string]: JsonValue } | null = null,
    public ip_address: string | null = null,
    public created_at: Date = new Date()
  ) {}
}
