import { Request, Response, Router } from "express";
import { IProjectService } from "../../Domain/services/projects/IProjectService";
import { authenticate } from "../../Middlewares/authentification/AuthMiddleware";
import { UserRole } from "../../Domain/enums/UserRole";
import { CreateProjectDto } from "../../Domain/DTOs/projects/CreateProjectDto";
import { UpdateProjectDto } from "../../Domain/DTOs/projects/UpdateProjectDto";
import { ProjectStatus } from "../../Domain/enums/ProjectStatus";
import { Priority } from "../../Domain/enums/Priority";