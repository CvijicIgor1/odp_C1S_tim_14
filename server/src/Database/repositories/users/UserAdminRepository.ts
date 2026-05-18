import { ResultSetHeader } from "mysql2";
import { toLogError } from "../../../utils/logging";
import { IUserAdminRepository } from "../../../Domain/repositories/users/IUserAdminRepository";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";
import { UserRole } from "../../../Domain/enums/UserRole";

export class UserAdminRepository implements IUserAdminRepository
{
    public constructor(
        private readonly db: DbManager,
        private readonly logger: ILoggerService
    ) {}

    async updateRole(id: number, role: UserRole): Promise<boolean>
    {
        const res = await this.db.getWriteConnection();
        if (!res) return false;
        try
        {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `UPDATE users SET role = ? WHERE id = ?`, [role, id]
            );
            return result.affectedRows > 0;
        }
        catch (err)
        {
            this.logger.error("UserAdminRepository", "updateRole failed", toLogError(err instanceof Error ? err : String(err)));
            return false;
        }
        finally { res.conn.release(); }
    }

    async updateStatus(id: number, isActive: boolean): Promise<boolean>
    {
        const res = await this.db.getWriteConnection();
        if (!res) return false;
        try
        {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `UPDATE users SET is_active = ? WHERE id = ?`, [isActive ? 1 : 0, id]
            );
            return result.affectedRows > 0;
        }
        catch (err)
        {
            this.logger.error("UserAdminRepository", "updateStatus failed", toLogError(err instanceof Error ? err : String(err)));
            return false;
        }
        finally { res.conn.release(); }
    }

    async deactivate(id: number): Promise<boolean>
    {
        const res = await this.db.getWriteConnection();
        if (!res) return false;
        try
        {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `UPDATE users SET is_active = 0 WHERE id = ?`, [id]
            );
            return result.affectedRows > 0;
        }
        catch (err)
        {
            this.logger.error("UserAdminRepository", "deactivate failed", toLogError(err instanceof Error ? err : String(err)));
            return false;
        }
        finally { res.conn.release(); }
    }
}
