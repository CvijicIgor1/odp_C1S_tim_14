import { RowDataPacket, ResultSetHeader } from "mysql2";
import { toLogError } from "../../../utils/logging";
import { ITaskCommandRepository } from "../../../Domain/repositories/tasks/ITaskCommandRepository";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";
import { Task } from "../../../Domain/models/Task";
import { TaskStatus } from "../../../Domain/enums/TaskStatus";

export class TaskCommandRepository implements ITaskCommandRepository
{
    public constructor(
        private readonly db: DbManager,
        private readonly logger: ILoggerService
    ) {}

    async create(newTask: Task): Promise<Task>
    {
        const res = await this.db.getWriteConnection();
        if (!res) return new Task();
        try
        {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `INSERT INTO tasks (project_id, created_by_user_id, title, description, status, priority, deadline, estimated_hours)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [newTask.projectId, newTask.createdByUserId, newTask.title, newTask.description,
                 newTask.status, newTask.priority, newTask.deadline, newTask.estimatedHours]
            );
            if (result.insertId === 0) return new Task();
            return new Task(
                result.insertId, newTask.projectId, newTask.createdByUserId, newTask.title,
                newTask.description, newTask.status, newTask.priority,
                new Date(newTask.deadline), newTask.estimatedHours
            );
        }
        catch (err)
        {
            this.logger.error("TaskCommandRepository", "create failed", toLogError(err instanceof Error ? err : String(err)));
            return new Task();
        }
        finally
        {
            res.conn.release();
        }
    }

    async update(taskId: number, inputTask: Task): Promise<boolean>
    {
        const res = await this.db.getWriteConnection();
        if (!res) return false;
        try
        {
            const fields: string[] = [];
            const values: (string | number | Date)[] = [];

            if (inputTask.title !== "")            { fields.push("title = ?");           values.push(inputTask.title); }
            if (inputTask.description !== "")      { fields.push("description = ?");     values.push(inputTask.description); }
            if (inputTask.priority !== undefined)  { fields.push("priority = ?");        values.push(inputTask.priority); }
            if (inputTask.deadline !== undefined)  { fields.push("deadline = ?");        values.push(new Date(inputTask.deadline)); }
            if (inputTask.estimatedHours !== 0)    { fields.push("estimated_hours = ?"); values.push(inputTask.estimatedHours); }

            if (fields.length === 0) return false;
            values.push(taskId);

            const [result] = await res.conn.execute<ResultSetHeader>(
                `UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`, values
            );
            return result.affectedRows > 0;
        }
        catch (err)
        {
            this.logger.error("TaskCommandRepository", "update failed", toLogError(err instanceof Error ? err : String(err)));
            return false;
        }
        finally
        {
            res.conn.release();
        }
    }

    async updateStatus(taskId: number, status: TaskStatus): Promise<boolean>
    {
        const res = await this.db.getWriteConnection();
        if (!res) return false;
        try
        {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `UPDATE tasks SET status = ? WHERE id = ?`, [status, taskId]
            );
            return result.affectedRows > 0;
        }
        catch (err)
        {
            this.logger.error("TaskCommandRepository", "updateStatus failed", toLogError(err instanceof Error ? err : String(err)));
            return false;
        }
        finally
        {
            res.conn.release();
        }
    }

    async delete(taskId: number): Promise<boolean>
    {
        const res = await this.db.getWriteConnection();
        if (!res) return false;
        try
        {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `DELETE FROM tasks WHERE id = ?`, [taskId]
            );
            return result.affectedRows > 0;
        }
        catch (err)
        {
            this.logger.error("TaskCommandRepository", "delete failed", toLogError(err instanceof Error ? err : String(err)));
            return false;
        }
        finally
        {
            res.conn.release();
        }
    }
}
