import { RowDataPacket } from "mysql2";
import { IUserQueryRepository } from "../../../Domain/repositories/users/IUserQueryRepository";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";
import { User } from "../../../Domain/models/User";
import { UserRole } from "../../../Domain/enums/UserRole";
import { toLogError } from "../../../utils/logging";

export class UserQueryRepository implements IUserQueryRepository
{
    public constructor(
        private readonly db: DbManager,
        private readonly logger: ILoggerService
    ) {}

    private map(r: RowDataPacket): User
    {
        return new User(
            r.id, r.username, r.email, r.role as UserRole, r.password_hash,
            r.full_name ?? "", r.avatar ?? "", r.is_active ?? 1,
            r.created_at ? new Date(r.created_at) : new Date(),
            r.updated_at ? new Date(r.updated_at) : new Date(),
        );
    }

    async findById(id: number): Promise<User>
    {
        const res = await this.db.getReadConnection();
        if (!res) return new User();
        try
        {
            const [rows] = await res.conn.execute<RowDataPacket[]>(`SELECT * FROM users WHERE id = ?`, [id]);
            return rows.length > 0 ? this.map(rows[0]) : new User();
        }
        catch (err)
        {
            const logErr = err instanceof Error ? err : String(err);
            this.logger.error("UserQueryRepository", "findById failed", toLogError(logErr));
            return new User();
        }
        finally { res.conn.release(); }
    }

    async findByUsername(username: string): Promise<User>
    {
        const res = await this.db.getReadConnection();
        if (!res) return new User();
        try
        {
            const [rows] = await res.conn.execute<RowDataPacket[]>(`SELECT * FROM users WHERE username = ?`, [username]);
            return rows.length > 0 ? this.map(rows[0]) : new User();
        }
        catch (err)
        {
            const logErr = err instanceof Error ? err : String(err);
            this.logger.error("UserQueryRepository", "findByUsername failed", toLogError(logErr));
            return new User();
        }
        finally { res.conn.release(); }
    }

    async findByEmail(email: string): Promise<User>
    {
        const res = await this.db.getReadConnection();
        if (!res) return new User();
        try
        {
            const [rows] = await res.conn.execute<RowDataPacket[]>(`SELECT * FROM users WHERE email = ?`, [email]);
            return rows.length > 0 ? this.map(rows[0]) : new User();
        }
        catch (err)
        {
            const logErr = err instanceof Error ? err : String(err);
            this.logger.error("UserQueryRepository", "findByEmail failed", toLogError(logErr));
            return new User();
        }
        finally { res.conn.release(); }
    }

    async findAll(): Promise<User[]>
    {
        const res = await this.db.getReadConnection();
        if (!res) return [];
        try
        {
            const [rows] = await res.conn.execute<RowDataPacket[]>(`SELECT * FROM users ORDER BY id ASC`);
            return rows.map((r) => this.map(r));
        }
        catch (err)
        {
            const logErr = err instanceof Error ? err : String(err);
            this.logger.error("UserQueryRepository", "findAll failed", toLogError(logErr));
            return [];
        }
        finally { res.conn.release(); }
    }
}
