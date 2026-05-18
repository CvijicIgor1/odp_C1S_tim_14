import { RowDataPacket } from "mysql2";
import { ITeamQueryRepository } from "../../../Domain/repositories/teams/ITeamQueryRepository";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";
import { Team } from "../../../Domain/models/Team";
import { TeamMember } from "../../../Domain/models/TeamMember";
import { TeamMemberRole } from "../../../Domain/enums/TeamMemberRole";

export class TeamQueryRepository implements ITeamQueryRepository
{
    public constructor(
        private readonly db: DbManager,
        private readonly logger: ILoggerService
    ) {}

    private map(r: RowDataPacket): Team
    {
        return new Team(
            r.id, r.name, r.description ?? null, r.avatar,
            r.created_at ? new Date(r.created_at) : new Date(),
            r.updated_at ? new Date(r.updated_at) : new Date(),
        );
    }

    private mapMember(r: RowDataPacket): TeamMember
    {
        return new TeamMember(r.team_id, r.user_id, r.role, r.joined_at ? new Date(r.joined_at) : new Date());
    }

    async findAll(userId: number): Promise<{ teams: Array<{ team: Team; role: TeamMemberRole }>; totalNumber: number }>
    {
        const res = await this.db.getReadConnection();
        if (!res) return { teams: [], totalNumber: 0 };
        try
        {
            const [memberRows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT team_id, role FROM team_members WHERE user_id = ? ORDER BY team_id ASC`, [userId]
            );
            if (memberRows.length === 0) return { teams: [], totalNumber: 0 };

            const roleByTeamId = new Map<number, TeamMemberRole>(memberRows.map((r) => [r.team_id as number, r.role as TeamMemberRole]));
            const teamIds = memberRows.map((r) => r.team_id as number);
            const placeholders = teamIds.map(() => "?").join(", ");

            const [teamRows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT * FROM teams WHERE id IN (${placeholders}) ORDER BY name ASC`, teamIds
            );
            const teams = teamRows.map((r) => ({ team: this.map(r), role: roleByTeamId.get(r.id as number) ?? TeamMemberRole.MEMBER }));
            return { teams, totalNumber: teams.length };
        }
        catch (err)
        {
            this.logger.error("TeamQueryRepository", "findAll failed", err);
            return { teams: [], totalNumber: 0 };
        }
        finally
        {
            res.conn.release();
        }
    }

    async findAllAsAdmin(): Promise<{ teams: Team[]; totalNumber: number }>
    {
        const res = await this.db.getReadConnection();
        if (!res) return { teams: [], totalNumber: 0 };
        try
        {
            const [rows] = await res.conn.execute<RowDataPacket[]>(`SELECT * FROM teams ORDER BY name ASC`);
            const teams = rows.map((r) => this.map(r));
            return { teams, totalNumber: teams.length };
        }
        catch (err)
        {
            this.logger.error("TeamQueryRepository", "findAllAsAdmin failed", err);
            return { teams: [], totalNumber: 0 };
        }
        finally
        {
            res.conn.release();
        }
    }

    async findById(teamId: number): Promise<Team | null>
    {
        const res = await this.db.getReadConnection();
        if (!res) return new Team();
        try
        {
            const [rows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT * FROM teams WHERE id = ?`, [teamId]
            );
            return rows.length > 0 ? this.map(rows[0]) : new Team();
        }
        catch (err)
        {
            this.logger.error("TeamQueryRepository", "findById failed", err);
            return new Team();
        }
        finally
        {
            res.conn.release();
        }
    }

    async getMembers(teamId: number): Promise<{ members: TeamMember[]; totalNumber: number }>
    {
        const res = await this.db.getReadConnection();
        if (!res) return { members: [], totalNumber: 0 };
        try
        {
            const [rows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT * FROM team_members WHERE team_id = ? ORDER BY role ASC`, [teamId]
            );
            return { members: rows.map((r) => this.mapMember(r)), totalNumber: rows.length };
        }
        catch (err)
        {
            this.logger.error("TeamQueryRepository", "getMembers failed", err);
            return { members: [], totalNumber: 0 };
        }
        finally
        {
            res.conn.release();
        }
    }
}
