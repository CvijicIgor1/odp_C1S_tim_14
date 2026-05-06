import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Empty, ErrorBox, Spinner, StatCard, StatusBadge } from "../../components/ui/UI";
import { useAuth } from "../../hooks/auth/useAuthHook";
import { projectsApi } from "../../api_services/project/ProjectAPIService";
import type { ProjectDto } from "../../models/project/ProjectTypes";

// TODO: Replace with your domain-specific user dashboard content
export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [watched, setWatched] = useState<ProjectDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await projectsApi.getWatched(1, 10);
      if (res.success) {
        setWatched(res.data?.items ?? []);
        setTotal(res.data?.total ?? 0);
      } else {
        setError(res.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Overview" title={`Welcome, ${user?.username}`} />

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Watched projects" value={total} sub="projects you follow" />
        <button
          onClick={() => navigate("/teams")}
          className="bg-white/3 border border-white/6 rounded-2xl p-5 flex flex-col gap-2 hover:border-white/10 transition-colors text-left"
        >
          <p className="text-xs text-white/30 uppercase tracking-widest font-mono">My Teams</p>
          <p className="text-xl font-semibold tracking-tight text-white">→</p>
          <p className="text-xs text-white/25">View & manage your teams</p>
        </button>
      </div>

      {error && <ErrorBox message={error} />}

      {/* Watched projects */}
      <section className="space-y-4">
        <h2 className="text-xs font-mono uppercase tracking-widest text-white/30">Watched Projects</h2>

        {loading && <div className="flex justify-center py-8"><Spinner size={20} /></div>}

        {!loading && watched.length === 0 && (
          <Empty message="You are not watching any projects yet" />
        )}

        {!loading && watched.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {watched.map(p => (
              <button
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                className="text-left bg-[#0d0d0d] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-white font-medium text-sm leading-tight">{p.name}</h3>
                  <StatusBadge status={p.status} />
                </div>
                <p className="text-white/40 text-xs line-clamp-2">{p.description}</p>
                <div className="flex items-center gap-3 text-[10px] text-white/25 font-mono">
                  <span>Priority: {p.priority}</span>
                  {p.deadline && <span>Due: {p.deadline.slice(0, 10)}</span>}
                </div>
                {p.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {p.tags.map(t => (
                      <span key={t.id} className="text-[10px] px-2 py-0.5 bg-white/5 border border-white/10 text-white/40 rounded">
                        {t.name}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
