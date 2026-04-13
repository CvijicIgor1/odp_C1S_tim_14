import { TaskStatus } from "../enums/TaskStatus";
import { Priority } from "../enums/Priority";


export class Task {
  public constructor(
    public id: number = 0,
    public projectId: number = 0,
    public createdByUserId: number = 0,
    public title: string = "",
    public description: string = "",
    public status: TaskStatus = TaskStatus.TODO,
    public priority: Priority = Priority.MEDIUM,
    public deadline: Date = new Date(),
    public estimatedHours: number = 0.0,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}
}