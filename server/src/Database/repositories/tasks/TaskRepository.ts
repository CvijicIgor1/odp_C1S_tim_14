import { RowDataPacket, ResultSetHeader } from "mysql2";
import { ITaskRepository } from "../../../Domain/repositories/tasks/ITaskRepository";
import { ITeamRepository } from "../../../Domain/repositories/teams/ITeamRepository";
import { Task } from "../../../Domain/models/Task";
import { TaskAssignee } from "../../../Domain/models/TaskAssignee";
import { Comment } from "../../../Domain/models/Comment";
import { TaskStatus } from "../../../Domain/enums/TaskStatus";
import { Priority } from "../../../Domain/enums/Priority";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";

export class TaskRepository implements ITaskRepository
{
    public constructor(
        private readonly db: DbManager,
        private readonly logger: ILoggerService,
        private readonly teamRepo: ITeamRepository,
    ) {}


    private mapTask(r: RowDataPacket): Task
    {
        return new Task(
            r.id,
            r.project_id,
            r.created_by_user_id,
            r.title,
            r.description,
            r.status as TaskStatus,
            r.priority as Priority,
            r.deadline ? new Date(r.deadline) : new Date(),
            parseFloat(r.estimated_hours),
            r.created_at ? new Date(r.created_at) : new Date(),
            r.updated_at ? new Date(r.updated_at) : new Date(),
        );
    }

    private mapAssignee(r: RowDataPacket): TaskAssignee
    {
        return new TaskAssignee(
            r.task_id,
            r.user_id,
            r.assigned_by,
            r.assigned_at ? new Date(r.assigned_at) : new Date(),
        );
    }

