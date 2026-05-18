import "dotenv/config";
import express from "express";
import cors from "cors";

import { ConsoleLoggerService } from "./Services/logger/ConsoleLoggerService";
import { DbManager } from "./Database/connection/DbConnectionPool";

import { UserQueryRepository }   from "./Database/repositories/users/UserQueryRepository";
import { UserCommandRepository } from "./Database/repositories/users/UserCommandRepository";
import { UserAdminRepository }   from "./Database/repositories/users/UserAdminRepository";

import { AuditRepository } from "./Database/repositories/audit/AuditRepository";

import { TeamQueryRepository }   from "./Database/repositories/teams/TeamQueryRepository";
import { TeamCommandRepository } from "./Database/repositories/teams/TeamCommandRepository";
import { TeamMemberRepository }  from "./Database/repositories/teams/TeamMemberRepository";

import { ProjectQueryRepository }   from "./Database/repositories/projects/ProjectQueryRepository";
import { ProjectCommandRepository } from "./Database/repositories/projects/ProjectCommandRepository";
import { ProjectTagRepository }     from "./Database/repositories/projects/ProjectTagRepository";
import { ProjectWatcherRepository } from "./Database/repositories/projects/ProjectWatcherRepository";
import { ProjectAccessRepository }  from "./Database/repositories/projects/ProjectAccessRepository";

import { TagRepository } from "./Database/repositories/tags/TagRepository";

import { TaskQueryRepository }   from "./Database/repositories/tasks/TaskQueryRepository";
import { TaskCommandRepository } from "./Database/repositories/tasks/TaskCommandRepository";
import { TaskAssigneeRepository } from "./Database/repositories/tasks/TaskAssigneeRepository";
import { TaskCommentRepository }  from "./Database/repositories/tasks/TaskCommentRepository";
import { TaskAccessRepository }   from "./Database/repositories/tasks/TaskAccessRepository";

import { AuthService }    from "./Services/auth/AuthService";
import { TokenService }   from "./Services/auth/TokenService";
import { UserService }    from "./Services/users/UserService";
import { AuditService }   from "./Services/audit/AuditService";
import { TeamService }    from "./Services/teams/TeamService";
import { ProjectService } from "./Services/projects/ProjectService";
import { TagService }     from "./Services/tags/TagService";
import { TaskService }    from "./Services/tasks/TaskService";

import { AuthController }    from "./WebAPI/controllers/AuthController";
import { UserController }    from "./WebAPI/controllers/UserController";
import { TeamController }    from "./WebAPI/controllers/TeamController";
import { HealthController }  from "./WebAPI/controllers/HealthController";
import { ProjectController } from "./WebAPI/controllers/ProjectController";
import { TagController }     from "./WebAPI/controllers/TagController";
import { AuditController }   from "./WebAPI/controllers/AuditController";
import { TaskController }    from "./WebAPI/controllers/TaskController";

export const logger = new ConsoleLoggerService();
export const db     = new DbManager(logger);

// Users
const userQueryRepo   = new UserQueryRepository(db, logger);
const userCommandRepo = new UserCommandRepository(db, logger);
const userAdminRepo   = new UserAdminRepository(db, logger);

// Audit
const auditRepo = new AuditRepository(db, logger);

// Teams
const teamQueryRepo   = new TeamQueryRepository(db, logger);
const teamCommandRepo = new TeamCommandRepository(db, logger);
const teamMemberRepo  = new TeamMemberRepository(db, logger);

// Projects
const projectQueryRepo   = new ProjectQueryRepository(db, logger);
const projectCommandRepo = new ProjectCommandRepository(db, logger);
const projectTagRepo     = new ProjectTagRepository(db, logger);
const projectWatcherRepo = new ProjectWatcherRepository(db, logger);
const projectAccessRepo  = new ProjectAccessRepository(db, logger);

// Tags
const tagRepo = new TagRepository(db, logger);

// Tasks
const taskQueryRepo   = new TaskQueryRepository(db, logger);
const taskCommandRepo = new TaskCommandRepository(db, logger);
const taskAssigneeRepo = new TaskAssigneeRepository(db, logger);
const taskCommentRepo  = new TaskCommentRepository(db, logger);
const taskAccessRepo   = new TaskAccessRepository(db, logger, teamQueryRepo);

// Services
const auditService   = new AuditService(auditRepo);
const authService    = new AuthService(userQueryRepo, userCommandRepo);
const tokenService   = new TokenService();
const userService    = new UserService(userQueryRepo, userCommandRepo, userAdminRepo);
const teamService    = new TeamService(teamQueryRepo, teamCommandRepo, teamMemberRepo, auditService, userQueryRepo);
const projectService = new ProjectService(projectQueryRepo, projectCommandRepo, projectTagRepo, projectWatcherRepo, projectAccessRepo);
const tagService     = new TagService(tagRepo, auditService);
const taskService    = new TaskService(taskQueryRepo, taskCommandRepo, taskAssigneeRepo, taskCommentRepo, taskAccessRepo);

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL ?? "*" }));
app.use(express.json({ limit: "10mb" }));

app.use("/api/v1", new AuthController(authService, tokenService, auditService).getRouter());
app.use("/api/v1", new UserController(userService, auditService).getRouter());
app.use("/api/v1", new TeamController(teamService, auditService).getRouter());
app.use("/api/v1", new ProjectController(projectService, projectService, projectService, auditService).getRouter());
app.use("/api/v1", new TagController(tagService, auditService).getRouter());
app.use("/api/v1", new HealthController(db, auditService).getRouter());
app.use("/api/v1", new AuditController(auditService).getRouter());
app.use("/api/v1", new TaskController(taskService, taskService, taskService, auditService).getRouter());

export default app;
