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
import { TeamReadService }    from "./Services/teams/TeamReadService";
import { TeamWriteService }   from "./Services/teams/TeamWriteService";
import { TeamMemberService }  from "./Services/teams/TeamMemberService";
import { ProjectReadService }    from "./Services/projects/ProjectReadService";
import { ProjectWriteService }   from "./Services/projects/ProjectWriteService";
import { ProjectTagWatchService } from "./Services/projects/ProjectTagWatchService";
import { TagService }     from "./Services/tags/TagService";
import { TaskReadService }    from "./Services/tasks/TaskReadService";
import { TaskWriteService }   from "./Services/tasks/TaskWriteService";
import { TaskCommentService } from "./Services/tasks/TaskCommentService";

import { AuthController }    from "./WebAPI/controllers/AuthController";
import { UserController }    from "./WebAPI/controllers/UserController";
import { TeamController }    from "./WebAPI/controllers/TeamController";
import { HealthController }  from "./WebAPI/controllers/HealthController";
import { ProjectController } from "./WebAPI/controllers/ProjectController";
import { TagController }     from "./WebAPI/controllers/TagController";
import { AuditController }   from "./WebAPI/controllers/AuditController";
import { TaskController }    from "./WebAPI/controllers/TaskController";
import { apiNotFoundHandler } from "./Middlewares/errors/NotFoundMiddleware";
import { createErrorHandler } from "./Middlewares/errors/ErrorMiddleware";

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
const teamReadService    = new TeamReadService(teamQueryRepo, userQueryRepo);
const teamWriteService   = new TeamWriteService(teamCommandRepo, teamQueryRepo, auditService);
const teamMemberService  = new TeamMemberService(teamCommandRepo, teamMemberRepo, teamQueryRepo, auditService);
const projectReadService    = new ProjectReadService(projectQueryRepo, projectTagRepo, projectWatcherRepo, projectAccessRepo, teamQueryRepo);
const projectWriteService   = new ProjectWriteService(projectQueryRepo, projectCommandRepo, projectTagRepo, projectWatcherRepo, projectAccessRepo, teamQueryRepo);
const projectTagWatchService = new ProjectTagWatchService(projectTagRepo, projectWatcherRepo, projectAccessRepo);
const tagService     = new TagService(tagRepo, auditService);
const taskReadService    = new TaskReadService(taskQueryRepo, taskCommentRepo, taskAccessRepo);
const taskWriteService   = new TaskWriteService(taskQueryRepo, taskCommandRepo, taskAssigneeRepo, taskAccessRepo);
const taskCommentService = new TaskCommentService(taskQueryRepo, taskAssigneeRepo, taskCommentRepo, taskAccessRepo);

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL ?? "*" }));
app.use(express.json({ limit: "10mb" }));

const routers = [
  new AuthController(authService, tokenService, auditService).getRouter(),
  new UserController(userService, auditService).getRouter(),
  new TeamController(teamReadService, teamWriteService, teamMemberService, auditService).getRouter(),
  new ProjectController(projectReadService, projectWriteService, projectTagWatchService, auditService).getRouter(),
  new TagController(tagService, auditService).getRouter(),
  new HealthController(db, auditService).getRouter(),
  new AuditController(auditService).getRouter(),
  new TaskController(taskReadService, taskWriteService, taskCommentService, auditService).getRouter(),
];

for (const router of routers) {
  app.use("/api", router);
  app.use("/api/v1", router);
}

app.use("/api", apiNotFoundHandler);
app.use("/api/v1", apiNotFoundHandler);
app.use(createErrorHandler(logger));

export default app;
