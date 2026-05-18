import { RowDataPacket, ResultSetHeader } from "mysql2";
import { toLogError } from "../../../utils/logging";
import { IProjectCommandRepository } from "../../../Domain/repositories/projects/IProjectCommandRepository";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";
import { Project } from "../../../Domain/models/Project";

export class ProjectCommandRepository implements IProjectCommandRepository
{
    public constructor(
        private readonly db: DbManager,
        private readonly logger: ILoggerService
    ) {}

    async create(teamId: number, newProject: Project): Promise<Project>
    {
        const res = await this.db.getWriteConnection();
        if (!res) return new Project();
        try
        {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `INSERT INTO projects (team_id, name, description, status, priority, deadline) VALUES (?, ?, ?, ?, ?, ?)`,
                [teamId, newProject.name, newProject.description, newProject.status, newProject.priority, newProject.deadline]
            );
            if (result.insertId === 0) return new Project();
            return new Project(
                result.insertId, teamId, newProject.name, newProject.description,
                newProject.status, newProject.priority, new Date(newProject.deadline ?? new Date())
            );
        }
        catch (err)
        {
            this.logger.error("ProjectCommandRepository", "create failed", toLogError(err instanceof Error ? err : String(err)));
            return new Project();
        }
        finally
        {
            res.conn.release();
        }
    }

    async update(id: number, inputProject: Project): Promise<boolean>
    {
        const res = await this.db.getWriteConnection();
        if (!res) return false;
        try
        {
            const fields: string[] = [];
            const values: (string | number | Date)[] = [];

            if (inputProject.name !== undefined)        { fields.push("name = ?");        values.push(inputProject.name); }
            if (inputProject.description !== undefined) { fields.push("description = ?"); values.push(inputProject.description); }
            if (inputProject.status !== undefined)      { fields.push("status = ?");      values.push(inputProject.status); }
            if (inputProject.priority !== undefined)    { fields.push("priority = ?");    values.push(inputProject.priority); }
            if (inputProject.deadline !== undefined)    { fields.push("deadline = ?");    values.push(new Date(inputProject.deadline)); }

            if (fields.length === 0) return false;
            values.push(id);

            const [result] = await res.conn.execute<ResultSetHeader>(
                `UPDATE projects SET ${fields.join(", ")} WHERE id = ?`, values
            );
            return result.affectedRows > 0;
        }
        catch (err)
        {
            this.logger.error("ProjectCommandRepository", "update failed", toLogError(err instanceof Error ? err : String(err)));
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
                `DELETE FROM projects WHERE id = ?`, [id]
            );
            return result.affectedRows > 0;
        }
        catch (err)
        {
            this.logger.error("ProjectCommandRepository", "delete failed", toLogError(err instanceof Error ? err : String(err)));
            return false;
        }
        finally
        {
            res.conn.release();
        }
    }
}
