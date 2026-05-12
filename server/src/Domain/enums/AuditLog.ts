export enum AuditAction {
  LOGIN    = "login",
  LOGOUT   = "logout",
  REGISTER = "register",
  CREATE   = "create",
  UPDATE   = "update",
  DELETE   = "delete",
  FAILOVER = "failover",

  TASK_CREATED="task created",
  TASK_STATUS_UPDATED="task status updated",
  TASK_UPDATED="task updated",
  TASK_DELETED="task deleted",
  TASK_ASSIGNEE_ADDED="task assignee added",
  TASK_ASSIGNEE_REMOVED="task assignee removed",
  COMMENT_DELETED="comment deleted",
  COMMENT_ADDED="comment added",
}
