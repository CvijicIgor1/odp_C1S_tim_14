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

    findAll(userId: number): Promise<Team[]> {
        throw new Error('Method not implemented.');
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
            return new Team();
        } finally {
            res.conn.release();
        }
    }
    async create(dto: CreateTeamDto, ownerId: number): Promise<Team> {
        const res = await this.db.getReadConnection();
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
    update(teamId: number, dto: UpdateTeamDto): Promise<Team | null> {
        throw new Error('Method not implemented.');
    }
    delete(teamId: number): Promise<boolean> {
        throw new Error('Method not implemented.');
    }
    getMembers(teamId: number): Promise<TeamMember[]> {
        throw new Error('Method not implemented.');
    }
    addMember(teamId: number, dto: AddMemberDto): Promise<boolean> {
        throw new Error('Method not implemented.');
    }
    removeMember(teamId: number, memberId: number): Promise<boolean> {
        throw new Error('Method not implemented.');
    }
    updateMemberRole(teamId: number, memberId: number, dto: UpdateMemberRoleDto): Promise<boolean> {
        throw new Error('Method not implemented.');
    }
}