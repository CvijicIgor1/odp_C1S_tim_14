import { ResultSetHeader, RowDataPacket } from "mysql2";
import { toLogError } from "../../../utils/logging";
import { Tag } from "../../../Domain/models/Tag";
import { ITagRepository } from "../../../Domain/repositories/tags/ITagsRepository";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";
import { DbManager } from "../../connection/DbConnectionPool";

const safeInt = (n: number, fallback: number): number => {
    const v = Math.floor(n);
    return Number.isFinite(v) && v > 0 ? v : fallback;
};

export class TagRepository implements ITagRepository {
    public constructor(
        private readonly db: DbManager,
        private readonly logger: ILoggerService
    ) { }

    private map(r: RowDataPacket): Tag {
        return new Tag(
            r.id,
            r.name,
        );
    }

    async createNewTag(newTag: Tag): Promise<Tag> {
        const res = await this.db.getWriteConnection();
        if (!res) return new Tag();
        try {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `INSERT INTO tags (name) VALUES (?)`,
                [newTag.name],
            );
            if (result.insertId === 0) return new Tag();
            return new Tag(
                result.insertId,
                newTag.name
            );
        } catch (err) {
            this.logger.error("TagRepository", "create failed", toLogError(err instanceof Error ? err : String(err)));
            return new Tag();
        } finally {
            res.conn.release();
        }
    }

    async deleteTag(tagId: number): Promise<boolean> {
        const res = await this.db.getWriteConnection();
        if (!res) return false;

        try {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `DELETE FROM tags WHERE id = ?`,
                [tagId]
            );

            return result.affectedRows > 0;
        } catch (err) {
            this.logger.error("TagRepository", "delete failed", toLogError(err instanceof Error ? err : String(err)));
            return false;
        } finally {
            res.conn.release();
        }
    }

    async findAllTags(page: number, limit: number): Promise<{ tags: Tag[]; totalNumber: number; }> 
    {
        const safePage  = safeInt(page, 1);
        const safeLimit = Math.min(safeInt(limit, 20), 100);
        const offset    = (safePage - 1) * safeLimit;

        const res = await this.db.getReadConnection();
        if (!res) return { tags: [], totalNumber: 0 };

        try 
        {
            const [[countRow]] = await res.conn.execute<RowDataPacket[]>(
                `SELECT COUNT(*) AS total FROM tags`
            );
            const totalNumber = (countRow as RowDataPacket).total as number;

            const [rows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT * FROM tags ORDER BY name ASC LIMIT ${safeLimit} OFFSET ${offset}`
            );

            return { tags: rows.map((r) => this.map(r)), totalNumber };
        } 
        catch (err) 
        {
            this.logger.error("TagRepository", "findAllTags failed", toLogError(err instanceof Error ? err : String(err)));
            return { tags: [], totalNumber: 0 };
        } 
        finally 
        {
            res.conn.release();
        }
    }
}
