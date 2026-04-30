import { ResultSetHeader, RowDataPacket } from "mysql2";
import { CreateTagDto } from "../../../Domain/DTOs/tags/CreateTagDto";
import { Tag } from "../../../Domain/models/Tag";
import { ITagRepository } from "../../../Domain/repositories/tags/ITagsRepository";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";
import { DbManager } from "../../connection/DbConnectionPool";

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

    async createNewTag(dto: CreateTagDto): Promise<Tag> {
        const res = await this.db.getWriteConnection();
        if (!res) return new Tag();
        try {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `INSERT INTO tags (name) VALUES (?)`,
                [dto.name],
            );
            if (result.insertId === 0) return new Tag();
            return new Tag(
                result.insertId,
                dto.name
            );
        } catch (err) {
            this.logger.error("TagRepository", "create failed", err);
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
            this.logger.error("TagRepository", "delete failed", err);
            return false;
        } finally {
            res.conn.release();
        }
    }

    async findAllTags(): Promise<{ tags: Tag[]; totalNumber: number; }> {
        const res = await this.db.getReadConnection();
        if (!res) return { tags: [], totalNumber: 0 };

        try {
            const [rows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT * FROM tags ORDER BY name ASC`
            );

            const tags = rows.map((r) => this.map(r));
            return { tags, totalNumber: tags.length };
        } catch (err) {
            this.logger.error("TagRepository", "findAllTags failed", err);
            return { tags: [], totalNumber: 0 };
        } finally {
            res.conn.release();
        }
    }

}