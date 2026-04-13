// TODO: Replace with your domain-specific status enum
// mora da se reformise i fix nakon KT1 
export enum ProjectStatus {
  PLANNING   = "planning",
  ACTIVE     = "active",
  ON_HOLD    = "on_hold",
  COMPLETED  = "completed",
}

export enum TaskStatus {
  TODO        = "todo",
  IN_PROGRESS = "in_progress",
  DONE        = "done",
}

export enum Priority {
  LOW      = "low",
  MEDIUM   = "medium",
  HIGH     = "high",
  CRITICAL = "critical",
}

export enum TeamMemberRole {
  OWNER  = "owner",
  MEMBER = "member",
}