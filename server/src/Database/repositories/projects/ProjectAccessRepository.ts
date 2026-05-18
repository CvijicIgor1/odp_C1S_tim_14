import { RowDataPacket } from "mysql2";
import { IProjectAccessRepository } from "../../../Domain/repositories/projects/IProjectAccessRepository";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";
import { TeamMemberRole } from "../../../Domain/enums/TeamMemberRole";

export class ProjectAccessRepository implements IProjectAccessRepository
{
    public constructor(
        private readonly db: DbManager,
        private readonly logger: ILoggerService
    ) {}

    async isTeamMember(projectId: number, userId: number): Promise<boolean>
    {
        const res = await this.db.getReadConnection();
        if (!res) return false;
        try
        {
            const [pRows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT team_id FROM projects WHERE id = ?`, [projectId]
            );
            if (pRows.length === 0) return false;
            const teamId = pRows[0].team_id;

            const [tRows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT 1 FROM team_members WHERE team_id = ? AND user_id = ? LIMIT 1`, [teamId, userId]
            );
            return tRows.length > 0;
        }
        catch (err)
        {
            this.logger.error("ProjectAccessRepository", "isTeamMember failed", err);
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
            const [pRows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT team_id FROM projects WHERE id = ?`, [projectId]
            );
            if (pRows.length === 0) return false;
            const teamId = pRows[0].team_id;

            const [tRows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT 1 FROM team_members WHERE team_id = ? AND user_id = ? AND role = ? LIMIT 1`, [teamId, userId, TeamMemberRole.OWNER]
            );
            return tRows.length > 0;
        }
        catch (err)
        {
            this.logger.error("ProjectAccessRepository", "isTeamOwner failed", err);
            return false;
        }
        finally
        {
            res.conn.release();
        }
    }
}
