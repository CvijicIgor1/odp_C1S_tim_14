import { AuditLog } from "../../models/AuditLog";

export interface IAuditRepository{
    create(log: AuditLog): Promise<AuditLog>;
    findAll(page:number, limit:number): Promise<{ logs: AuditLog[]; totalNumber: number }>;
}