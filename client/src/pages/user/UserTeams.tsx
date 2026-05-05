import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Empty, ErrorBox, SuccessBox, Spinner } from "../../components/ui/UI";
import { useAuth } from "../../hooks/auth/useAuthHook";
import { teamsApi } from "../../api_services/team/TeamAPIService";
import type { TeamDto } from "../../models/team/TeamTypes";

export default function UserTeams() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [teams, setTeams] = useState<TeamDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newAvatar, setNewAvatar] = useState("");
  const [creating, setCreating] = useState(false);

  const [addInputs, setAddInputs] = useState<Record<number, string>>({});
  const [addingTo, setAddingTo] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await teamsApi.getAll();
      if (res.success) setTeams(res.data?.items ?? []);
      else setError(res.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!newName.trim() || !newDesc.trim() || !newAvatar.trim()) return;
    setCreating(true);
    setError("");
    setSuccess("");
    try {
      const res = await teamsApi.create(newName.trim(), newDesc.trim(), newAvatar.trim());
      if (res.success) {
        setNewName(""); setNewDesc(""); setNewAvatar("");
        setSuccess("Team created successfully");
        await load();
      } else {
        setError(res.message);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    setError(""); setSuccess("");
    const res = await teamsApi.delete(id);
    if (res.success) { setSuccess("Team deleted"); await load(); }
    else setError(res.message);
  };

  const handleAddMember = async (teamId: number) => {
    const username = (addInputs[teamId] ?? "").trim();
    if (!username) return;
    setAddingTo(teamId);
    setError(""); setSuccess("");
    try {
      const res = await teamsApi.addMember(teamId, username);
      if (res.success) {
        setAddInputs(prev => ({ ...prev, [teamId]: "" }));
        setSuccess("Member added");
      } else {
        setError(res.message);
      }
    } finally {
      setAddingTo(null);
    }
  };

  const handleRemoveMember = async (teamId: number, userId: number) => {
    setError(""); setSuccess("");
    const res = await teamsApi.removeMember(teamId, userId);
    if (res.success) { setSuccess("Member removed"); await load(); }
    else setError(res.message);
  };

  const isOwner = (team: TeamDto) => {
    return true;
  };

  return (
    <div className="space-y-12">
      {/* Header sekcija */}
      <PageHeader eyebrow="MANAGEMENT" title={`User: ${user?.username}`} />

      {/* 1. SEKCIJA: KREIRANJE TIMA */}
      {error && <ErrorBox message={error} />}
      {success && <SuccessBox message={success} />}

      <section className="bg-[#0d0d0d] border border-white/5 rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-4">Create a team</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            type="text" 
            placeholder="Team name" 
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20"
          />
          <input 
            type="text" 
            placeholder="image URL (promenicu ovo u dugme)" 
            value={newAvatar}
            onChange={e => setNewAvatar(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20"
          />
          <textarea 
            placeholder="Description" 
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            className="md:col-span-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white h-24 focus:outline-none focus:border-white/20"
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newName.trim() || !newDesc.trim() || !newAvatar.trim()}
            className="md:w-max px-8 py-3 bg-white text-black text-sm font-bold rounded-xl hover:bg-white/90 transition-colors disabled:opacity-40"
          >
            {creating ? <Spinner size={14} /> : "Done"}
          </button>
        </div>
      </section>

      {/* 2. SEKCIJA: PREGLED TIMOVA (DASHBOARD) */}
      <section>
        <h2 className="text-white/50 text-xs uppercase tracking-widest mb-6">My teams</h2>

        {loading && (
          <div className="flex justify-center py-12"><Spinner size={24} /></div>
        )}

        {!loading && teams.length === 0 && (
          <Empty message="No teams yet" />
        )}

        {!loading && teams.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teams.map(team => (
              <div key={team.id} className="group bg-[#0d0d0d] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                      {team.avatar
                        ? <img src={team.avatar} alt={team.name} className="w-full h-full object-cover rounded-xl" />
                        : <span className="text-xl">⌬</span>
                      }
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{team.name}</h3>
                      <p className="text-white/30 text-xs">ID: {team.id}</p>
                    </div>
                  </div>
                  <span className="bg-white/5 text-[10px] text-white/40 px-2 py-1 rounded border border-white/10 uppercase tracking-tighter">
                    Member
                  </span>
                </div>

                <p className="text-white/50 text-sm mb-6 line-clamp-2">{team.description}</p>

                {/* Dodavanje člana */}
                <div className="border-t border-white/5 pt-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add member by username..."
                      value={addInputs[team.id] ?? ""}
                      onChange={e => setAddInputs(prev => ({ ...prev, [team.id]: e.target.value }))}
                      className="flex-1 bg-white/5 border border-transparent rounded-lg px-3 py-2 text-xs text-white focus:border-white/10 outline-none"
                    />
                    <button
                      onClick={() => handleAddMember(team.id)}
                      disabled={addingTo === team.id || !(addInputs[team.id] ?? "").trim()}
                      className="text-xs text-white bg-white/10 px-3 py-2 rounded-lg hover:bg-white/20 disabled:opacity-40"
                    >
                      {addingTo === team.id ? <Spinner size={12} /> : "Add"}
                    </button>
                  </div>
                </div>

                {/* Opasne akcije */}
                <div className="flex gap-4 mt-6 pt-4 border-t border-white/5">
                  <button
                    onClick={() => navigate(`/teams/${team.id}/projects`)}
                    className="text-[11px] text-white/40 hover:text-white transition-colors"
                  >
                    View projects
                  </button>
                  <button
                    onClick={() => handleDelete(team.id)}
                    className="text-[11px] text-red-500/40 hover:text-red-500 transition-colors"
                  >
                    Delete team (cascade)
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}