    private mapComment(r: RowDataPacket): Comment
    {
        return new Comment(
            r.id,
            r.task_id,
            r.user_id,
            r.content,
            r.created_at ? new Date(r.created_at) : new Date(),
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
                `SELECT * FROM tasks
                 WHERE project_id = ?
                 ORDER BY priority DESC, deadline ASC`,
                [projectId],
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
            this.logger.error("TaskRepository", "findByProjectId failed", err);
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
                `SELECT * FROM tasks WHERE id = ?`,
                [id],
            );
            return rows.length > 0 ? this.mapTask(rows[0]) : new Task();
        }
        catch (err)
        {
            this.logger.error("TaskRepository", "findById failed", err);
            return new Task();
        }
        finally
        {
            res.conn.release();
        }
    }

    async create(
        projectId: number,
        createdByUserId: number,
        title: string,
        description: string,
        status: TaskStatus,
        priority: Priority,
        deadline: Date,
        estimatedHours: number,
    ): Promise<Task>
    {
        const res = await this.db.getWriteConnection();
        if (!res) return new Task();
        try
        {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `INSERT INTO tasks
                 (project_id, created_by_user_id, title, description, status, priority, deadline, estimated_hours)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [projectId, createdByUserId, title, description, status, priority, deadline, estimatedHours],
            );
            if (result.insertId === 0) return new Task();
            return new Task(
                result.insertId,
                projectId,
                createdByUserId,
                title,
                description,
                status,
                priority,
                new Date(deadline),
                estimatedHours,
            );
        }
        catch (err)
        {
            this.logger.error("TaskRepository", "create failed", err);
            return new Task();
        }
        finally
        {
            res.conn.release();
        }
    }

    async update(
        taskId: number,
        title?: string,
        description?: string,
        priority?: Priority,
        deadline?: Date,
        estimatedHours?: number,
    ): Promise<boolean>
    {
        const res = await this.db.getWriteConnection();
        if (!res) return false;
        try
        {
            const fields: string[] = [];
            const values: (string | number | Date)[] = [];

            if (title !== undefined)         { fields.push("title = ?");           values.push(title); }
            if (description !== undefined)   { fields.push("description = ?");     values.push(description); }
            if (priority !== undefined)      { fields.push("priority = ?");        values.push(priority); }
            if (deadline !== undefined)      { fields.push("deadline = ?");        values.push(new Date(deadline)); }
            if (estimatedHours !== undefined){ fields.push("estimated_hours = ?"); values.push(estimatedHours); }

            if (fields.length === 0) return false;

            values.push(taskId);
            const [result] = await res.conn.execute<ResultSetHeader>(
                `UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`,
                values,
            );
            return result.affectedRows > 0;
        }
        catch (err)
        {
            this.logger.error("TaskRepository", "update failed", err);
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
                `UPDATE tasks SET status = ? WHERE id = ?`,
                [status, taskId],
            );
            return result.affectedRows > 0;
        }
        catch (err)
        {
            this.logger.error("TaskRepository", "updateStatus failed", err);
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
                `DELETE FROM tasks WHERE id = ?`,
                [taskId],
            );
            return result.affectedRows > 0;
        }
        catch (err)
        {
            this.logger.error("TaskRepository", "delete failed", err);
            return false;
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
                `SELECT * FROM task_assignees WHERE task_id = ?`,
                [taskId],
            );
            return rows.map((r) => this.mapAssignee(r));
        }
        catch (err)
        {
            this.logger.error("TaskRepository", "getAssignees failed", err);
            return [];
        }
        finally
        {
            res.conn.release();
        }
    }

    async addAssignee(taskId: number, userId: number, assignedBy: number): Promise<boolean>
    {
        const res = await this.db.getWriteConnection();
        if (!res) return false;
        try
        {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `INSERT INTO task_assignees (task_id, user_id, assigned_by)
                 VALUES (?, ?, ?)`,
                [taskId, userId, assignedBy],
            );
            return result.affectedRows > 0;
        }
        catch (err)
        {
            this.logger.error("TaskRepository", "addAssignee failed", err);
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
                `DELETE FROM task_assignees WHERE task_id = ? AND user_id = ?`,
                [taskId, userId],
            );
            return result.affectedRows > 0;
        }
        catch (err)
        {
            this.logger.error("TaskRepository", "removeAssignee failed", err);
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
                `SELECT 1 FROM task_assignees WHERE task_id = ? AND user_id = ? LIMIT 1`,
                [taskId, userId],
            );
            return rows.length > 0;
        }
        catch (err)
        {
            this.logger.error("TaskRepository", "isAssignee failed", err);
            return false;
        }
        finally
        {
            res.conn.release();
        }
    }


    async getComments(taskId: number): Promise<Comment[]>
    {
        const res = await this.db.getReadConnection();
        if (!res) return [];
        try
        {
            const [rows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT * FROM comments
                 WHERE task_id = ?
                 ORDER BY created_at ASC`,
                [taskId],
            );
            return rows.map((r) => this.mapComment(r));
        }
        catch (err)
        {
            this.logger.error("TaskRepository", "getComments failed", err);
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
                `SELECT * FROM comments WHERE id = ?`,
                [commentId],
            );
            return rows.length > 0 ? this.mapComment(rows[0]) : new Comment();
        }
        catch (err)
        {
            this.logger.error("TaskRepository", "findCommentById failed", err);
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
                `INSERT INTO comments (task_id, user_id, content)
                 VALUES (?, ?, ?)`,
                [taskId, userId, content],
            );
            if (result.insertId === 0) return new Comment();
            return new Comment(
                result.insertId,
                taskId,
                userId,
                content,
            );
        }
        catch (err)
        {
            this.logger.error("TaskRepository", "addComment failed", err);
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
                `DELETE FROM comments WHERE id = ?`,
                [commentId],
            );
            return result.affectedRows > 0;
        }
        catch (err)
        {
            this.logger.error("TaskRepository", "deleteComment failed", err);
            return false;
        }
        finally
        {
            res.conn.release();
        }
    }
    async isUserInProjectTeam(projectId: number, userId: number): Promise<boolean>
    {
        const res = await this.db.getReadConnection();
        if (!res) return false;
        try
        {
            const [pRows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT team_id FROM projects WHERE id = ?`,
                [projectId],
            );
            if (pRows.length === 0) return false;
            const teamId = pRows[0].team_id;

            const { members } = await this.teamRepo.getMembers(teamId);
            return members.some((m) => m.userId === userId);
        }
        catch (err)
        {
            this.logger.error("TaskRepository", "isUserInProjectTeam failed", err);
            return false;
        }
        finally
        {
            res.conn.release();
        }
    }

    async isTeamOwnerOfTask(taskId: number, userId: number): Promise<boolean>
    {
        const res = await this.db.getReadConnection();
        if (!res) return false;
        try
        {
            const [taskRows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT project_id FROM tasks WHERE id = ?`,
                [taskId],
            );
            if (taskRows.length === 0) return false;
            const projectId = taskRows[0].project_id;

            const [pRows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT team_id FROM projects WHERE id = ?`,
                [projectId],
            );
            if (pRows.length === 0) return false;
            const teamId = pRows[0].team_id;

            const { members } = await this.teamRepo.getMembers(teamId);
            return members.some((m) => m.userId === userId && m.role === "owner");
        }
        catch (err)
        {
            this.logger.error("TaskRepository", "isTeamOwnerOfTask failed", err);
            return false;
        }
        finally
        {
            res.conn.release();
        }
    }
}