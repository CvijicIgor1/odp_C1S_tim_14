import "dotenv/config";
import express from "express";
import cors from "cors";

import { ConsoleLoggerService } from "./Services/logger/ConsoleLoggerService";
import { DbManager } from "./Database/connection/DbConnectionPool";

import { UserRepository }   from "./Database/repositories/users/UserRepository";
import { AuditRepository } from "./Database/repositories/audit/AuditRepository";
import { TeamRepository } from "./Database/repositories/teams/TeamRepository";
import { ProjectRepository } from "./Database/repositories/projects/ProjectRepository";

import { AuthService }   from "./Services/auth/AuthService";
import { UserService }   from "./Services/users/UserService";
import { TeamService } from "./Services/teams/TeamService";
import { ProjectService } from "./Services/projects/ProjectService";

import { AuthController }   from "./WebAPI/controllers/AuthController";
import { UserController }   from "./WebAPI/controllers/UserController";
import { TeamController } from "./WebAPI/controllers/TeamController";
import { ProjectController } from "./WebAPI/controllers/ProjectController"; 
import { TagRepository } from "./Database/repositories/tags/TagRepository";
import { TagService } from "./Services/tags/TagService";
import { TagController } from "./WebAPI/controllers/TagController";

export const logger = new ConsoleLoggerService();
export const db     = new DbManager(logger);

const userRepo   = new UserRepository(db, logger);
const auditRepo = new AuditRepository(db, logger);
const teamRepo = new TeamRepository(db, logger);
const projectRepo = new ProjectRepository(db, logger);
const tagRepo = new TagRepository(db, logger);

const authService   = new AuthService(userRepo);
const userService   = new UserService(userRepo);
const teamService = new TeamService(teamRepo);
const projectService = new ProjectService(projectRepo);
const tagService = new TagService(tagRepo);

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL ?? "*" }));
app.use(express.json());

app.use("/api/v1", new AuthController(authService, auditRepo).getRouter());
app.use("/api/v1", new UserController(userService).getRouter());
app.use("/api/v1", new TeamController(teamService).getRouter());
app.use("/api/v1", new ProjectController(projectService).getRouter());

export default app;
