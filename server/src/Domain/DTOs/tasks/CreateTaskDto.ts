import { TaskStatus } from "../../enums/TaskStatus";
import { Priority } from "../../enums/Priority";

export class CreateTaskDto {
  public constructor(
    public title: string = "",
    public description: string = "",
    public priority: Priority = Priority.MEDIUM,
    public deadline: Date = new Date(),
    public estimatedHours: number = 0.0,
  ) {}
}