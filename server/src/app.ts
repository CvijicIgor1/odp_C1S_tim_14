import "dotenv/config";
import express from "express";
import cors from "cors";

import { ConsoleLoggerService } from "./Services/logger/ConsoleLoggerService";
import { DbManager } from "./Database/connection/DbConnectionPool";

import { UserRepository }   from "./Database/repositories/users/UserRepository";
import { AuditRepository } from "./Database/repositories/audit/AuditRepository";
import { TeamRepository } from "./Database/repositories/teams/TeamRepository";

import { AuthService }   from "./Services/auth/AuthService";
import { UserService }   from "./Services/users/UserService";
import { AuditService } from "./Services/audit/AuditService";
import { TeamService } from "./Services/teams/TeamService";

import { AuthController }   from "./WebAPI/controllers/AuthController";
import { UserController }   from "./WebAPI/controllers/UserController";
import { TeamController } from "./WebAPI/controllers/TeamController";

export const logger = new ConsoleLoggerService();
export const db     = new DbManager(logger);

// Repositories
const userRepo   = new UserRepository(db, logger);
const auditRepo = new AuditRepository(db, logger);
const teamRepo = new TeamRepository(db, logger);

// Services
const auditService = new AuditService(auditRepo);
const authService   = new AuthService(userRepo);
const userService   = new UserService(userRepo);
const teamService = new TeamService(teamRepo, auditService);

// Express
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL ?? "*" }));
app.use(express.json());

app.use("/api/v1", new AuthController(authService, auditService).getRouter());
app.use("/api/v1", new UserController(userService).getRouter());
app.use("/api/v1", new TeamController(teamService).getRouter());

export default app;
