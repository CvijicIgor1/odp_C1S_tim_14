import { Task } from "../../models/Task";
import { TaskAssignee } from "../../models/TaskAssignee";
import { Comment } from "../../models/Comment";
import { CreateTaskDto } from "../../DTOs/tasks/CreateTaskDto";
import { UpdateTaskDto } from "../../DTOs/tasks/UpdateTaskDto";
import { UpdateTaskStatusDto } from "../../DTOs/tasks/UpdateTaskStatusDto";
import { AddTaskAssigneeDto } from "../../DTOs/tasks/AddTaskAssigneeDto";
import { AddCommentDto } from "../../DTOs/tasks/AddCommentDto";

export interface ITaskRepository {
  findByProjectId(projectId: number): Promise<{ todo: Task[]; in_progress: Task[]; done: Task[] }>;

  create(dto: CreateTaskDto, createdByUserId: number): Promise<Task>;

  findById(id: number): Promise<Task>;

  update(taskId: number, dto: UpdateTaskDto): Promise<boolean>;

  updateStatus(taskId: number, dto: UpdateTaskStatusDto): Promise<boolean>;

  delete(taskId: number): Promise<boolean>;

  addAssignee(taskId: number, assignedBy: number, dto: AddTaskAssigneeDto): Promise<boolean>;

  removeAssignee(taskId: number, userId: number): Promise<boolean>;

  addComment(taskId: number, userId: number, dto: AddCommentDto): Promise<Comment>;

  deleteComment(commentId: number): Promise<boolean>;
}