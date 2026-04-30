import { RowDataPacket , ResultSetHeader } from "mysql2";
import { IProjectRepository } from '../../../Domain/repositories/projects/IProjectRepository';
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from '../../../Domain/services/logger/ILoggerService';
import { Project } from "../../../Domain/models/Project";
import { Tag } from "../../../Domain/models/Tag";
import { CreateProjectDto } from "../../../Domain/DTOs/projects/CreateProjectDto";
import { UpdateProjectDto } from "../../../Domain/DTOs/projects/UpdateProjectDto";
import { ProjectFilters } from "../../../Domain/types/ProjectFilters";
import { ProjectStatus } from "../../../Domain/enums/ProjectStatus";
import { Priority } from "../../../Domain/enums/Priority";

export class ProjectRepository implements IProjectRepository
{
    public constructor(
        private readonly db: DbManager,
        private readonly logger: ILoggerService
    ) {}

    private map(r: RowDataPacket): Project 
    {
        return new Project(
            r.id,
            r.team_id,
            r.name,
            r.description,
            r.status as ProjectStatus,
            r.priority as Priority,
            r.deadline ? new Date(r.deadline) : new Date(),
            r.created_at ? new Date(r.created_at) : new Date(),
            r.updated_at ? new Date(r.updated_at) : new Date(),
        );
    }

    private mapTag(r: RowDataPacket): Tag
    {
        return new Tag(r.id,r.name);
    }

    async findAllByTeam(teamId: number, filters?: ProjectFilters): Promise<{ projects: Project[]; totalNumber: number }>
    {
        const res = await this.db.getReadConnection();
        if (!res) return { projects: [], totalNumber: 0 };

        try{
            const conditions: string[] = ["team_id = ?"];
            const values: (string | number)[] = [teamId];

            if (filters?.status) {
                conditions.push("status = ?");
                values.push(filters.status);
            }

            if (filters?.priority) {
                conditions.push("priority = ?");
                values.push(filters.priority);
            }
            if (filters?.tagId) {
                conditions.push('id IN (SELECT project_id FROM project_tags WHERE tag_id = ?)');
                values.push(filters.tagId);
            }

            const [rows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT * FROM projects WHERE ${conditions.join(" AND ")} ORDER BY created_at DESC`,
                values
            );

            const projects = rows.map((r) => this.map(r));
            return { projects, totalNumber: projects.length };
        }
        catch(err)
        {
            this.logger.error("ProjectRepository", "findAllByTeam failed", err);
            return { projects: [], totalNumber: 0 };
        }
        finally
        {
            res.conn.release();
        }
    }

    async findById(id: number): Promise<Project | null>
    {
        const res = await this.db.getReadConnection();
        if (!res) return null;
        try 
        {
            const [rows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT * FROM projects WHERE id = ?`,
                [id]
            );
            return rows.length > 0 ? this.map(rows[0]) : null;
        }
        catch(err)
        {
            this.logger.error("ProjectRepository", "findById failed", err);
            return null;
        }
        finally
        {
            res.conn.release();
        }
    }

    async create(teamId:number ,dto: CreateProjectDto): Promise<Project>
    {
        const res = await this.db.getWriteConnection();
        if (!res) return new Project();
        try
        {
            const [result] = await res.conn.execute<ResultSetHeader>
            (
                `INSERT INTO projects (team_id, name, description, status, priority, deadline) VALUES (?, ?, ?, ?, ?, ?)`,
                [teamId,dto.name,dto.description,dto.status,dto.priority,dto.deadline],
            );

            if(result.insertId===0) return new Project();
            return new Project(
                result.insertId,
                teamId,
                dto.name,
                dto.description,
                dto.status,
                dto.priority,
                new Date(dto.deadline ?? new Date()),
            );
        }
        catch(err) {
            this.logger.error("ProjectRepository", "create failed", err);
            return new Project();
        }
        finally
        {
            res.conn.release();
        }
    }

