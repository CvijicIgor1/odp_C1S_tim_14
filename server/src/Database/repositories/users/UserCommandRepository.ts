import { RowDataPacket, ResultSetHeader } from "mysql2";
import { toLogError } from "../../../utils/logging";
import { IUserCommandRepository } from "../../../Domain/repositories/users/IUserCommandRepository";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";
import { User } from "../../../Domain/models/User";

export class UserCommandRepository implements IUserCommandRepository
{
    public constructor(
        private readonly db: DbManager,
        private readonly logger: ILoggerService
    ) {}

    async create(user: User): Promise<User | "duplicate">
    {
        const res = await this.db.getWriteConnection();
        if (!res) return new User();
        try
        {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `INSERT INTO users (username, email, role, password_hash, full_name, avatar) VALUES (?, ?, ?, ?, ?, ?)`,
                [user.username, user.email, user.role, user.passwordHash, user.fullName, user.avatar]
            );
            if (result.insertId === 0) return new User();
            return new User(result.insertId, user.username, user.email, user.role, user.passwordHash, user.fullName, user.avatar);
        }
        catch (err)
        {
            if ((err as { code?: string }).code === "ER_DUP_ENTRY") return "duplicate";
            this.logger.error("UserCommandRepository", "create failed", toLogError(err instanceof Error ? err : String(err)));
            return new User();
        }
        finally { res.conn.release(); }
    }

    async update(user: User): Promise<boolean>
    {
        const res = await this.db.getWriteConnection();
        if (!res) return false;
        try
        {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `UPDATE users SET username = ?, email = ?, role = ?, is_active = ? WHERE id = ?`,
                [user.username, user.email, user.role, user.isActive, user.id]
            );
            return result.affectedRows > 0;
        }
        catch (err)
        {
            this.logger.error("UserCommandRepository", "update failed", toLogError(err instanceof Error ? err : String(err)));
            return false;
        }
        finally { res.conn.release(); }
    }

    async updateProfile(id: number, username: string, email: string, avatar: string, passwordHash?: string): Promise<boolean>
    {
        const res = await this.db.getWriteConnection();
        if (!res) return false;
        try
        {
            if (passwordHash)
            {
                const [result] = await res.conn.execute<ResultSetHeader>(
                    `UPDATE users SET username = ?, email = ?, avatar = ?, password_hash = ? WHERE id = ?`,
                    [username, email, avatar, passwordHash, id]
                );
                return result.affectedRows > 0;
            }
            const [result] = await res.conn.execute<ResultSetHeader>(
                `UPDATE users SET username = ?, email = ?, avatar = ? WHERE id = ?`,
                [username, email, avatar, id]
            );
            return result.affectedRows > 0;
        }
        catch (err)
        {
            this.logger.error("UserCommandRepository", "updateProfile failed", toLogError(err instanceof Error ? err : String(err)));
            return false;
        }
        finally { res.conn.release(); }
    }

    async exists(id: number): Promise<boolean>
    {
        const res = await this.db.getReadConnection();
        if (!res) return false;
        try
        {
            const [rows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT COUNT(*) as cnt FROM users WHERE id = ?`, [id]
            );
            return (rows[0]?.cnt ?? 0) > 0;
        }
        catch (err)
        {
            this.logger.error("UserCommandRepository", "exists failed", toLogError(err instanceof Error ? err : String(err)));
            return false;
        }
        finally { res.conn.release(); }
    }
}
