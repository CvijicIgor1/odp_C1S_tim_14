import { RowDataPacket, ResultSetHeader } from "mysql2";
import { toLogError } from "../../../utils/logging";
import { ITaskCommentRepository } from "../../../Domain/repositories/tasks/ITaskCommentRepository";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";
import { Comment } from "../../../Domain/models/Comment";

export class TaskCommentRepository implements ITaskCommentRepository
{
    public constructor(
        private readonly db: DbManager,
        private readonly logger: ILoggerService
    ) {}

    private mapComment(r: RowDataPacket): Comment
    {
        return new Comment(
            r.id, r.task_id, r.user_id, r.content,
            r.created_at ? new Date(r.created_at) : new Date()
        );
    }

    async getComments(taskId: number): Promise<Comment[]>
    {
        const res = await this.db.getReadConnection();
        if (!res) return [];
        try
        {
            const [rows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT * FROM comments WHERE task_id = ? ORDER BY created_at ASC`, [taskId]
            );
            return rows.map((r) => this.mapComment(r));
        }
        catch (err)
        {
            this.logger.error("TaskCommentRepository", "getComments failed", toLogError(err instanceof Error ? err : String(err)));
            return [];
        }
        finally
        {
            res.conn.release();
        }
    }

    async findCommentById(commentId: number): Promise<Comment>
    {
        const res = await this.db.getReadConnection();
        if (!res) return new Comment();
        try
        {
            const [rows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT * FROM comments WHERE id = ?`, [commentId]
            );
            return rows.length > 0 ? this.mapComment(rows[0]) : new Comment();
        }
        catch (err)
        {
            this.logger.error("TaskCommentRepository", "findCommentById failed", toLogError(err instanceof Error ? err : String(err)));
            return new Comment();
        }
        finally
        {
            res.conn.release();
        }
    }

    async addComment(taskId: number, userId: number, content: string): Promise<Comment>
    {
        const res = await this.db.getWriteConnection();
        if (!res) return new Comment();
        try
        {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)`,
                [taskId, userId, content]
            );
            if (result.insertId === 0) return new Comment();
            return new Comment(result.insertId, taskId, userId, content);
        }
        catch (err)
        {
            this.logger.error("TaskCommentRepository", "addComment failed", toLogError(err instanceof Error ? err : String(err)));
            return new Comment();
        }
        finally
        {
            res.conn.release();
        }
    }

    async deleteComment(commentId: number): Promise<boolean>
    {
        const res = await this.db.getWriteConnection();
        if (!res) return false;
        try
        {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `DELETE FROM comments WHERE id = ?`, [commentId]
            );
            return result.affectedRows > 0;
        }
        catch (err)
        {
            this.logger.error("TaskCommentRepository", "deleteComment failed", toLogError(err instanceof Error ? err : String(err)));
            return false;
        }
        finally
        {
            res.conn.release();
        }
    }
}
