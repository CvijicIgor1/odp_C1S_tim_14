import { RowDataPacket, ResultSetHeader } from "mysql2";
import { ITaskRepository } from "../../../Domain/repositories/tasks/ITaskRepository";
import { Task } from "../../../Domain/models/Task";
import { TaskAssignee } from "../../../Domain/models/TaskAssignee";
import { Comment } from "../../../Domain/models/Comment";
import { TaskStatus } from "../../../Domain/enums/TaskStatus";
import { Priority } from "../../../Domain/enums/Priority";
import { CreateTaskDto } from "../../../Domain/DTOs/tasks/CreateTaskDto";
import { UpdateTaskDto } from "../../../Domain/DTOs/tasks/UpdateTaskDto";
import { UpdateTaskStatusDto } from "../../../Domain/DTOs/tasks/UpdateTaskStatusDto";
import { AddTaskAssigneeDto } from "../../../Domain/DTOs/tasks/AddTaskAssigneeDto";
import { AddCommentDto } from "../../../Domain/DTOs/tasks/AddCommentDto";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";

export class TaskRepository implements ITaskRepository {
  public constructor(
    private readonly db: DbManager,
    private readonly logger: ILoggerService,
  ) {}

  private mapTask(r: RowDataPacket): Task {
    return new Task(
      r.id,
      r.project_id,
      r.created_by_user_id,
      r.title,
      r.description,
      r.status as TaskStatus,
      r.priority as Priority,
      new Date(r.deadline),
      parseFloat(r.estimated_hours),
      new Date(r.created_at),
      new Date(r.updated_at),
    );
  }


  async findByProjectId(
    projectId: number,
  ): Promise<{ todo: Task[]; in_progress: Task[]; done: Task[] }> {
    const res = await this.db.getReadConnection();
    const empty = { todo: [], in_progress: [], done: [] };
    if (!res) return empty;
    try {
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
    } catch (err) {
      this.logger.error("TaskRepository", "findByProjectId failed", err);
      return empty;
    } finally {
      res.conn.release();
    }
  }

  async create(dto: CreateTaskDto, createdByUserId: number): Promise<Task> {
    const res = await this.db.getWriteConnection();
    if (!res) return new Task();
    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `INSERT INTO tasks
         (project_id, created_by_user_id, title, description, status, priority, deadline, estimated_hours)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          dto.projectId,
          createdByUserId,
          dto.title,
          dto.description,
          dto.status,
          dto.priority,
          dto.deadline,
          dto.estimatedHours,
        ],
      );
      if (result.insertId === 0) return new Task();
      return new Task(
        result.insertId,
        dto.projectId,
        createdByUserId,
        dto.title,
        dto.description,
        dto.status,
        dto.priority,
        dto.deadline,
        dto.estimatedHours,
      );
    } catch (err) {
      this.logger.error("TaskRepository", "create failed", err);
      return new Task();
    } finally {
      res.conn.release();
    }
  }

  async findById(id: number): Promise<Task> {
    const res = await this.db.getReadConnection();
    if (!res) return new Task();
    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT * FROM tasks WHERE id = ?`,
        [id],
      );
      return rows.length > 0 ? this.mapTask(rows[0]) : new Task();
    } catch (err) {
      this.logger.error("TaskRepository", "findById failed", err);
      return new Task();
    } finally {
      res.conn.release();
    }
  }

  async update(taskId: number, dto: UpdateTaskDto): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;
    try {
      const fields: string[] = [];
      const values: any[] = [];

      if (dto.title !== undefined) {
        fields.push("title = ?");
        values.push(dto.title);
      }
      if (dto.description !== undefined) {
        fields.push("description = ?");
        values.push(dto.description);
      }
      if (dto.priority !== undefined) {
        fields.push("priority = ?");
        values.push(dto.priority);
      }
      if (dto.deadline !== undefined) {
        fields.push("deadline = ?");
        values.push(dto.deadline);
      }
      if (dto.estimatedHours !== undefined) {
        fields.push("estimated_hours = ?");
        values.push(dto.estimatedHours);
      }

      if (fields.length === 0) return false;

      values.push(taskId);

      const [result] = await res.conn.execute<ResultSetHeader>(
        `UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`,
        values,
      );

      return result.affectedRows > 0;
    } catch (err) {
      this.logger.error("TaskRepository", "update failed", err);
      return false;
    } finally {
      res.conn.release();
    }
  }

  async updateStatus(taskId: number, dto: UpdateTaskStatusDto): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;
    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `UPDATE tasks SET status = ? WHERE id = ?`,
        [dto.status, taskId],
      );
      return result.affectedRows > 0;
    } catch (err) {
      this.logger.error("TaskRepository", "updateStatus failed", err);
      return false;
    } finally {
      res.conn.release();
    }
  }

  async delete(taskId: number): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;
    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `DELETE FROM tasks WHERE id = ?`,
        [taskId],
      );
      return result.affectedRows > 0;
    } catch (err) {
      this.logger.error("TaskRepository", "delete failed", err);
      return false;
    } finally {
      res.conn.release();
    }
  }

  async addAssignee(taskId: number,assignedBy: number,dto: AddTaskAssigneeDto ): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;
    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `INSERT INTO task_assignees (task_id, user_id, assigned_by)
         VALUES (?, ?, ?)`,
        [taskId, dto.userId, assignedBy],
      );
      return result.affectedRows > 0;
    } catch (err) {
      this.logger.error("TaskRepository", "addAssignee failed", err);
      return false;
    } finally {
      res.conn.release();
    }
  }

  async removeAssignee(taskId: number, userId: number): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;
    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `DELETE FROM task_assignees WHERE task_id = ? AND user_id = ?`,
        [taskId, userId],
      );
      return result.affectedRows > 0;
    } catch (err) {
      this.logger.error("TaskRepository", "removeAssignee failed", err);
      return false;
    } finally {
      res.conn.release();
    }
  }

  async addComment(taskId: number,userId: number,dto: AddCommentDto ): Promise<Comment> {
    const res = await this.db.getWriteConnection();
    if (!res) return new Comment();
    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `INSERT INTO comments (task_id, user_id, content)
         VALUES (?, ?, ?)`,
        [taskId, userId, dto.content],
      );
      if (result.insertId === 0) return new Comment();
      return new Comment(
        result.insertId,
        taskId,
        userId,
        dto.content,
      );
    } catch (err) {
      this.logger.error("TaskRepository", "addComment failed", err);
      return new Comment();
    } finally {
      res.conn.release();
    }
  }

  async deleteComment(commentId: number): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;
    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `DELETE FROM comments WHERE id = ?`,
        [commentId],
      );
      return result.affectedRows > 0;
    } catch (err) {
      this.logger.error("TaskRepository", "deleteComment failed", err);
      return false;
    } finally {
      res.conn.release();
    }
  }
}