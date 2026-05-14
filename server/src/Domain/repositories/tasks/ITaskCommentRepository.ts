import { Comment } from "../../models/Comment";

export interface ITaskCommentRepository {
    getComments(taskId: number): Promise<Comment[]>;
    findCommentById(commentId: number): Promise<Comment>;
    addComment(taskId: number, userId: number, content: string): Promise<Comment>;
    deleteComment(commentId: number): Promise<boolean>;
}
