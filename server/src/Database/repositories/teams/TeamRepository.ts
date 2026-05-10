import { ITeamRepository } from '../../../Domain/repositories/teams/ITeamRepository';
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from '../../../Domain/services/logger/ILoggerService';
import { AddMemberDto } from '../../../Domain/DTOs/teams/AddMemberDto';
import { CreateTeamDto } from '../../../Domain/DTOs/teams/CreateTeamDto';
import { UpdateMemberRoleDto } from '../../../Domain/DTOs/teams/UpdateMemberRoleDto';
import { UpdateTeamDto } from '../../../Domain/DTOs/teams/UpdateTeamDto';
import { Team } from '../../../Domain/models/Team';
import { TeamMember } from '../../../Domain/models/TeamMember';
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { TeamMemberRole } from '../../../Domain/enums/TeamMemberRole';

export class TeamRepository implements ITeamRepository {
    public constructor(
        private readonly db: DbManager,
        private readonly logger: ILoggerService
    ) { }

    private map(r: RowDataPacket): Team {
        return new Team(
            r.id,
            r.name,
            r.description ?? null,
            r.avatar,
            r.created_at ? new Date(r.created_at) : new Date(),
            r.updated_at ? new Date(r.updated_at) : new Date(),
        );
    }

    private mapMember(r: RowDataPacket): TeamMember { //zato sto neke funkcije vracaju teamMembere
        return new TeamMember(
            r.team_id,
            r.user_id,
            r.role,
            r.joined_at ? new Date(r.joined_at) : new Date(),
        );
    }

    async findAll(userId: number): Promise<{ teams: Array<{team: Team; role: string}>, totalNumber: number }> {
        const res = await this.db.getReadConnection();
        if (!res) return { teams: [], totalNumber: 0 };

        try {
            const [memberRows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT team_id, role FROM team_members WHERE user_id = ? ORDER BY team_id ASC`,
                [userId]
            );

            if (memberRows.length === 0) return { teams: [], totalNumber: 0 };

            const roleByTeamId = new Map<number, string>(
                memberRows.map((r) => [r.team_id as number, r.role as string])
            );
            const teamIds = memberRows.map((r) => r.team_id as number);
            const placeholders = teamIds.map(() => "?").join(", ");

            const [teamRows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT * FROM teams WHERE id IN (${placeholders}) ORDER BY name ASC`,
                teamIds
            );

            const teams = teamRows.map((r) => ({
                team: this.map(r),
                role: roleByTeamId.get(r.id as number) ?? "member",
            }));

            return { teams, totalNumber: teams.length };
        } catch (err) {
            this.logger.error("TeamsRepository", "findAll failed", err);
            return { teams: [], totalNumber: 0 };
        } finally {
            res.conn.release();
        }
    }

    async findAllAsAdmin(): Promise<{ teams: Team[], totalNumber: number }> {
        const res = await this.db.getReadConnection();
        if (!res) return { teams: [], totalNumber: 0 };

        try {
            const [rows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT * FROM teams ORDER BY name ASC`
            );

            const teams = rows.map((r) => this.map(r));
            return { teams, totalNumber: teams.length };
        } catch (err) {
            this.logger.error("TeamsRepository", "findAllAsAdmin failed", err);
            return { teams: [], totalNumber: 0 };
        } finally {
            res.conn.release();
        }
    }

    async findById(teamId: number): Promise<Team | null> {
        const res = await this.db.getReadConnection();
        if (!res) return null;

        try {
            const [rows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT * FROM teams WHERE id = ?`,
                [teamId]
            );

            return rows.length > 0 ? this.map(rows[0]) : new Team();
        } catch (err) {
            this.logger.error("TeamRepository", "findById failed", err);
            return new Team();
        } finally {
            res.conn.release();
        }
    }

