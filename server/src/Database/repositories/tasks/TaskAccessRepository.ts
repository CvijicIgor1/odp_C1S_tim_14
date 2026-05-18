import { RowDataPacket } from "mysql2";
import { ITaskAccessRepository } from "../../../Domain/repositories/tasks/ITaskAccessRepository";
import { ITeamQueryRepository } from "../../../Domain/repositories/teams/ITeamQueryRepository";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";
import { TeamMemberRole } from "../../../Domain/enums/TeamMemberRole";

export class TaskAccessRepository implements ITaskAccessRepository
{
    public constructor(
        private readonly db: DbManager,
        private readonly logger: ILoggerService,
        private readonly teamRepo: ITeamQueryRepository,
    ) {}

    async isUserInProjectTeam(projectId: number, userId: number): Promise<boolean>
    {
        const connResult = await this.db.getReadConnection();
        if (!connResult) return false;
        try
        {
            const [pRows] = await connResult.conn.execute<RowDataPacket[]>(
                `SELECT team_id FROM projects WHERE id = ?`, [projectId]
            );
            if (pRows.length === 0) return false;
            const teamId = pRows[0].team_id;

            const { members } = await this.teamRepo.getMembers(teamId);
            return members.some((m) => m.userId === userId);
        }
        catch (err)
        {
            this.logger.error("TaskAccessRepository", "isUserInProjectTeam failed", err);
            return false;
        }
        finally
        {
            connResult.conn.release();
        }
    }

    async isTeamOwnerOfTask(taskId: number, userId: number): Promise<boolean>
    {
        const connResult = await this.db.getReadConnection();
        if (!connResult) return false;
        try
        {
            const [taskRows] = await connResult.conn.execute<RowDataPacket[]>(
                `SELECT project_id FROM tasks WHERE id = ?`, [taskId]
            );
            if (taskRows.length === 0) return false;
            const projectId = taskRows[0].project_id;

            const [pRows] = await connResult.conn.execute<RowDataPacket[]>(
                `SELECT team_id FROM projects WHERE id = ?`, [projectId]
            );
            if (pRows.length === 0) return false;
            const teamId = pRows[0].team_id;

            const { members } = await this.teamRepo.getMembers(teamId);
            return members.some((m) => m.userId === userId && m.role === TeamMemberRole.OWNER);
        }
        catch (err)
        {
            this.logger.error("TaskAccessRepository", "isTeamOwnerOfTask failed", err);
            return false;
        }
        finally
        {
            connResult.conn.release();
        }
    }
}
