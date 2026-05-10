import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <span className="text-white font-semibold tracking-tight text-sm">NexusHub</span>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-xs text-white/50 hover:text-white transition-colors">Sign in</Link>
          <Link to="/register" className="text-xs px-4 py-2 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-colors">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-8 py-24">
        <div className="space-y-4 max-w-2xl">
          <p className="text-xs font-mono uppercase tracking-widest text-white/25">Project management platform</p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
            Manage teams, projects,<br />and tasks — in one place.
          </h1>
          <p className="text-white/40 text-base max-w-lg mx-auto leading-relaxed">
            NexusHub brings together team collaboration, project tracking, and task management with a clean, fast interface built for real work.
          </p>
        </div>

        <div className="flex gap-3">
          <Link to="/register" className="px-6 py-3 bg-white text-black text-sm font-bold rounded-xl hover:bg-white/90 transition-colors">
            Create account
          </Link>
          <Link to="/login" className="px-6 py-3 border border-white/10 text-white/60 text-sm rounded-xl hover:border-white/20 hover:text-white/80 transition-colors">
            Sign in
          </Link>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 w-full max-w-3xl">
          {[
            { icon: "⌬", title: "Teams", desc: "Create teams, manage members and roles with owner-level access control." },
            { icon: "◈", title: "Projects", desc: "Track projects with statuses, priorities, deadlines, tags, and watchers." },
            { icon: "◇", title: "Kanban Tasks", desc: "Drag-and-drop kanban boards with assignees, comments, and status tracking." },
          ].map(f => (
            <div key={f.title} className="bg-white/3 border border-white/6 rounded-2xl p-6 text-left space-y-3">
              <span className="text-2xl text-white/30">{f.icon}</span>
              <h3 className="text-white font-medium text-sm">{f.title}</h3>
              <p className="text-white/35 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="px-8 py-5 border-t border-white/5 text-center">
        <p className="text-xs text-white/15 font-mono">NexusHub — Team 14</p>
      </footer>
    </div>
  );
}