    async create(newTeam: Team, ownerId: number): Promise<Team> {
        const res = await this.db.getWriteConnection();
        if (!res) return new Team();
        try {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `INSERT INTO teams (name, description, avatar) VALUES (?, ?, ?)`,
                [newTeam.name, newTeam.description, newTeam.avatar],
            );
            if (result.insertId === 0) return new Team();
            await res.conn.execute<ResultSetHeader>(
                `INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, 'owner')`,
                [result.insertId, ownerId],
            );
            return new Team(
                result.insertId,
                newTeam.name,
                newTeam.description,
                newTeam.avatar
            );
        } catch (err) {
            this.logger.error("TeamRepository", "create failed", err);
            return new Team();
        } finally {
            res.conn.release();
        }
    }

    async update(teamId: number, inputTeam: Team): Promise<boolean> {
        const res = await this.db.getWriteConnection();
        if (!res) return false;

        try {
            // moram da pazim koja polja se zapravo menjaju
            //updatedAt bi trebao sam od sebe u bazi da se promeni na trenutni datum
            const fields: string[] = [];
            const values: (string | number)[] = [];

            if (inputTeam.name !== "") {
                fields.push("name = ?");
                values.push(inputTeam.name);
            }
            if (inputTeam.description !== "") {
                fields.push("description = ?");
                values.push(inputTeam.description);
            }
            if (inputTeam.avatar !== "") {
                fields.push("avatar = ?");
                values.push(inputTeam.avatar);
            }

            if (fields.length === 0) return false;

            values.push(teamId);

            const [result] = await res.conn.execute<ResultSetHeader>(
                `UPDATE teams SET ${fields.join(", ")} WHERE id = ?`,
                values
            );

            return result.affectedRows > 0;
        } catch (err) {
            this.logger.error("TeamsRepository", "update failed", err);
            return false;
        } finally {
            res.conn.release();
        }
    }

    async delete(teamId: number): Promise<boolean> {
        const res = await this.db.getWriteConnection();
        if (!res) return false;

        try {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `DELETE FROM teams WHERE id = ?`,
                [teamId]
            );

            return result.affectedRows > 0;
        } catch (err) {
            this.logger.error("TeamsRepository", "delete failed", err);
            return false;
        } finally {
            res.conn.release();
        }
    }

    async getMembers(teamId: number): Promise<{members: TeamMember[], totalNumber: number}>{
        const res = await this.db.getReadConnection();
        if (!res) return {members: [], totalNumber: 0};

        try {
            const [rows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT * FROM team_members WHERE team_id = ? ORDER BY role ASC`,
                [teamId]
            );
            return {members: rows.map((r) => this.mapMember(r)), totalNumber: rows.length};
        } catch (err) {
            this.logger.error("TeamsRepository", "getMembers failed", err);
            return {members: [], totalNumber: 0};
        } finally {
            res.conn.release();
        }
    }
    
    async countOwners(teamId: number): Promise<number> {
        const res = await this.db.getReadConnection();
        if (!res) return 0;
        try {
            const [rows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT COUNT(*) AS cnt FROM team_members WHERE team_id = ? AND role = 'owner'`,
                [teamId]
            );
            return Number(rows[0].cnt);
        } catch (err) {
            this.logger.error("TeamsRepository", "countOwners failed", err);
            return 0;
        } finally {
            res.conn.release();
        }
    }
    async addMember(teamId: number, noviClan: TeamMember): Promise<boolean> {
        const readRes = await this.db.getReadConnection();
        if (!readRes) return false;

        let targetUserId: number;
        try {
            const [rows] = await readRes.conn.execute<RowDataPacket[]>(
                `SELECT id FROM users WHERE username = ?`,
                [noviClan.username]
            );
            if (rows.length === 0) return false;
            targetUserId = rows[0].id;
        } catch (err) {
            this.logger.error("TeamsRepository", "addMember user lookup failed", err);
            return false;
        } finally {
            readRes.conn.release();
        }

        const writeRes = await this.db.getWriteConnection();
        if (!writeRes) return false;

        try {
            await writeRes.conn.execute<ResultSetHeader>(
                `INSERT INTO team_members (team_id, user_id, role)
                VALUES (?, ?, ?)`,
                [teamId, targetUserId, noviClan.role],
            );
            return true;
        } catch (err) {
            this.logger.error("TeamsRepository", "addMember failed", err);
            return false;
        } finally {
            writeRes.conn.release();
        }
    }

    async removeMember(teamId: number, memberId: number): Promise<boolean> {
        const writeRes = await this.db.getWriteConnection();
        if (!writeRes) return false;

        try {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `DELETE FROM team_members
                WHERE team_id = ? AND user_id = ?`,
                [teamId, memberId],
            );
            if (result.affectedRows === 0) return false;
        } catch (err) {
            this.logger.error("TeamsRepository", "removeMember failed", err);
            return false;
        } finally {
            writeRes.conn.release();
        }

        const readRes = await this.db.getReadConnection();
        if (!readRes) return true;

        let projectIds: number[] = [];
        try {
            const [projectRows] = await readRes.conn.execute<RowDataPacket[]>(
                `SELECT id FROM projects WHERE team_id = ?`,
                [teamId]
            );
            projectIds = projectRows.map((r) => r.id as number);
        } catch (err) {
            this.logger.error("TeamsRepository", "removeMember project lookup failed", err);
            return true;
        } finally {
            readRes.conn.release();
        }

        if (projectIds.length === 0) return true;

        const projectPlaceholders = projectIds.map(() => "?").join(", ");

        const cascadeWriteRes = await this.db.getWriteConnection();
        if (!cascadeWriteRes) return true;

        try {
            await cascadeWriteRes.conn.execute<ResultSetHeader>(
                `DELETE FROM project_watchers WHERE project_id IN (${projectPlaceholders}) AND user_id = ?`,
                [...projectIds, memberId]
            );
        } catch (err) {
            this.logger.error("TeamsRepository", "removeMember watcher cascade failed", err);
        } finally {
            cascadeWriteRes.conn.release();
        }

        const taskReadRes = await this.db.getReadConnection();
        if (!taskReadRes) return true;

        let taskIds: number[] = [];
        try {
            const [taskRows] = await taskReadRes.conn.execute<RowDataPacket[]>(
                `SELECT id FROM tasks WHERE project_id IN (${projectPlaceholders})`,
                projectIds
            );
            taskIds = taskRows.map((r) => r.id as number);
        } catch (err) {
            this.logger.error("TeamsRepository", "removeMember task lookup failed", err);
            return true;
        } finally {
            taskReadRes.conn.release();
        }

        if (taskIds.length === 0) return true;

        const taskPlaceholders = taskIds.map(() => "?").join(", ");

        const assigneeWriteRes = await this.db.getWriteConnection();
        if (!assigneeWriteRes) return true;

        try {
            await assigneeWriteRes.conn.execute<ResultSetHeader>(
                `DELETE FROM task_assignees WHERE task_id IN (${taskPlaceholders}) AND user_id = ?`,
                [...taskIds, memberId]
            );
            return true;
        } catch (err) {
            this.logger.error("TeamsRepository", "removeMember assignee cascade failed", err);
            return true;
        } finally {
            assigneeWriteRes.conn.release();
        }
    }

    async updateMemberRole(teamId: number, memberId: number, novaUloga: TeamMemberRole): Promise<boolean> {
        const res = await this.db.getWriteConnection();
        if (!res) return false;

        try {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `UPDATE team_members
                SET role = ?
                WHERE team_id = ? AND user_id = ?`,
                [novaUloga, teamId, memberId],
            );
            return result.affectedRows > 0;
        } catch (err) {
            this.logger.error("TeamsRepository", "updateMemberRole failed", err);
            return false;
        } finally {
            res.conn.release();
        }
    }
}