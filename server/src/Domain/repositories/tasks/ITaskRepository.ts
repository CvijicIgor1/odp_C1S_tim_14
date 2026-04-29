import { Task } from "../../models/Task";
import { TaskStatus } from "../../enums/TaskStatus";
import { TaskAssignee } from "../../models/TaskAssignee";
import { Comment } from "../../models/Comment";

export interface ITaskRepository {
  findByProjectId(projectId: number): Promise<{ todo: Task[]; in_progress: Task[]; done: Task[] }>;

  create(task: Task): Promise<Task>;

  findById(id: number): Promise<Task>;

  update(task: Task): Promise<boolean>;

  updateStatus(id: number, status: TaskStatus): Promise<boolean>;

  delete(id: number): Promise<boolean>;

  addAssignee(taskId: number, userId: number, assignedBy: number): Promise<boolean>;

  removeAssignee(taskId: number, userId: number): Promise<boolean>;

  findAssignees(taskId: number): Promise<TaskAssignee[]>;

  addComment(comment: Comment): Promise<Comment>;

  deleteComment(commentId: number): Promise<boolean>;
}