import { TaskStatus } from "../../enums/TaskStatus";

export class UpdateTaskStatusDto {
  public constructor(
    public status: TaskStatus = TaskStatus.TODO,
  ) {}
}