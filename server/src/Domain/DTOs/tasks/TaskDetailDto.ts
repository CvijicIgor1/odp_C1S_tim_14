import { TaskDto } from "./TaskDto";
import { CommentDto } from "./CommentDto";
import { TaskAssigneeDto } from "./TaskAssigneeDto";

export class TaskDetailDto {
    constructor(
        public task: TaskDto = new TaskDto(),
        public comments: CommentDto[] = [],
        public assignees: TaskAssigneeDto[] = []
    ) { }
}