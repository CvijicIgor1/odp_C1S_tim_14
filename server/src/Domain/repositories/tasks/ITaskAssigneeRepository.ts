export interface ITaskAssigneeRepository {
    addAssignee(taskId: number, userId: number, assignedBy: number): Promise<boolean>;
    removeAssignee(taskId: number, userId: number): Promise<boolean>;
    isAssignee(taskId: number, userId: number): Promise<boolean>;
}
