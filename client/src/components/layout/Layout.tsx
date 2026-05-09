import { type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/auth/useAuthHook";

// TODO: Update nav items to match your routes and roles
const userNav = [
  { to: "/dashboard", label: "Dashboard"},
  // add more user routes here
  { to: "/teams",     label: "Teams"},
];
const adminNav = [
  { to: "/admin",       label: "Dashboard"},
  { to: "/admin/users", label: "Users"},
  // add more admin routes here
  { to: "/admin/health", label: "DB Health"},
  { to: "/admin/tags",   label: "Tags"},
];

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const nav = user?.role === "admin" ? adminNav : userNav;

  return (
    <div className="flex min-h-screen bg-[#0d1f3c]">
      <aside className="w-56 shrink-0 border-r border-white/5 flex flex-col bg-[#1c1c1c]">
        {/* Logo */}
        <div className="px-7 h-18 flex items-center border-b border-white/5 gap-3">
          <div className="w-7 h-7 rounded-lg bg-white/10 text-white border border-white/20 flex items-center justify-center">
            <span className="text-white/50 text-xs"><i><b>NX</b></i></span>
          </div>
          <div>
            {/* TODO: Replace with your app name */}
            <p className="text-sm font-semibold text-white tracking-tight">NexusHub</p>
            <p className="text-[10px] text-white/25 uppercase tracking-widest">{user?.role}</p>
          </div>
        </div>

        {/* Nav */}
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

        {/* User */}
        <div className="border-t border-white/5 px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-7 h-7 rounded-full bg-white/6 border border-white/15 flex items-center justify-center overflow-hidden">
                {
                user?.avatar ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-xs text-white/40 font-medium">{user?.username?.[0]?.toUpperCase()}</span>
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
