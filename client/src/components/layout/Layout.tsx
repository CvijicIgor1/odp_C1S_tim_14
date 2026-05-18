import { type ReactNode, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/auth/useAuthHook";
import { usersApi } from "../../api_services/users/UsersAPIService";
import { UserRole } from "../../models/user/UserRole";

const userNav = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/teams",     label: "Teams" },
  { to: "/watched-projects", label: "Watched" },
  { to: "/my-tasks",  label: "My Tasks" },
  { to: "/profile",   label: "Profile" },
];
const adminNav = [
  { to: "/admin",           label: "Dashboard" },
  { to: "/admin/users",     label: "Users" },
  { to: "/admin/teams",     label: "Teams" },
  { to: "/admin/projects",  label: "Projects" },
  { to: "/admin/health",    label: "DB Health" },
  { to: "/admin/tags",      label: "Tags" },
  { to: "/admin/audit-log", label: "Audit Log" },
];

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const nav = user?.role === UserRole.ADMIN ? adminNav : userNav;
  const [avatar, setAvatar] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    usersApi.getById(user.id).then(res => {
      if (res.success && res.data?.avatar) {
        setAvatar(res.data.avatar);
      }
    });
  }, [user]);

  return (
    <div className="flex min-h-screen bg-[#0d1f3c]">
      <aside className="w-56 shrink-0 border-r border-white/5 flex flex-col bg-[#1c1c1c]">
        <div className="px-7 h-18 flex items-center border-b border-white/5 gap-3">
          <div className="w-7 h-7 rounded-lg bg-white/10 text-white border border-white/20 flex items-center justify-center">
            <span className="text-white/50 text-xs"><i><b>NX</b></i></span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white tracking-tight">NexusHub</p>
            <p className="text-[10px] text-white/25 uppercase tracking-widest">{user?.role}</p>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 flex flex-col gap-0.5">
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} end
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isActive
                    ? "bg-white/8 text-white border border-white/12"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/5 px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-7 h-7 rounded-full bg-white/6 border border-white/15 flex items-center justify-center overflow-hidden">
              {avatar
                ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-xs text-white/40 font-medium">{user?.username?.[0]?.toUpperCase()}</span>
              }
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white/70 truncate">{user?.username}</p>
            </div>
          </div>
          <button onClick={() => { logout(); navigate("/login"); }}
            className="text-xs text-red-400/50 hover:text-red-400 transition-colors w-full text-left cursor-pointer">
            Sign out →
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  );
}