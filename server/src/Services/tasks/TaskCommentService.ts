import { ITaskCommentService } from "../../Domain/services/tasks/ITaskCommentService";
import { ITaskQueryRepository } from "../../Domain/repositories/tasks/ITaskQueryRepository";
import { ITaskAssigneeRepository } from "../../Domain/repositories/tasks/ITaskAssigneeRepository";
import { ITaskCommentRepository } from "../../Domain/repositories/tasks/ITaskCommentRepository";
import { ITaskAccessRepository } from "../../Domain/repositories/tasks/ITaskAccessRepository";
import { CommentDto } from "../../Domain/DTOs/tasks/CommentDto";
import { AddCommentDto } from "../../Domain/DTOs/tasks/AddCommentDto";
import { Comment } from "../../Domain/models/Comment";
import { AddCommentResult } from "../../Domain/enums/AddCommentResult";

export class TaskCommentService implements ITaskCommentService {
    public constructor(
        private readonly taskQueryRepository: ITaskQueryRepository,
        private readonly taskAssigneeRepository: ITaskAssigneeRepository,
        private readonly taskCommentRepository: ITaskCommentRepository,
        private readonly taskAccessRepository: ITaskAccessRepository,
    ) {}

    private toCommentDto(comment: Comment): CommentDto {
        return new CommentDto(comment.id, comment.taskId, comment.userId, comment.content, comment.createdAt);
    }

    async addComment(taskId: number, dto: AddCommentDto, userId: number): Promise<{ result: AddCommentResult; comment?: CommentDto }> {
        const task = await this.taskQueryRepository.findById(taskId);
        if (task.id === 0) return { result: AddCommentResult.NotFound };

        const canComment = await this.taskAssigneeRepository.isAssignee(taskId, userId)
            || await this.taskAccessRepository.isTeamOwnerOfTask(taskId, userId);

        if (!canComment) return { result: AddCommentResult.Forbidden };

        const comment = await this.taskCommentRepository.addComment(taskId, userId, dto.content);
        if (comment.id === 0) return { result: AddCommentResult.NotFound };

        return { result: AddCommentResult.Success, comment: this.toCommentDto(comment) };
    }

    async deleteComment(commentId: number, userId: number): Promise<boolean> {
        const comment = await this.taskCommentRepository.findCommentById(commentId);
        if (comment.id === 0) return false;

        if (comment.userId !== userId) return false;

        return this.taskCommentRepository.deleteComment(commentId);
    }
}
