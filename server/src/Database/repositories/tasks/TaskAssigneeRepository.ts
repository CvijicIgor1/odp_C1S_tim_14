import { RowDataPacket, ResultSetHeader } from "mysql2";
import { toLogError } from "../../../utils/logging";
import { ITaskAssigneeRepository } from "../../../Domain/repositories/tasks/ITaskAssigneeRepository";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";

export class TaskAssigneeRepository implements ITaskAssigneeRepository
{
    public constructor(
        private readonly db: DbManager,
        private readonly logger: ILoggerService
    ) {}

    async addAssignee(taskId: number, userId: number, assignedBy: number): Promise<boolean>
    {
        const res = await this.db.getWriteConnection();
        if (!res) return false;
        try
        {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `INSERT INTO task_assignees (task_id, user_id, assigned_by) VALUES (?, ?, ?)`,
                [taskId, userId, assignedBy]
            );
            return result.affectedRows > 0;
        }
        catch (err)
        {
            this.logger.error("TaskAssigneeRepository", "addAssignee failed", toLogError(err instanceof Error ? err : String(err)));
            return false;
        }
        finally
        {
            res.conn.release();
        }
    }

    async removeAssignee(taskId: number, userId: number): Promise<boolean>
    {
        const res = await this.db.getWriteConnection();
        if (!res) return false;
        try
        {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `DELETE FROM task_assignees WHERE task_id = ? AND user_id = ?`, [taskId, userId]
            );
            return result.affectedRows > 0;
        }
        catch (err)
        {
            this.logger.error("TaskAssigneeRepository", "removeAssignee failed", toLogError(err instanceof Error ? err : String(err)));
            return false;
        }
        finally
        {
            res.conn.release();
        }
    }

    async isAssignee(taskId: number, userId: number): Promise<boolean>
    {
        const res = await this.db.getReadConnection();
        if (!res) return false;
        try
        {
            const [rows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT 1 FROM task_assignees WHERE task_id = ? AND user_id = ? LIMIT 1`, [taskId, userId]
            );
            return rows.length > 0;
        }
        catch (err)
        {
            this.logger.error("TaskAssigneeRepository", "isAssignee failed", toLogError(err instanceof Error ? err : String(err)));
            return false;
        }
        finally
        {
            res.conn.release();
        }
    }
}