    async update(id: number, dto: UpdateProjectDto): Promise<boolean>
    {
        const res = await this.db.getWriteConnection();
        if (!res) return false;

        try
        {
            const fields: string[] = [];
            const values: (string | number | Date)[] = [];

            if(dto.name !== undefined)
            {
                fields.push("name = ?");
                values.push(dto.name);
            }

            if(dto.description !== undefined)
            {
                fields.push("description = ?");
                values.push(dto.description);
            }

            if(dto.status !== undefined)
            {
                fields.push("status = ?");
                values.push(dto.status);
            }

            if(dto.priority !== undefined)
            {
                fields.push("priority = ?");
                values.push(dto.priority);
            }

            if(dto.deadline !== undefined)
            {
                fields.push("deadline = ?");
                values.push(new Date(dto.deadline));
            }
            if(fields.length === 0) return false;
            values.push(id);
            const [result] = await res.conn.execute<ResultSetHeader>(
                `UPDATE projects SET ${fields.join(", ")} WHERE id = ?`,
                values,
            );

            return result.affectedRows > 0;
        }
        catch(err)
        {
            this.logger.error("ProjectRepository", "update failed", err);
            return false;
        }
        finally
        {
            res.conn.release();
        }
    }

    async delete(id: number): Promise<boolean>
    {
        const res = await this.db.getWriteConnection();
        if (!res) return false;
        try
        {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `DELETE FROM projects WHERE id = ?`,
                [id],
            );

            return result.affectedRows > 0; 
        }
        catch(err)
        {
            this.logger.error("ProjectRepository", "delete failed", err);
            return false;
        }
        finally
        {
            res.conn.release();
        }
    }

    async addTag(projectId: number , tagId:number): Promise<boolean>
    {
        const res = await this.db.getWriteConnection();
        if (!res) return false;
        try
        {
            await res.conn.execute<ResultSetHeader>
            (
                `INSERT IGNORE INTO project_tags (project_id, tag_id) VALUES (?, ?)`,
                [projectId, tagId],
            );
            return true;
        }
        catch(err)
        {
            this.logger.error("ProjectRepository", "addTag failed", err);
            return false;
        }
        finally
        {
            res.conn.release();
        }
    }

    async removeTag(projectId: number , tagId:number): Promise<boolean>
    {
        const res = await this.db.getWriteConnection();
        if (!res) return false;
        try
        {
            const [result] = await res.conn.execute<ResultSetHeader>
            (
                `DELETE FROM project_tags WHERE project_id = ? AND tag_id = ?`,
                [projectId, tagId],
            );
            return result.affectedRows > 0;
        }
        catch(err)
        {
            this.logger.error("ProjectRepository", "removeTag failed", err);
            return false;
        }
        finally
        {
            res.conn.release();
        }
    }

    async getTagsForProject(projectId: number): Promise<Tag[]> 
    {
        const res = await this.db.getReadConnection();
        if (!res) return [];
        
        try
        {
            const [rows] = await res.conn.execute<RowDataPacket[]>
            (
                `SELECT * FROM tags WHERE id IN (SELECT tag_id FROM project_tags WHERE project_id = ?) ORDER BY name ASC`,
                [projectId],
            );
            return rows.map((r) => this.mapTag(r));
        }
        catch(err)
        {
            this.logger.error("ProjectRepository", "getTagsForProject failed", err);
            return [];
        }
        finally
        {
            res.conn.release();
        }
    }

    async addWatcher(projectId: number, userId: number): Promise<boolean> 
    {
          const res = await this.db.getWriteConnection();
        if (!res) return false;
        
        try
        {
            await res.conn.execute<ResultSetHeader>
            (
                `INSERT IGNORE INTO project_watchers (project_id, user_id) VALUES (?, ?)`,
                [projectId, userId],
            )
            return true;
        }
        catch(err)
        {
            this.logger.error("ProjectRepository", "addWatcher failed", err);
            return false;
        }
        finally
        {
            res.conn.release();
        }
    }

    async removeWatcher(projectId: number, userId: number): Promise<boolean>
    {
        const res = await this.db.getWriteConnection();
        if (!res) return false;

        try
        {
            const [result] = await res.conn.execute<ResultSetHeader>
            (
                `DELETE FROM project_watchers WHERE project_id = ? AND user_id = ?`,
                [projectId, userId],
            );
            return result.affectedRows > 0;
        }
        catch(err)
        {
            this.logger.error("ProjectRepository", "removeWatcher failed", err);
            return false;
        }
        finally
        {
            res.conn.release();
        }
    }

     async findWatchedByUser(userId: number,): Promise<{ projects: Project[]; totalNumber: number }>
    {
        const res = await this.db.getReadConnection(); 
        if (!res) return { projects: [], totalNumber: 0 };

        try{
            const [rows] = await res.conn.execute<RowDataPacket[]>
            (
                `SELECT * FROM projects WHERE id IN (SELECT project_id FROM project_watchers WHERE user_id = ?) ORDER BY created_at DESC`,
                [userId],
            );

            const projects = rows.map((r) => this.map(r));
            return { projects, totalNumber: projects.length };
        }
        catch(err)
        {
            this.logger.error("ProjectRepository", "findWatchedByUser failed", err);
            return { projects: [], totalNumber: 0 };
        }
        finally
        {
            res.conn.release();
        }
    }

    async isTeamMember(projectId: number, userId: number): Promise<boolean>
    {
        const res = await this.db.getReadConnection();
        if (!res) return false;
        try
        {
            // e sad lakse bi bilo samo da joinujem 
            // ali ako ne sme onda cu prvo izvlaciti team_id projekta a zatim proveravati da li je user clan tog tima

            const [pRows] = await res.conn.execute<RowDataPacket[]>
            (
                `SELECT team_id FROM projects WHERE id = ?`,
                [projectId],
            );

            if (pRows.length === 0) return false;
            const teamId = pRows[0].team_id;
            const [tRows] = await res.conn.execute<RowDataPacket[]>
            (
                `SELECT * FROM team_members WHERE team_id = ? AND user_id = ?`,
                [teamId, userId],
            );
            return tRows.length > 0;
        }
        catch(err)
        {
            this.logger.error("ProjectRepository", "isTeamMember failed", err);
            return false;
        }
        finally
        {
            res.conn.release();
        }
    }

    async isTeamOwner(projectId: number, userId: number): Promise<boolean>
    {
        const res = await this.db.getReadConnection();
        if (!res) return false;
        
        try
        {
            // izlvlacim team_id zatim proveravam da li je owner tog tima
            const [pRows] = await res.conn.execute<RowDataPacket[]>
            (
                `SELECT team_id FROM projects WHERE id = ?`,
                [projectId],
            );
            if(pRows.length === 0) return false;
            const teamId = pRows[0].team_id;

            const [tRows] = await res.conn.execute<RowDataPacket[]>
            (
                `SELECT 1 FROM team_members WHERE team_id = ? AND user_id = ? AND role = 'owner' LIMIT 1`,
                [teamId, userId],
            );
            return tRows.length > 0;
        }
        catch(err)
        {
            this.logger.error("ProjectRepository", "isTeamOwner failed", err);
            return false;
        }
        finally
        {
            res.conn.release();
        }
    }

    async isWatcher(projectId: number, userId: number): Promise<boolean>
    {
    const res = await this.db.getReadConnection();
    if (!res) return false;

    try
    {
        const [rows] = await res.conn.execute<RowDataPacket[]>(
            `SELECT 1 FROM project_watchers WHERE project_id = ? AND user_id = ? LIMIT 1`,
            [projectId, userId],
        );
        return rows.length > 0;
    }
    catch(err)
    {
        this.logger.error("ProjectRepository", "isWatcher failed", err);
        return false;
    }
    finally
    {
        res.conn.release();
    }
    }

   async getWatcherCount(projectId: number): Promise<number>
   {
    const res = await this.db.getReadConnection();
    if (!res) return 0;
    try
    {
        const [rows] = await res.conn.execute<RowDataPacket[]>
        (
            `SELECT COUNT(*) as cnt FROM project_watchers WHERE project_id = ?`,
            [projectId]
        );
        return rows[0].cnt ?? 0;
    }
    catch(err)
    {
        this.logger.error("ProjectRepository", "getWatcherCount failed", err);
        return 0;
    }
    finally
    {
        res.conn.release();
    }
  }
}