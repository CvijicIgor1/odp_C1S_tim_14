import { ITaskReadService } from "../../Domain/services/tasks/ITaskReadService";
import { ITaskQueryRepository } from "../../Domain/repositories/tasks/ITaskQueryRepository";
import { ITaskCommentRepository } from "../../Domain/repositories/tasks/ITaskCommentRepository";
import { ITaskAccessRepository } from "../../Domain/repositories/tasks/ITaskAccessRepository";
import { TaskDto } from "../../Domain/DTOs/tasks/TaskDto";
import { TaskDetailDto } from "../../Domain/DTOs/tasks/TaskDetailDto";
import { CommentDto } from "../../Domain/DTOs/tasks/CommentDto";
import { TaskAssigneeDto } from "../../Domain/DTOs/tasks/TaskAssigneeDto";
import { GroupedTasksDto } from "../../Domain/DTOs/tasks/GroupedTasksDto";
import { Task } from "../../Domain/models/Task";
import { Comment } from "../../Domain/models/Comment";
import { TaskAssignee } from "../../Domain/models/TaskAssignee";

export class TaskReadService implements ITaskReadService {
    public constructor(
        private readonly taskQueryRepository: ITaskQueryRepository,
        private readonly taskCommentRepository: ITaskCommentRepository,
        private readonly taskAccessRepository: ITaskAccessRepository,
    ) {}

    private toDto(task: Task): TaskDto {
        return new TaskDto(
            task.id,
            task.projectId,
            task.createdByUserId,
            task.title,
            task.description,
            task.status,
            task.priority,
            task.deadline,
            task.estimatedHours,
            task.createdAt,
            task.updatedAt
        );
    }

    private toCommentDto(comment: Comment): CommentDto {
        return new CommentDto(comment.id, comment.taskId, comment.userId, comment.content, comment.createdAt);
    }

    private toAssigneeDto(assignee: TaskAssignee): TaskAssigneeDto {
        return new TaskAssigneeDto(assignee.taskId, assignee.userId, assignee.assignedBy, assignee.assignedAt);
    }

    async getByProjectId(projectId: number, userId: number, isAdmin: boolean): Promise<GroupedTasksDto> {
        const empty = new GroupedTasksDto([], [], []);

        const isMember = await this.taskAccessRepository.isUserInProjectTeam(projectId, userId);
        if (!isAdmin && !isMember) return empty;

        const { todo, in_progress, done } = await this.taskQueryRepository.findByProjectId(projectId);

        return new GroupedTasksDto(
            todo.map((t) => this.toDto(t)),
            in_progress.map((t) => this.toDto(t)),
            done.map((t) => this.toDto(t))
        );
    }

    async getById(taskId: number, userId: number, isAdmin: boolean): Promise<TaskDetailDto> {
        const empty = new TaskDetailDto();

        const task = await this.taskQueryRepository.findById(taskId);
        if (task.id === 0) return empty;

        const isMember = await this.taskAccessRepository.isUserInProjectTeam(task.projectId, userId);
        if (!isAdmin && !isMember) return empty;

        const comments = await this.taskCommentRepository.getComments(taskId);
        const assignees = await this.taskQueryRepository.getAssignees(taskId);

        return new TaskDetailDto(
            this.toDto(task),
            comments.map((c) => this.toCommentDto(c)),
            assignees.map((a) => this.toAssigneeDto(a))
        );
    }

    async getMyTasks(userId: number): Promise<TaskDto[]> {
        const tasks = await this.taskQueryRepository.findByAssignee(userId);
        return tasks.map((t) => this.toDto(t));
    }
}
