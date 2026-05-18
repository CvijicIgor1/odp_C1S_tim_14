import { type ReactNode, useRef, useState } from "react";
import { UserRole } from "../../models/user/UserRole";

export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-spin inline-block" style={{ color: "rgba(255,255,255,0.4)" }}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40 60" />
    </svg>
  );
}

export function Empty({ message = "No data" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-12 h-12 rounded-full bg-white/3 border border-white/6 flex items-center justify-center">
        <span className="text-white/20 text-lg">◦</span>
      </div>
      <p className="text-sm text-white/25">{message}</p>
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="border border-red-500/20 bg-red-500/10 text-red-300 text-sm px-4 py-3 rounded-xl">
      {message}
    </div>
  );
}

export function SuccessBox({ message }: { message: string }) {
  return (
    <div className="border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 text-sm px-4 py-3 rounded-xl">
      {message}
    </div>
  );
}

// TODO: Add StatusBadge variants for your domain entity statuses
export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    // order statuses
    pending:    "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    active:     "bg-sky-500/10 text-sky-400 border-sky-500/20",
    completed:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    cancelled:  "bg-red-500/10 text-red-400 border-red-500/20",
    // project statuses
    planning:   "bg-violet-500/10 text-violet-400 border-violet-500/20",
    on_hold:    "bg-orange-500/10 text-orange-400 border-orange-500/20",
    // task statuses
    todo:        "bg-slate-500/10 text-slate-400 border-slate-500/20",
    in_progress: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    done:        "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };
  const dotStyles: Record<string, string> = {
    pending:     "bg-yellow-400",
    active:      "bg-sky-400 animate-pulse",
    completed:   "bg-emerald-400",
    cancelled:   "bg-red-400",
    planning:    "bg-violet-400",
    on_hold:     "bg-orange-400",
    todo:        "bg-slate-400",
    in_progress: "bg-sky-400 animate-pulse",
    done:        "bg-emerald-400",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${styles[status] ?? "bg-white/5 text-white/40 border-white/10"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[status] ?? "bg-white/30"}`} />
      {status}
    </span>
  );
}

export function NodeBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    healthy:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    degraded: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    unreachable: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${styles[status] ?? "bg-white/5 text-white/40 border-white/10"}`}>
      {status}
    </span>
  );
}

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${
      role === UserRole.ADMIN ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-white/5 text-white/40 border-white/10"
    }`}>{role}</span>
  );
}

export function Pagination({ page, total, pageSize, onChange }: { page: number; total: number; pageSize: number; onChange: (p: number) => void }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center gap-3 mt-5 text-xs text-white/30">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)}
        className="px-3 py-1.5 border border-white/10 rounded-lg hover:border-white/20 disabled:opacity-30 transition-colors">←</button>
      <span className="font-mono">{page} / {totalPages}</span>
      <button disabled={page >= totalPages} onClick={() => onChange(page + 1)}
        className="px-3 py-1.5 border border-white/10 rounded-lg hover:border-white/20 disabled:opacity-30 transition-colors">→</button>
      <span className="text-white/20">{total} total</span>
    </div>
  );
}

export function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white/3 border border-white/6 rounded-2xl p-5 flex flex-col gap-2 hover:border-white/10 transition-colors">
      <p className="text-xs text-white/30 uppercase tracking-widest font-mono">{label}</p>
      <p className={`text-2xl font-semibold tracking-tight ${color ?? "text-white"}`}>{value}</p>
      {sub && <p className="text-xs text-white/25">{sub}</p>}
    </div>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="bg-[#2b2626] border border-white/8 rounded-2xl overflow-hidden">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function TableHead({ columns }: { columns: string[] }) {
  return (
    <thead>
      <tr className="border-b border-white/12">
        {columns.map((c) => (
          <th key={c} className="text-left px-5 py-3.5 text-xs text-white/60 font-mono uppercase tracking-wider">{c}</th>
        ))}
      </tr>
    </thead>
  );
}

export function PageHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <p className="text-xs text-white/25 font-mono uppercase tracking-widest mb-1">{eyebrow}</p>
        <h1 className="text-xl font-semibold text-white tracking-tight">{title}</h1>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export interface ComboboxOption {
  value: string;
  label: string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Search...",
}: {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = query.trim() === ""
    ? options
    : options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));

  const handleSelect = (opt: ComboboxOption) => {
    onChange(opt.value);
    setQuery("");
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onChange("");
    setOpen(true);
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setOpen(false);
      setQuery("");
    }
  };

  const displayValue = open ? query : (selected?.label ?? "");

  return (
    <div ref={containerRef} className="relative" onBlur={handleBlur}>
      <input
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20 w-48"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden shadow-xl max-h-48 overflow-y-auto">
          {filtered.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                onMouseDown={() => handleSelect(opt)}
                className="w-full text-left px-3 py-2 text-sm text-white/70 hover:bg-white/8 hover:text-white transition-colors"
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && filtered.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white/30">
          No members found
        </div>
      )}
    </div>
  );
}
