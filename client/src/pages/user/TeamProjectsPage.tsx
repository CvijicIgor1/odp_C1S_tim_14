import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader, Empty, ErrorBox, SuccessBox, Spinner, StatusBadge, Pagination } from "../../components/ui/UI";
import { projectsApi } from "../../api_services/project/ProjectAPIService";
import { tagsApi } from "../../api_services/tag/TagAPIService";
import type { ProjectDto, ProjectStatus, Priority, TagDto } from "../../models/project/ProjectTypes";

const PAGE_SIZE = 10;

const STATUSES: ProjectStatus[] = ["planning", "active", "on_hold", "completed"];
const PRIORITIES: Priority[] = ["low", "medium", "high", "critical"];

export default function TeamProjectsPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const tid = Number(teamId);
  const navigate = useNavigate();

  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("planning");
  const [priority, setPriority] = useState<Priority>("medium");
  const [deadline, setDeadline] = useState("");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [allTags, setAllTags] = useState<TagDto[]>([]);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const filters: Record<string, string> = {};
      if (filterStatus) filters.status = filterStatus;
      if (filterPriority) filters.priority = filterPriority;
      const res = await projectsApi.getTeamProjects(tid, page, PAGE_SIZE, filters);
      if (res.success) {
        setProjects(res.data?.items ?? []);
        setTotal(res.data?.total ?? 0);
      } else {
        setError(res.message);
      }
    } finally {
      setLoading(false);
    }
  }, [tid, page, filterStatus, filterPriority]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    tagsApi.getAll(1, 100).then(res => {
      if (res.success) setAllTags(res.data?.items ?? []);
    });
  }, []);

  const handleCreate = async () => {
    if (!name.trim() || !desc.trim()) return;
    setCreating(true);
    setError("");
    setSuccess("");
    try {
      const res = await projectsApi.create(
        tid,
        name.trim(),
        desc.trim(),
        status,
        priority,
        deadline || null,
        selectedTags,
      );
      if (res.success) {
        setName(""); setDesc(""); setDeadline("");
        setStatus("planning"); setPriority("medium"); setSelectedTags([]);
        setShowCreate(false);
        setSuccess("Project created");
        await load();
      } else {
        setError(res.message);
      }
    } finally {
      setCreating(false);
    }
  };

  const toggleTag = (id: number) =>
    setSelectedTags(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const applyFilter = (s: string, p: string) => {
    setFilterStatus(s);
    setFilterPriority(p);
    setPage(1);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`Team ${tid}`}
        title="Projects"
        action={
          <button
            onClick={() => setShowCreate(v => !v)}
            className="text-xs px-4 py-2 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-colors"
          >
            {showCreate ? "Cancel" : "+ New project"}
          </button>
        }
      />

      {error && <ErrorBox message={error} />}
      {success && <SuccessBox message={success} />}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={filterStatus}
          onChange={e => applyFilter(e.target.value, filterPriority)}
          className="bg-white/5 border border-white/10 text-white/60 text-xs rounded-xl px-3 py-2 focus:outline-none"
        >
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={filterPriority}
          onChange={e => applyFilter(filterStatus, e.target.value)}
          className="bg-white/5 border border-white/10 text-white/60 text-xs rounded-xl px-3 py-2 focus:outline-none"
        >
          <option value="">All priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {(filterStatus || filterPriority) && (
          <button
            onClick={() => applyFilter("", "")}
            className="text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <section className="bg-[#0d0d0d] border border-white/5 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold text-sm">New project</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Project name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20"
            />
            <input
              type="date"
              placeholder="Deadline"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20"
            />
            <select
              value={status}
              onChange={e => setStatus(e.target.value as ProjectStatus)}
              className="bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-3 focus:outline-none"
            >
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as Priority)}
              className="bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-3 focus:outline-none"
            >
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <textarea
              placeholder="Description"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              className="md:col-span-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white h-20 focus:outline-none focus:border-white/20"
            />
          </div>
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {allTags.map(t => (
                <button
                  key={t.id}
                  onClick={() => toggleTag(t.id)}
                  className={`text-xs px-3 py-1 rounded-lg border transition-colors ${selectedTags.includes(t.id)
                      ? "bg-white/20 border-white/30 text-white"
                      : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
                    }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={handleCreate}
            disabled={creating || !name.trim() || !desc.trim()}
            className="px-8 py-3 bg-white text-black text-sm font-bold rounded-xl hover:bg-white/90 transition-colors disabled:opacity-40"
          >
            {creating ? <Spinner size={14} /> : "Create"}
          </button>
        </section>
      )}

      {/* Project list */}
      {loading && <div className="flex justify-center py-12"><Spinner size={24} /></div>}

      {!loading && projects.length === 0 && (
        <Empty message="No projects found" />
      )}

      {!loading && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map(p => (
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
                <span>{p.watcherCount} watchers</span>
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

      <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
    </div>
  );
}
