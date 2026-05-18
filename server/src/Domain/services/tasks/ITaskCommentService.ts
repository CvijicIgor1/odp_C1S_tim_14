import { CommentDto } from "../../DTOs/tasks/CommentDto";
import { AddCommentDto } from "../../DTOs/tasks/AddCommentDto";
import { AddCommentResult } from "../../enums/AddCommentResult";

export interface ITaskCommentService
{
    addComment(taskId: number, dto: AddCommentDto, userId: number): Promise<{ result: AddCommentResult; comment?: CommentDto }>;
    deleteComment(commentId: number, userId: number): Promise<boolean>;
}
