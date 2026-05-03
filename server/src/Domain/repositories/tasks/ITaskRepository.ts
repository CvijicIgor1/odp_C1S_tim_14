import { Task } from "../../models/Task";
import { TaskAssignee } from "../../models/TaskAssignee";
import { Comment } from "../../models/Comment";
import { TaskStatus } from "../../enums/TaskStatus";
import { Priority } from "../../enums/Priority";

export interface ITaskRepository {

    findByProjectId(projectId: number): Promise<{ todo: Task[]; in_progress: Task[]; done: Task[] }>;

    findById(id: number): Promise<Task>;

    create(
        projectId: number,
        createdByUserId: number,
        title: string,
        description: string,
        status: TaskStatus,
        priority: Priority,
        deadline: Date,
        estimatedHours: number,
    ): Promise<Task>;

    update(
        taskId: number,
        title?: string,
        description?: string,
        priority?: Priority,
        deadline?: Date,
        estimatedHours?: number,
    ): Promise<boolean>;

    updateStatus(taskId: number, status: TaskStatus): Promise<boolean>;

    delete(taskId: number): Promise<boolean>;

    getAssignees(taskId: number): Promise<TaskAssignee[]>;

    addAssignee(taskId: number, userId: number, assignedBy: number): Promise<boolean>;

    removeAssignee(taskId: number, userId: number): Promise<boolean>;

    isAssignee(taskId: number, userId: number): Promise<boolean>;

    getComments(taskId: number): Promise<Comment[]>;

    findCommentById(commentId: number): Promise<Comment>;

    addComment(taskId: number, userId: number, content: string): Promise<Comment>;

    deleteComment(commentId: number): Promise<boolean>;

    //Helpers

    isUserInProjectTeam(projectId: number, userId: number): Promise<boolean>;

    isTeamOwnerOfTask(taskId: number, userId: number): Promise<boolean>;
}