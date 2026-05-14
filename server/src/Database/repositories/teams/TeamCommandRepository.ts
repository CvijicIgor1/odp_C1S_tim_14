import { RowDataPacket, ResultSetHeader } from "mysql2";
import { ITeamCommandRepository } from "../../../Domain/repositories/teams/ITeamCommandRepository";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";
import { Team } from "../../../Domain/models/Team";
import { TeamMemberRole } from "../../../Domain/enums/TeamMemberRole";

export class TeamCommandRepository implements ITeamCommandRepository
{
    public constructor(
        private readonly db: DbManager,
        private readonly logger: ILoggerService
    ) {}

    async create(newTeam: Team, ownerId: number): Promise<Team>
    {
        const res = await this.db.getWriteConnection();
        if (!res) return new Team();
        try
        {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `INSERT INTO teams (name, description, avatar) VALUES (?, ?, ?)`,
                [newTeam.name, newTeam.description, newTeam.avatar]
            );
            if (result.insertId === 0) return new Team();
            await res.conn.execute<ResultSetHeader>(
                `INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, 'owner')`,
                [result.insertId, ownerId]
            );
            return new Team(result.insertId, newTeam.name, newTeam.description, newTeam.avatar);
        }
        catch (err)
        {
            this.logger.error("TeamCommandRepository", "create failed", err);
            return new Team();
        }
        finally
        {
            res.conn.release();
        }
    }

    async update(teamId: number, inputTeam: Team): Promise<boolean>
    {
        const res = await this.db.getWriteConnection();
        if (!res) return false;
        try
        {
            const fields: string[] = [];
            const values: (string | number)[] = [];

            if (inputTeam.name !== "")        { fields.push("name = ?");        values.push(inputTeam.name); }
            if (inputTeam.description !== "") { fields.push("description = ?"); values.push(inputTeam.description); }
            if (inputTeam.avatar !== "")      { fields.push("avatar = ?");      values.push(inputTeam.avatar); }

            if (fields.length === 0) return false;
            values.push(teamId);

            const [result] = await res.conn.execute<ResultSetHeader>(
                `UPDATE teams SET ${fields.join(", ")} WHERE id = ?`, values
            );
            return result.affectedRows > 0;
        }
        catch (err)
        {
            this.logger.error("TeamCommandRepository", "update failed", err);
            return false;
        }
        finally
        {
            res.conn.release();
        }
    }

    async delete(teamId: number): Promise<boolean>
    {
        const res = await this.db.getWriteConnection();
        if (!res) return false;
        try
        {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `DELETE FROM teams WHERE id = ?`, [teamId]
            );
            return result.affectedRows > 0;
        }
        catch (err)
        {
            this.logger.error("TeamCommandRepository", "delete failed", err);
            return false;
        }
        finally
        {
            res.conn.release();
        }
    }

    async updateMemberRole(teamId: number, memberId: number, novaUloga: TeamMemberRole): Promise<boolean>
    {
        const res = await this.db.getWriteConnection();
        if (!res) return false;
        try
        {
            const [result] = await res.conn.execute<ResultSetHeader>(
                `UPDATE team_members SET role = ? WHERE team_id = ? AND user_id = ?`,
                [novaUloga, teamId, memberId]
            );
            return result.affectedRows > 0;
        }
        catch (err)
        {
            this.logger.error("TeamCommandRepository", "updateMemberRole failed", err);
            return false;
        }
        finally
        {
            res.conn.release();
        }
    }
}
