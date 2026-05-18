import { RowDataPacket, ResultSetHeader } from "mysql2";
import { IProjectWatcherRepository } from "../../../Domain/repositories/projects/IProjectWatcherRepository";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";
import { Project } from "../../../Domain/models/Project";
import { ProjectStatus } from "../../../Domain/enums/ProjectStatus";
import { Priority } from "../../../Domain/enums/Priority";

export class ProjectWatcherRepository implements IProjectWatcherRepository
{
    public constructor(
        private readonly db: DbManager,
        private readonly logger: ILoggerService
    ) {}

    private map(r: RowDataPacket): Project
    {
        return new Project(
            r.id, r.team_id, r.name, r.description,
            r.status as ProjectStatus, r.priority as Priority,
            r.deadline ? new Date(r.deadline) : new Date(),
            r.created_at ? new Date(r.created_at) : new Date(),
            r.updated_at ? new Date(r.updated_at) : new Date(),
        );
    }

    async addWatcher(projectId: number, userId: number): Promise<boolean>
    {
        const res = await this.db.getWriteConnection();
        if (!res) return false;
        try
        {
            await res.conn.execute<ResultSetHeader>(
                `INSERT IGNORE INTO project_watchers (project_id, user_id) VALUES (?, ?)`, [projectId, userId]
            );
            return true;
        }
        catch (err)
        {
            this.logger.error("ProjectWatcherRepository", "addWatcher failed", err);
            return false;
        }
        finally
        {
            res.conn.release();
        }
    }

    async removeWatcher(projectId: number, userId: number): Promise<boolean>
    {
        const res = await this.db.getWriteConnection();
        if (!res) return false;
        try
        {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `DELETE FROM project_watchers WHERE project_id = ? AND user_id = ?`, [projectId, userId]
            );
            return result.affectedRows > 0;
        }
        catch (err)
        {
            this.logger.error("ProjectWatcherRepository", "removeWatcher failed", err);
            return false;
        }
        finally
        {
            res.conn.release();
        }
    }

    async isWatcher(projectId: number, userId: number): Promise<boolean>
    {
        const res = await this.db.getReadConnection();
        if (!res) return false;
        try
        {
            const [rows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT 1 FROM project_watchers WHERE project_id = ? AND user_id = ? LIMIT 1`, [projectId, userId]
            );
            return rows.length > 0;
        }
        catch (err)
        {
            this.logger.error("ProjectWatcherRepository", "isWatcher failed", err);
            return false;
        }
        finally
        {
            res.conn.release();
        }
    }

    async getWatcherCount(projectId: number): Promise<number>
    {
        const res = await this.db.getReadConnection();
        if (!res) return 0;
        try
        {
            const [rows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT COUNT(*) as cnt FROM project_watchers WHERE project_id = ?`, [projectId]
            );
            return rows[0].cnt ?? 0;
        }
        catch (err)
        {
            this.logger.error("ProjectWatcherRepository", "getWatcherCount failed", err);
            return 0;
        }
        finally
        {
            res.conn.release();
        }
    }

    async getWatcherCounts(projectIds: number[]): Promise<Map<number, number>>
    {
        const result = new Map<number, number>();
        if (projectIds.length === 0) return result;

        const res = await this.db.getReadConnection();
        if (!res) return result;

        try
        {
            const placeholders = projectIds.map(() => "?").join(", ");
            const [rows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT project_id, COUNT(*) AS cnt FROM project_watchers WHERE project_id IN (${placeholders}) GROUP BY project_id`,
                projectIds
            );
            for (const r of rows) result.set(r.project_id, r.cnt ?? 0);
            return result;
        }
        catch (err)
        {
            this.logger.error("ProjectWatcherRepository", "getWatcherCounts failed", err);
            return result;
        }
        finally
        {
            res.conn.release();
        }
    }
}
