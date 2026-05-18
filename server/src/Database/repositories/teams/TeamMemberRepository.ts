import { RowDataPacket, ResultSetHeader } from "mysql2";
import { ITeamMemberRepository } from "../../../Domain/repositories/teams/ITeamMemberRepository";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";
import { TeamMember } from "../../../Domain/models/TeamMember";

export class TeamMemberRepository implements ITeamMemberRepository
{
    public constructor(
        private readonly db: DbManager,
        private readonly logger: ILoggerService
    ) {}

    async addMember(teamId: number, noviClan: TeamMember): Promise<boolean>
    {
        const readRes = await this.db.getReadConnection();
        if (!readRes) return false;

        let targetUserId: number;
        try
        {
            const [rows] = await readRes.conn.execute<RowDataPacket[]>(
                `SELECT id FROM users WHERE username = ?`, [noviClan.username]
            );
            if (rows.length === 0) return false;
            targetUserId = rows[0].id;
        }
        catch (err)
        {
            this.logger.error("TeamMemberRepository", "addMember user lookup failed", err);
            return false;
        }
        finally
        {
            readRes.conn.release();
        }

        const writeRes = await this.db.getWriteConnection();
        if (!writeRes) return false;
        try
        {
            await writeRes.conn.execute<ResultSetHeader>(
                `INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)`,
                [teamId, targetUserId, noviClan.role]
            );
            return true;
        }
        catch (err)
        {
            this.logger.error("TeamMemberRepository", "addMember failed", err);
            return false;
        }
        finally
        {
            writeRes.conn.release();
        }
    }

    async removeMember(teamId: number, memberId: number): Promise<boolean>
    {
        const writeRes = await this.db.getWriteConnection();
        if (!writeRes) return false;
        try
        {
            const [result] = await writeRes.conn.execute<ResultSetHeader>(
                `DELETE FROM team_members WHERE team_id = ? AND user_id = ?`, [teamId, memberId]
            );
            if (result.affectedRows === 0) return false;
        }
        catch (err)
        {
            this.logger.error("TeamMemberRepository", "removeMember failed", err);
            return false;
        }
        finally
        {
            writeRes.conn.release();
        }

        const readRes = await this.db.getReadConnection();
        if (!readRes) return true;

        let projectIds: number[] = [];
        try
        {
            const [projectRows] = await readRes.conn.execute<RowDataPacket[]>(
                `SELECT id FROM projects WHERE team_id = ?`, [teamId]
            );
            projectIds = projectRows.map((r) => r.id as number);
        }
        catch (err)
        {
            this.logger.error("TeamMemberRepository", "removeMember project lookup failed", err);
            return true;
        }
        finally
        {
            readRes.conn.release();
        }

        if (projectIds.length === 0) return true;
        const projectPlaceholders = projectIds.map(() => "?").join(", ");

        const cascadeWriteRes = await this.db.getWriteConnection();
        if (!cascadeWriteRes) return true;
        try
        {
            await cascadeWriteRes.conn.execute<ResultSetHeader>(
                `DELETE FROM project_watchers WHERE project_id IN (${projectPlaceholders}) AND user_id = ?`,
                [...projectIds, memberId]
            );
        }
        catch (err)
        {
            this.logger.error("TeamMemberRepository", "removeMember watcher cascade failed", err);
        }
        finally
        {
            cascadeWriteRes.conn.release();
        }

        const taskReadRes = await this.db.getReadConnection();
        if (!taskReadRes) return true;

        let taskIds: number[] = [];
        try
        {
            const [taskRows] = await taskReadRes.conn.execute<RowDataPacket[]>(
                `SELECT id FROM tasks WHERE project_id IN (${projectPlaceholders})`, projectIds
            );
            taskIds = taskRows.map((r) => r.id as number);
        }
        catch (err)
        {
            this.logger.error("TeamMemberRepository", "removeMember task lookup failed", err);
            return true;
        }
        finally
        {
            taskReadRes.conn.release();
        }

        if (taskIds.length === 0) return true;
        const taskPlaceholders = taskIds.map(() => "?").join(", ");

        const assigneeWriteRes = await this.db.getWriteConnection();
        if (!assigneeWriteRes) return true;
        try
        {
            await assigneeWriteRes.conn.execute<ResultSetHeader>(
                `DELETE FROM task_assignees WHERE task_id IN (${taskPlaceholders}) AND user_id = ?`,
                [...taskIds, memberId]
            );
            return true;
        }
        catch (err)
        {
            this.logger.error("TeamMemberRepository", "removeMember assignee cascade failed", err);
            return true;
        }
        finally
        {
            assigneeWriteRes.conn.release();
        }
    }

}
