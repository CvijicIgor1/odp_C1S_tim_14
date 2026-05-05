import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader, Empty, ErrorBox, SuccessBox, Spinner } from "../../components/ui/UI";
import { projectsApi } from "../../api_services/project/ProjectAPIService";
import { tasksApi } from "../../api_services/task/TaskAPIService";
import type { ProjectDto, TaskDto, TaskStatus, Priority } from "../../models/project/ProjectTypes";

const COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "done", label: "Done" },
];

const PRIORITIES: Priority[] = ["low", "medium", "high", "critical"];

const priorityColor: Record<Priority, string> = {
  low: "text-white/30",
  medium: "text-sky-400",
  high: "text-amber-400",
  critical: "text-red-400",
};

export default function ProjectKanbanPage() {
  const { id } = useParams<{ id: string }>();
  const pid = Number(id);
  const navigate = useNavigate();

  const [project, setProject] = useState<ProjectDto | null>(null);
  const [grouped, setGrouped] = useState<Record<TaskStatus, TaskDto[]>>({ todo: [], in_progress: [], done: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("medium");
  const [newDeadline, setNewDeadline] = useState("");
  const [newHours, setNewHours] = useState("0");
  const [creating, setCreating] = useState(false);

  const dragTask = useRef<TaskDto | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [pRes, tRes] = await Promise.all([
        projectsApi.getById(pid),
        tasksApi.getByProject(pid),
      ]);
      if (pRes.success && pRes.data) setProject(pRes.data);
      else setError(pRes.message);
      if (tRes.success && tRes.data) {
        setGrouped({
          todo: tRes.data.todo ?? [],
          in_progress: tRes.data.in_progress ?? [],
          done: tRes.data.done ?? [],
        });
      }
    } finally {
      setLoading(false);
    }
  }, [pid]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    setError("");
    setSuccess("");
    try {
      const res = await tasksApi.create(
        pid,
        newTitle.trim(),
        newDesc.trim(),
        "todo",
        newPriority,
        newDeadline || new Date().toISOString().slice(0, 10),
        Number(newHours) || 0,
      );
      if (res.success) {
        setNewTitle(""); setNewDesc(""); setNewDeadline(""); setNewHours("0");
        setNewPriority("medium"); setShowCreate(false);
        setSuccess("Task created");
        await load();
      } else {
        setError(res.message);
      }
    } finally {
      setCreating(false);
    }
  };

  const onDragStart = (task: TaskDto) => {
    dragTask.current = task;
    setDragging(task.id);
  };

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); };

  const onDrop = async (col: TaskStatus) => {
    const task = dragTask.current;
    dragTask.current = null;
    setDragging(null);
    if (!task || task.status === col) return;

    setGrouped(prev => {
      const next = { ...prev };
      next[task.status as TaskStatus] = next[task.status as TaskStatus].filter(t => t.id !== task.id);
      next[col] = [{ ...task, status: col }, ...next[col]];
      return next;
    });

    const res = await tasksApi.updateStatus(task.id, col);
    if (!res.success) {
      setError(res.message);
      await load();
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="PROJECT"
        title={project?.name ?? `Project ${pid}`}
        action={
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreate(v => !v)}
              className="text-xs px-4 py-2 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-colors"
            >
              {showCreate ? "Cancel" : "+ New task"}
            </button>
          </div>
        }
      />

      {project && (
        <div className="flex flex-wrap gap-4 text-xs text-white/30 font-mono">
          <span>Status: {project.status}</span>
          <span>Priority: {project.priority}</span>
          {project.deadline && <span>Deadline: {project.deadline.slice(0, 10)}</span>}
          <span>{project.watcherCount} watchers</span>
        </div>
      )}

      {error && <ErrorBox message={error} />}
      {success && <SuccessBox message={success} />}

      {/* Create task form */}
      {showCreate && (
        <section className="bg-[#0d0d0d] border border-white/5 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold text-sm">New task</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Task title"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="md:col-span-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20"
            />
            <select
              value={newPriority}
              onChange={e => setNewPriority(e.target.value as Priority)}
              className="bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-3 focus:outline-none"
            >
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <input
              type="date"
              value={newDeadline}
              onChange={e => setNewDeadline(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20"
            />
            <input
              type="number"
              min={0}
              placeholder="Estimated hours"
              value={newHours}
              onChange={e => setNewHours(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20"
            />
            <textarea
              placeholder="Description"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              className="md:col-span-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white h-20 focus:outline-none focus:border-white/20"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={creating || !newTitle.trim()}
            className="px-8 py-3 bg-white text-black text-sm font-bold rounded-xl hover:bg-white/90 transition-colors disabled:opacity-40"
          >
            {creating ? <Spinner size={14} /> : "Create"}
          </button>
        </section>
      )}

      {loading && <div className="flex justify-center py-12"><Spinner size={24} /></div>}

      {/* Kanban columns */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map(col => (
            <div
              key={col.key}
              onDragOver={onDragOver}
              onDrop={() => onDrop(col.key)}
              className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 min-h-[300px] flex flex-col gap-3"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-mono uppercase tracking-widest text-white/40">{col.label}</h3>
                <span className="text-[10px] text-white/20">{grouped[col.key].length}</span>
              </div>

              {grouped[col.key].length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                  <Empty message="Empty" />
                </div>
              )}

              {grouped[col.key].map(task => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => onDragStart(task)}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                  className={`bg-[#0d0d0d] border rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-white/15 transition-all space-y-2 ${dragging === task.id ? "opacity-40 border-white/20" : "border-white/8"
                    }`}
                >
                  <p className="text-white/80 text-sm leading-snug">{task.title}</p>
                  <div className="flex items-center gap-3 text-[10px] font-mono">
                    <span className={priorityColor[task.priority as Priority] ?? "text-white/30"}>{task.priority}</span>
                    {task.deadline && <span className="text-white/20">{task.deadline.slice(0, 10)}</span>}
                    {task.estimatedHours > 0 && (
                      <span className="text-white/20">{task.estimatedHours}h</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
