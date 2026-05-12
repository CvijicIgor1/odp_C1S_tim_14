import { PageHeader } from "../../components/ui/UI";
import { useNavigate } from "react-router-dom";

const cards = [
  { label: "Users",     path: "/admin/users",      icon: "👥", desc: "Manage user accounts and roles"},
  { label: "Tags",      path: "/admin/tags",       icon: "🏷️", desc: "Create and delete task tags" },
  { label: "Audit Log", path: "/admin/audit-log",  icon: "📋", desc: "View system activity history" },
  { label: "Health",    path: "/admin/health",     icon: "📈 ", desc: "Monitor database node status" },
  { label: "Teams",     path: "/admin/teams",     icon: "◎",  desc: "View all registered teams" },
  { label: "Projects",  path: "/admin/projects",  icon: "◫",  desc: "View all registered projects" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col justify-center min-h-[32vh]">
      <PageHeader eyebrow="Admin" title="Dashboard" />
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