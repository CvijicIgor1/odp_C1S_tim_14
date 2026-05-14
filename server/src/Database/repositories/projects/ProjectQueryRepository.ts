import { RowDataPacket } from "mysql2";
import { IProjectQueryRepository } from "../../../Domain/repositories/projects/IProjectQueryRepository";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";
import { Project } from "../../../Domain/models/Project";
import { ProjectFilters } from "../../../Domain/types/ProjectFilters";
import { ProjectStatus } from "../../../Domain/enums/ProjectStatus";
import { Priority } from "../../../Domain/enums/Priority";

export class ProjectQueryRepository implements IProjectQueryRepository
{
    public constructor(
        private readonly db: DbManager,
        private readonly logger: ILoggerService
    ) {}

    private map(r: RowDataPacket): Project
    {
        return new Project(
            r.id,
            r.team_id,
            r.name,
            r.description,
            r.status as ProjectStatus,
            r.priority as Priority,
            r.deadline ? new Date(r.deadline) : new Date(),
            r.created_at ? new Date(r.created_at) : new Date(),
            r.updated_at ? new Date(r.updated_at) : new Date(),
        );
    }

    private safeInt(value: number, fallback: number): number
    {
        const n = Math.floor(value);
        return Number.isFinite(n) && n > 0 ? n : fallback;
    }

    async findAllByTeam(teamId: number, page: number, limit: number, filters?: ProjectFilters): Promise<{ projects: Project[]; totalNumber: number }>
    {
        const res = await this.db.getReadConnection();
        if (!res) return { projects: [], totalNumber: 0 };

        const safePage = this.safeInt(page, 1);
        const safeLimit = this.safeInt(limit, 20);
        const offset = (safePage - 1) * safeLimit;

        try
        {
            const conditions: string[] = ["team_id = ?"];
            const values: (string | number)[] = [teamId];

            if (filters?.status) { conditions.push("status = ?"); values.push(filters.status); }
            if (filters?.priority) { conditions.push("priority = ?"); values.push(filters.priority); }
            if (filters?.tagId) { conditions.push("id IN (SELECT project_id FROM project_tags WHERE tag_id = ?)"); values.push(filters.tagId); }

            const where = `WHERE ${conditions.join(" AND ")}`;

            const [countRows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT COUNT(*) AS cnt FROM projects ${where}`, values
            );
            const totalNumber = countRows[0].cnt ?? 0;

            const [rows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT * FROM projects ${where} ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${offset}`, values
            );

            return { projects: rows.map((r) => this.map(r)), totalNumber };
        }
        catch (err)
        {
            this.logger.error("ProjectQueryRepository", "findAllByTeam failed", err);
            return { projects: [], totalNumber: 0 };
        }
        finally
        {
            res.conn.release();
        }
    }

    async findById(id: number): Promise<Project>
    {
        const res = await this.db.getReadConnection();
        if (!res) return new Project();
        try
        {
            const [rows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT * FROM projects WHERE id = ?`, [id]
            );
            return rows.length > 0 ? this.map(rows[0]) : new Project();
        }
        catch (err)
        {
            this.logger.error("ProjectQueryRepository", "findById failed", err);
            return new Project();
        }
        finally
        {
            res.conn.release();
        }
    }

    async findAllAsAdmin(page: number, limit: number): Promise<{ projects: Project[]; totalNumber: number }>
    {
        const res = await this.db.getReadConnection();
        if (!res) return { projects: [], totalNumber: 0 };
        try
        {
            const safePage = this.safeInt(page, 1);
            const safeLimit = this.safeInt(limit, 20);
            const offset = (safePage - 1) * safeLimit;

            const [[countRow]] = await res.conn.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM projects`);
            const totalNumber = Number(countRow.total);

            const [rows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT * FROM projects ORDER BY name ASC LIMIT ${safeLimit} OFFSET ${offset}`
            );
            return { projects: rows.map((r) => this.map(r)), totalNumber };
        }
        catch (err)
        {
            this.logger.error("ProjectQueryRepository", "findAllAsAdmin failed", err);
            return { projects: [], totalNumber: 0 };
        }
        finally
        {
            res.conn.release();
        }
    }

    async findWatchedByUser(userId: number, page: number, limit: number): Promise<{ projects: Project[]; totalNumber: number }>
    {
        const res = await this.db.getReadConnection();
        if (!res) return { projects: [], totalNumber: 0 };

        const safePage = this.safeInt(page, 1);
        const safeLimit = this.safeInt(limit, 20);
        const offset = (safePage - 1) * safeLimit;

        try
        {
            const [countRows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT COUNT(*) AS cnt FROM projects WHERE id IN (SELECT project_id FROM project_watchers WHERE user_id = ?)`, [userId]
            );
            const totalNumber = countRows[0].cnt ?? 0;

            const [rows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT * FROM projects WHERE id IN (SELECT project_id FROM project_watchers WHERE user_id = ?) ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${offset}`,
                [userId]
            );
            return { projects: rows.map((r) => this.map(r)), totalNumber };
        }
        catch (err)
        {
            this.logger.error("ProjectQueryRepository", "findWatchedByUser failed", err);
            return { projects: [], totalNumber: 0 };
        }
        finally
        {
            res.conn.release();
        }
    }
}
