import { TaskDto } from "./TaskDto";

export class GroupedTasksDto {
    constructor(
        public todo: TaskDto[] = [],
        public in_progress: TaskDto[] = [],
        public done: TaskDto[] = []
    ) { }
}