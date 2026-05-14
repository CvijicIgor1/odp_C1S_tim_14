import { Task } from "../../models/Task";
import { TaskAssignee } from "../../models/TaskAssignee";

export interface ITaskQueryRepository {
    findByProjectId(projectId: number): Promise<{ todo: Task[]; in_progress: Task[]; done: Task[] }>;
    findById(id: number): Promise<Task>;
    findByAssignee(userId: number): Promise<Task[]>;
    getAssignees(taskId: number): Promise<TaskAssignee[]>;
}
