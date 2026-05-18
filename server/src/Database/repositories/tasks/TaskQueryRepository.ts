import { RowDataPacket } from "mysql2";
import { toLogError } from "../../../utils/logging";
import { ITaskQueryRepository } from "../../../Domain/repositories/tasks/ITaskQueryRepository";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";
import { Task } from "../../../Domain/models/Task";
import { TaskAssignee } from "../../../Domain/models/TaskAssignee";
import { TaskStatus } from "../../../Domain/enums/TaskStatus";
import { Priority } from "../../../Domain/enums/Priority";

export class TaskQueryRepository implements ITaskQueryRepository
{
    public constructor(
        private readonly db: DbManager,
        private readonly logger: ILoggerService
    ) {}

    private mapTask(r: RowDataPacket): Task
    {
        return new Task(
            r.id, r.project_id, r.created_by_user_id, r.title, r.description,
            r.status as TaskStatus, r.priority as Priority,
            r.deadline ? new Date(r.deadline) : new Date(),
            parseFloat(r.estimated_hours),
            r.created_at ? new Date(r.created_at) : new Date(),
            r.updated_at ? new Date(r.updated_at) : new Date(),
        );
    }

    private mapAssignee(r: RowDataPacket): TaskAssignee
    {
        return new TaskAssignee(
            r.task_id, r.user_id, r.assigned_by,
            r.assigned_at ? new Date(r.assigned_at) : new Date()
        );
    }

    async findByProjectId(projectId: number): Promise<{ todo: Task[]; in_progress: Task[]; done: Task[] }>
    {
        const res = await this.db.getReadConnection();
        const empty = { todo: [], in_progress: [], done: [] };
        if (!res) return empty;
        try
        {
            const [rows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT * FROM tasks WHERE project_id = ? ORDER BY priority DESC, deadline ASC`, [projectId]
            );
            const tasks = rows.map((r) => this.mapTask(r));
            return {
                todo:        tasks.filter((t) => t.status === TaskStatus.TODO),
                in_progress: tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS),
                done:        tasks.filter((t) => t.status === TaskStatus.DONE),
            };
        }
        catch (err)
        {
            this.logger.error("TaskQueryRepository", "findByProjectId failed", toLogError(err instanceof Error ? err : String(err)));
            return empty;
        }
        finally
        {
            res.conn.release();
        }
    }

    async findById(id: number): Promise<Task>
    {
        const res = await this.db.getReadConnection();
        if (!res) return new Task();
        try
        {
            const [rows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT * FROM tasks WHERE id = ?`, [id]
            );
            return rows.length > 0 ? this.mapTask(rows[0]) : new Task();
        }
        catch (err)
        {
            this.logger.error("TaskQueryRepository", "findById failed", toLogError(err instanceof Error ? err : String(err)));
            return new Task();
        }
        finally
        {
            res.conn.release();
        }
    }

    async findByAssignee(userId: number): Promise<Task[]>
    {
        const res = await this.db.getReadConnection();
        if (!res) return [];
        try
        {
            const [rows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT t.* FROM tasks t
                 WHERE t.id IN (SELECT ta.task_id FROM task_assignees ta WHERE ta.user_id = ?)
                 ORDER BY t.priority DESC, t.deadline ASC`,
                [userId]
            );
            return rows.map((r) => this.mapTask(r));
        }
        catch (err)
        {
            this.logger.error("TaskQueryRepository", "findByAssignee failed", toLogError(err instanceof Error ? err : String(err)));
            return [];
        }
        finally
        {
            res.conn.release();
        }
    }

    async getAssignees(taskId: number): Promise<TaskAssignee[]>
    {
        const res = await this.db.getReadConnection();
        if (!res) return [];
        try
        {
            const [rows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT * FROM task_assignees WHERE task_id = ?`, [taskId]
            );
            return rows.map((r) => this.mapAssignee(r));
        }
        catch (err)
        {
            this.logger.error("TaskQueryRepository", "getAssignees failed", toLogError(err instanceof Error ? err : String(err)));
            return [];
        }
        finally
        {
            res.conn.release();
        }
    }
}
