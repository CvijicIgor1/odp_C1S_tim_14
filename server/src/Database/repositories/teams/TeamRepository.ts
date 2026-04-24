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
import { Request } from 'express';
import { UserRole } from '../../../Domain/enums/UserRole';

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
            new Date(r.createdAt),
            r.updatedAt ? new Date(r.updatedAt) : undefined,
        );
    }

    private mapMember(r: RowDataPacket): TeamMember { //zato sto neke funkcije vracaju teamMembere
        return new TeamMember(
            r.teamId,
            r.userId,
            r.role,
            r.joinedAt,
        );
    }

    async findAll(userId: number): Promise<{ teams: Team[], totalNumber: number }> {
        const res = await this.db.getReadConnection();
        if (!res) return { teams: [], totalNumber: 0 };

        try {
            const [rows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT t.* FROM teams t INNER JOIN team_members tm ON tm.team_id = t.id
                WHERE tm.user_id = ?
                ORDER BY t.name ASC`,
                [userId]
            );

            const teams = rows.map((r) => this.map(r));
            return { teams, totalNumber: teams.length };
        } catch (err) {
            this.logger.error("TeamsRepository", "findAll failed", err);
            return { teams: [], totalNumber: 0 };
        } finally {
            res.conn.release();
        }
    }

    async findById(teamId: number): Promise<Team | null> {
        const res = await this.db.getReadConnection();
        if (!res) return new Team();

        try {
            const [rows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT * FROM teams WHERE id = ?`,
                [teamId]
            );

            return rows.length > 0 ? this.map(rows[0]) : new Team();
        } catch (err) {
            this.logger.error("TeamRepository", "findById failed", err);
            return null;
        } finally {
            res.conn.release();
        }
    }
    async create(dto: CreateTeamDto, ownerId: number): Promise<Team> {
        const res = await this.db.getWriteConnection();
        if (!res) return new Team();
        try {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `INSERT INTO teams
                (name, description, avatar)
                VALUES (?, ?, ?)`,
                [
                    dto.name,
                    dto.description,
                    dto.avatar
                ],
            );
            if (result.insertId === 0) return new Team();
            return new Team(
                result.insertId,
                dto.name,
                dto.description,
                dto.avatar
            );
        } catch (err) {
            this.logger.error("TeamRepository", "create failed", err);
            return new Team();
        } finally {
            res.conn.release();
        }
    }
    async update(teamId: number, dto: UpdateTeamDto): Promise<Team | null> {
        const res = await this.db.getWriteConnection();
        if (!res) return null;

        try {
            // moram da pazim koja polja se zapravo menjaju
            //updatedAt bi trebao sam od sebe u bazi da se promeni na trenutni datum
            const fields: string[] = [];
            const values: any[] = [];

            if (dto.name !== undefined) {
                fields.push("name = ?");
                values.push(dto.name);
            }
            if (dto.description !== undefined) {
                fields.push("description = ?");
                values.push(dto.description);
            }
            if (dto.avatar !== undefined) {
                fields.push("avatar = ?");
                values.push(dto.avatar);
            }

            if (fields.length === 0) return this.findById(teamId);

            values.push(teamId);

            const [result] = await res.conn.execute<ResultSetHeader>(
                `UPDATE teams SET ${fields.join(", ")} WHERE id = ?`,
                values
            );

            if (result.affectedRows === 0) return null;

            // buduci da sam metnuo da funkcija vraca TEAM objekat,
            // morao bih ili jos jedan select upit ili samo da iskoristim
            // findByID od malopre, a nisam lud da pisem jos upita
            return this.findById(teamId);
        } catch (err) {
            this.logger.error("TeamsRepository", "update failed", err);
            return null;
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

    async getMembers(teamId: number): Promise<TeamMember[]> {
        const res = await this.db.getReadConnection();
        if (!res) return [];

        try {
            const [rows] = await res.conn.execute<RowDataPacket[]>(
                `SELECT tm.*
                FROM team_members tm
                WHERE tm.team_id = ?
                ORDER BY tm.role ASC`,
                [teamId]
            );

            return rows.map((r) => this.mapMember(r));
        } catch (err) {
            this.logger.error("TeamsRepository", "findAll failed", err);
            return [];
        } finally {
            res.conn.release();
        }
    }

    async addMember(teamId: number, userId: number, dto: AddMemberDto): Promise<boolean> {
        const res = await this.db.getWriteConnection();
        if (!res) return false;

        try {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `INSERT INTO team_members (team_id, user_id, role) 
                VALUES (?, ?, 'member')`,
                [teamId, userId],
            );
            return true;
        } catch (err) {
            this.logger.error("TeamsRepository", "addMember failed", err);
            return false;
        } finally {
            res.conn.release();
        }
    }
    async removeMember(teamId: number, memberId: number): Promise<boolean> {
        const res = await this.db.getWriteConnection();
        if (!res) return false;

        try {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `DELETE FROM team_members
                WHERE team_id = ? AND user_id = ?`,
                [teamId, memberId],
            );
            return true;
        } catch (err) {
            this.logger.error("TeamsRepository", "removeMember failed", err);
            return false;
        } finally {
            res.conn.release();
        }
    }
    async updateMemberRole(teamId: number, memberId: number, dto: UpdateMemberRoleDto): Promise<boolean> {
        const res = await this.db.getWriteConnection();
        if (!res) return false;

        try {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `UPDATE team_members
                SET role = ?
                WHERE team_id = ? AND user_id = ?`,
                [dto.role, teamId, memberId],
            );
            return true;
        } catch (err) {
            this.logger.error("TeamsRepository", "updateMemberRole failed", err);
            return false;
        } finally {
            res.conn.release();
        }
    }
}