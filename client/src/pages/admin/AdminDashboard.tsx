import { useCallback, useEffect, useState } from "react";
import { ErrorBox, PageHeader, Spinner, StatCard } from "../../components/ui/UI";
import { useNavigate } from "react-router-dom";
import { usersApi } from "../../api_services/users/UsersAPIService";
import { teamsApi } from "../../api_services/team/TeamAPIService";
import { projectsApi } from "../../api_services/project/ProjectAPIService";
import { healthApi } from "../../api_services/health/HealthAPIService";

const cards = [
  { label: "Users",     path: "/admin/users",      icon: "👥", desc: "Manage user accounts and roles"},
  { label: "Tags",      path: "/admin/tags",       icon: "🏷️", desc: "Create and delete task tags" },
  { label: "Audit Log", path: "/admin/audit-log",  icon: "📋", desc: "View system activity history" },
  { label: "Health",    path: "/admin/health",     icon: "📈", desc: "Monitor database node status" },
  { label: "Teams",     path: "/admin/teams",      icon: "🏢",  desc: "View all registered teams" },
  { label: "Projects",  path: "/admin/projects",   icon: "🗂️",  desc: "View all registered projects" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usersCount, setUsersCount] = useState(0);
  const [teamsCount, setTeamsCount] = useState(0);
  const [projectsCount, setProjectsCount] = useState(0);
  const [healthyNodes, setHealthyNodes] = useState(0);
  const [degradedNodes, setDegradedNodes] = useState(0);
  const [offlineNodes, setOfflineNodes] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let nextError = "";
      const [usersRes, teamsRes, projectsRes, healthRes] = await Promise.all([
        usersApi.getAll(),
        teamsApi.getAllAsAdmin(1, 200),
        projectsApi.getAllAsAdmin(1, 200),
        healthApi.getDbHealth(),
      ]);

      if (usersRes.success) setUsersCount(usersRes.data?.length ?? 0);
      else nextError = usersRes.message;

      if (teamsRes.success) setTeamsCount(teamsRes.data?.total ?? 0);
      else if (!nextError) nextError = teamsRes.message;

      if (projectsRes.success) setProjectsCount(projectsRes.data?.total ?? 0);
      else if (!nextError) nextError = projectsRes.message;

      if (healthRes.success) {
        const nodes = healthRes.data ?? [];
        setHealthyNodes(nodes.filter((node) => node.status === "healthy").length);
        setDegradedNodes(nodes.filter((node) => node.status === "degraded").length);
        setOfflineNodes(nodes.filter((node) => node.status === "unreachable").length);
      } else if (!nextError) {
        nextError = healthRes.message;
      }

      if (nextError) setError(nextError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-col justify-center min-h-[32vh]">
      <PageHeader eyebrow="Admin" title="Dashboard" />
      {error && <ErrorBox message={error} />}

      {loading ? (
        <div className="flex justify-center py-10"><Spinner size={24} /></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
          <StatCard label="Users" value={usersCount} />
          <StatCard label="Teams" value={teamsCount} />
          <StatCard label="Projects" value={projectsCount} />
          <StatCard label="DB Healthy" value={healthyNodes} color="text-emerald-400" />
          <StatCard label="DB Degraded" value={degradedNodes} color="text-yellow-400" />
          <StatCard label="DB Offline" value={offlineNodes} color="text-red-400" />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {cards.map((c) => (
          <button
            key={c.path}
            onClick={() => navigate(c.path)}
            className="text-left bg-[#1c1c1c] border border-white/10 rounded-2xl p-5 hover:bg-[#252525] hover:border-white/15 transition-colors cursor-pointer">
            <div className="text-2xl mb-3">{c.icon}</div>
            <div className="text-white font-medium text-sm mb-1">{c.label}</div>
            <div className="text-white/40">{c.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}