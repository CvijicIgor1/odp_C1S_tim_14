import { Task } from "../../models/Task";
import { TaskStatus } from "../../enums/TaskStatus";

export interface ITaskCommandRepository {
    create(newTask: Task): Promise<Task>;
    update(taskId: number, inputTask: Task): Promise<boolean>;
    updateStatus(taskId: number, status: TaskStatus): Promise<boolean>;
    delete(taskId: number): Promise<boolean>;
}
