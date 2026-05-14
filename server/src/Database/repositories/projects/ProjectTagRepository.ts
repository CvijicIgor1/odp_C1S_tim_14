import { RowDataPacket, ResultSetHeader } from "mysql2";
import { IProjectTagRepository } from "../../../Domain/repositories/projects/IProjectTagRepository";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";
import { Tag } from "../../../Domain/models/Tag";

export class ProjectTagRepository implements IProjectTagRepository
{
    public constructor(
        private readonly db: DbManager,
        private readonly logger: ILoggerService
    ) {}

    private mapTag(r: RowDataPacket): Tag
    {
        return new Tag(r.id, r.name);
    }

    async addTag(projectId: number, tagId: number): Promise<boolean>
    {
        const res = await this.db.getWriteConnection();
        if (!res) return false;
        try
        {
            await res.conn.execute<ResultSetHeader>(
                `INSERT IGNORE INTO project_tags (project_id, tag_id) VALUES (?, ?)`, [projectId, tagId]
            );
            return true;
        }
        catch (err)
        {
            this.logger.error("ProjectTagRepository", "addTag failed", err);
            return false;
        }
        finally
        {
            res.conn.release();
        }
    }

    async removeTag(projectId: number, tagId: number): Promise<boolean>
    {
        const res = await this.db.getWriteConnection();
        if (!res) return false;
        try
        {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `DELETE FROM project_tags WHERE project_id = ? AND tag_id = ?`, [projectId, tagId]
            );
            return result.affectedRows > 0;
        }
        catch (err)
        {
            this.logger.error("ProjectTagRepository", "removeTag failed", err);
            return false;
        }
        finally
        {
            res.conn.release();
        }
    }

    async getTagsForProject(projectId: number): Promise<Tag[]>
    {
        const res = await this.db.getReadConnection();
        if (!res) return [];
        try
        {
            const [rows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT * FROM tags WHERE id IN (SELECT tag_id FROM project_tags WHERE project_id = ?) ORDER BY name ASC`,
                [projectId]
            );
            return rows.map((r) => this.mapTag(r));
        }
        catch (err)
        {
            this.logger.error("ProjectTagRepository", "getTagsForProject failed", err);
            return [];
        }
        finally
        {
            res.conn.release();
        }
    }

    async getTagsForProjects(projectIds: number[]): Promise<Map<number, Tag[]>>
    {
        const result = new Map<number, Tag[]>();
        if (projectIds.length === 0) return result;

        const res = await this.db.getReadConnection();
        if (!res) return result;

        try
        {
            const placeholders = projectIds.map(() => "?").join(", ");
            const [bridgeRows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT project_id, tag_id FROM project_tags WHERE project_id IN (${placeholders})`, projectIds
            );
            if (bridgeRows.length === 0) return result;

            const tagIds = [...new Set(bridgeRows.map((r) => r.tag_id as number))];
            const tagPlaceholders = tagIds.map(() => "?").join(", ");
            const [tagRows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT id, name FROM tags WHERE id IN (${tagPlaceholders}) ORDER BY name ASC`, tagIds
            );

            const tagMap = new Map<number, Tag>(tagRows.map((r) => [r.id as number, new Tag(r.id, r.name)]));

            for (const b of bridgeRows)
            {
                const tag = tagMap.get(b.tag_id);
                if (!tag) continue;
                if (!result.has(b.project_id)) result.set(b.project_id, []);
                result.get(b.project_id)!.push(tag);
            }
            return result;
        }
        catch (err)
        {
            this.logger.error("ProjectTagRepository", "getTagsForProjects failed", err);
            return result;
        }
        finally
        {
            res.conn.release();
        }
    }
}
