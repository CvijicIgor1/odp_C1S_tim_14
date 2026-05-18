import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Empty, ErrorBox, Spinner, StatCard, StatusBadge } from "../../components/ui/UI";
import { useAuth } from "../../hooks/auth/useAuthHook";
import { projectsApi } from "../../api_services/project/ProjectAPIService";
import { teamsApi } from "../../api_services/team/TeamAPIService";
import { tasksApi } from "../../api_services/task/TaskAPIService";
import type { ProjectDto } from "../../models/project/ProjectTypes";
import type { TaskDto } from "../../models/project/ProjectTypes";
import type { TeamDto } from "../../models/team/TeamTypes";

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [watched, setWatched] = useState<ProjectDto[]>([]);
  const [teams, setTeams] = useState<TeamDto[]>([]);
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [watchedTotal, setWatchedTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let nextError = "";
      const [watchedRes, teamsRes, tasksRes] = await Promise.all([
        projectsApi.getWatched(1, 6),
        teamsApi.getAll(1, 50),
        tasksApi.getMyTasks(),
      ]);

      if (watchedRes.success) {
        setWatched(watchedRes.data?.items ?? []);
        setWatchedTotal(watchedRes.data?.total ?? 0);
      } else {
        nextError = watchedRes.message;
      }

      if (teamsRes.success) {
        setTeams(teamsRes.data?.items ?? []);
      } else if (!nextError) {
        nextError = teamsRes.message;
      }

      if (tasksRes.success && tasksRes.data) {
        const sortedTasks = [...tasksRes.data].sort((a, b) => {
          const priorityOrder: Record<TaskDto["priority"], number> = { critical: 0, high: 1, medium: 2, low: 3 };
          const deadlineDiff = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
          if (deadlineDiff !== 0) return deadlineDiff;
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
        setTasks(sortedTasks.slice(0, 5));
      } else if (!nextError) {
        nextError = tasksRes.message;
      }

      if (nextError) setError(nextError);
    } finally {
      setLoading(false);
    }
  }, []);

  const watchedTags = Array.from(new Set(watched.flatMap((project) => project.tags.map((tag) => tag.name)))).sort();

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Overview" title={`Welcome, ${user?.username}`} />

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Teams" value={teams.length} sub="teams you belong to" />
        <StatCard label="Watched projects" value={watchedTotal} sub="projects you follow" />
        <StatCard label="My tasks" value={tasks.length} sub="nearest assigned tasks" />
        <button
          onClick={() => navigate("/teams")}
          className="bg-white/3 border border-white/6 rounded-2xl p-5 flex flex-col gap-2 hover:border-white/10 transition-colors text-left"
        >
          <p className="text-xs text-white/30 uppercase tracking-widest font-mono">My Teams</p>
          <p className="text-xl font-semibold tracking-tight text-white">→</p>
          <p className="text-xs text-white/25">View & manage your teams</p>
        </button>
        <button
          onClick={() => navigate("/watched-projects")}
          className="bg-white/3 border border-white/6 rounded-2xl p-5 flex flex-col gap-2 hover:border-white/10 transition-colors text-left"
        >
          <p className="text-xs text-white/30 uppercase tracking-widest font-mono">Watched</p>
          <p className="text-xl font-semibold tracking-tight text-white">→</p>
          <p className="text-xs text-white/25">Open all watched projects</p>
        </button>
      </div>

      {error && <ErrorBox message={error} />}

      {watchedTags.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-mono uppercase tracking-widest text-white/30">Watched Project Tags</h2>
          <div className="flex flex-wrap gap-2">
            {watchedTags.map((tag) => (
              <span key={tag} className="text-[10px] px-2.5 py-1 bg-white/5 border border-white/10 text-white/40 rounded-lg">
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-widest text-white/30">My Teams</h2>
          <button onClick={() => navigate("/teams")} className="text-[11px] text-white/35 hover:text-white/60 transition-colors">
            View all
          </button>
        </div>

        {!loading && teams.length === 0 && <Empty message="You are not part of any teams yet" />}

        {!loading && teams.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.slice(0, 4).map((team) => (
              <button
                key={team.id}
                onClick={() => navigate(`/teams/${team.id}/projects`)}
                className="text-left bg-[#0d0d0d] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all space-y-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-white font-medium text-sm">{team.name}</h3>
                  <span className="text-[10px] px-2 py-0.5 bg-white/5 border border-white/10 text-white/35 rounded">
                    {team.currentUserRole}
                  </span>
                </div>
                <p className="text-white/40 text-xs line-clamp-2">{team.description}</p>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Watched projects */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-widest text-white/30">Watched Projects</h2>
          <button onClick={() => navigate("/watched-projects")} className="text-[11px] text-white/35 hover:text-white/60 transition-colors">
            View all
          </button>
        </div>

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

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-widest text-white/30">Assigned Tasks</h2>
          <button onClick={() => navigate("/my-tasks")} className="text-[11px] text-white/35 hover:text-white/60 transition-colors">
            View all
          </button>
        </div>

        {!loading && tasks.length === 0 && (
          <Empty message="You have no assigned tasks" />
        )}

        {!loading && tasks.length > 0 && (
          <div className="space-y-3">
            {tasks.map((task) => (
              <button
                key={task.id}
                onClick={() => navigate(`/tasks/${task.id}`)}
                className="w-full text-left bg-[#0d0d0d] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-white font-medium text-sm leading-tight">{task.title}</h3>
                  <StatusBadge status={task.status} />
                </div>
                <p className="text-white/40 text-xs line-clamp-2">{task.description}</p>
                <div className="flex items-center gap-5 text-[10px] text-white/25 font-mono">
                  <span>Priority: <span className="text-white/40">{task.priority}</span></span>
                  {task.deadline && <span>Deadline: <span className="text-white/40">{task.deadline.slice(0, 10)}</span></span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
