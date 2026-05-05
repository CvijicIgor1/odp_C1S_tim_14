import type { PaginatedList } from "../team/TeamTypes";

export type { PaginatedList };

export type ProjectStatus = "planning" | "active" | "on_hold" | "completed";
export type Priority      = "low" | "medium" | "high" | "critical";
export type TaskStatus    = "todo" | "in_progress" | "done";

export type TagDto = {
  id: number;
  name: string;
};

export type ProjectDto = {
  id: number;
  teamId: number;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: Priority;
  deadline: string | null;
  tags: TagDto[];
  watcherCount: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type TaskDto = {
  id: number;
  projectId: number;
  createdByUserId: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  deadline: string;
  estimatedHours: number;
  createdAt: string;
  updatedAt: string;
};

export type TaskAssigneeDto = {
  taskId: number;
  userId: number;
  assignedBy: number;
  assignedAt: string;
};

export type CommentDto = {
  id: number;
  taskId: number;
  userId: number;
  content: string;
  createdAt: string;
};

export type TaskDetailDto = {
  task: TaskDto;
  comments: CommentDto[];
  assignees: TaskAssigneeDto[];
};

export type GroupedTasksDto = {
  todo: TaskDto[];
  in_progress: TaskDto[];
  done: TaskDto[];
};
