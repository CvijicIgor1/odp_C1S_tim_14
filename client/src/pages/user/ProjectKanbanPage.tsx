import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader, Empty, ErrorBox, SuccessBox, Spinner } from "../../components/ui/UI";
import { projectsApi } from "../../api_services/project/ProjectAPIService";
import { tasksApi } from "../../api_services/task/TaskAPIService";
import { tagsApi } from "../../api_services/tag/TagAPIService";
import { teamsApi } from "../../api_services/team/TeamAPIService";
import { useAuth } from "../../hooks/auth/useAuthHook";
import { UserRole } from "../../models/user/UserRole";
import type { ProjectDto, TaskDto, TaskStatus, Priority, TagDto } from "../../models/project/ProjectTypes";
import { validateEstimatedHours, validateFutureDate, validateProjectDescription, validateProjectName, validateTaskDescription, validateTaskTitle } from "../../helpers/validation";

const COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "done", label: "Done" },
];

const STATUSES: import("../../models/project/ProjectTypes").ProjectStatus[] = ["planning", "active", "on_hold", "completed"];

const PRIORITIES: Priority[] = ["low", "medium", "high", "critical"];

const priorityColor: Record<Priority, string> = {
  low: "text-white/30",
  medium: "text-sky-400",
  high: "text-amber-400",
  critical: "text-red-400",
};

export default function ProjectKanbanPage() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const pid = Number(id);
  const navigate = useNavigate();

  const [project, setProject] = useState<ProjectDto | null>(null);
  const [grouped, setGrouped] = useState<Record<TaskStatus, TaskDto[]>>({ todo: [], in_progress: [], done: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isWatching, setIsWatching] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);
  const [canManageProject, setCanManageProject] = useState(false);
  const canModifyTasks = user?.role !== UserRole.ADMIN;

  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [saving, setSaving] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("medium");
  const [newDeadline, setNewDeadline] = useState("");
  const [newHours, setNewHours] = useState("0");
  const [creating, setCreating] = useState(false);

  const [allTags, setAllTags] = useState<TagDto[]>([]);
  const [tagLoading, setTagLoading] = useState(false);

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
      if (pRes.success && pRes.data) {
        setProject(pRes.data);
        const teamRes = await teamsApi.getById(pRes.data.teamId);
        if (teamRes.success && teamRes.data) {
          setCanManageProject(teamRes.data.currentUserRole === "owner" || user?.role === UserRole.ADMIN);
        } else {
          setCanManageProject(user?.role === UserRole.ADMIN);
        }
        const watchedRes = await projectsApi.getWatched(1, 1000);
        if (watchedRes.success && watchedRes.data) {
          setIsWatching(watchedRes.data.items.some(p => p.id === pid));
        }
      } else {
        setError(pRes.message);
      }
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
  }, [pid, user?.role]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    tagsApi.getAll(1, 100).then(res => {
      if (res.success) setAllTags(res.data?.items ?? []);
    });
  }, []);

  const handleWatch = async () => {
    setWatchLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = isWatching
        ? await projectsApi.unwatch(pid)
        : await projectsApi.watch(pid);
      if (res.success) {
        setIsWatching(!isWatching);
        setSuccess(isWatching ? "Stopped watching project" : "Now watching project");
        const pRes = await projectsApi.getById(pid);
        if (pRes.success && pRes.data) setProject(pRes.data);
      } else {
        setError(res.message);
      }
    } finally {
      setWatchLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    const nameError = validateProjectName(editName);
    if (nameError) { setError(nameError); return; }
    const descriptionError = validateProjectDescription(editDesc);
    if (descriptionError) { setError(descriptionError); return; }
    if (editDeadline) {
      const deadlineError = validateFutureDate(editDeadline, "Deadline");
      if (deadlineError) { setError(deadlineError); return; }
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await projectsApi.update(pid, {
        name: editName.trim(),
        description: editDesc.trim(),
        status: editStatus as import("../../models/project/ProjectTypes").ProjectStatus,
        priority: editPriority as import("../../models/project/ProjectTypes").Priority,
        deadline: editDeadline,
      });
      if (res.success) {
        setSuccess("Project updated");
        setShowEdit(false);
        await load();
      } else {
        setError(res.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    const titleError = validateTaskTitle(newTitle);
    if (titleError) { setError(titleError); return; }
    const descriptionError = validateTaskDescription(newDesc);
    if (descriptionError) { setError(descriptionError); return; }
    const deadlineError = validateFutureDate(newDeadline, "Deadline");
    if (deadlineError) { setError(deadlineError); return; }
    const hoursError = validateEstimatedHours(Number(newHours));
    if (hoursError) { setError(hoursError); return; }
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
        newDeadline,
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

  const handleAddTag = async (tagId: number) => {
    if (!project) return;
    setTagLoading(true);
    setError("");
    try {
      const res = await projectsApi.addTag(pid, tagId);
      if (res.success) {
        const tag = allTags.find(t => t.id === tagId);
        if (tag) setProject(prev => prev ? { ...prev, tags: [...prev.tags, tag] } : prev);
      } else {
        setError(res.message);
      }
    } finally {
      setTagLoading(false);
    }
  };

  const handleRemoveTag = async (tagId: number) => {
    if (!project) return;
    setTagLoading(true);
    setError("");
    try {
      const res = await projectsApi.removeTag(pid, tagId);
      if (res.success) {
        setProject(prev => prev ? { ...prev, tags: prev.tags.filter(t => t.id !== tagId) } : prev);
      } else {
        setError(res.message);
      }
    } finally {
      setTagLoading(false);
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
    if (!task || task.status === col || !canModifyTasks) return;

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

  const assignedTagIds = new Set(project?.tags.map(t => t.id) ?? []);
  const availableTags = allTags.filter(t => !assignedTagIds.has(t.id));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="PROJECT"
        title={project?.name ?? `Project ${pid}`}
        action={
          <div className="flex gap-3">
            <button
              onClick={handleWatch}
              disabled={watchLoading}
              className={`text-xs px-4 py-2 border rounded-xl transition-colors disabled:opacity-40 ${
                isWatching
                  ? "border-sky-500/40 text-sky-400 bg-sky-500/10 hover:bg-sky-500/20"
                  : "border-white/10 text-white/50 hover:border-white/20 hover:text-white/80"
              }`}
            >
              {watchLoading ? <Spinner size={12} /> : isWatching ? "👀… Watching" : "👀 Watch"}
            </button>
            {canManageProject && (
              <button
                onClick={() => {
                  setEditName(project?.name ?? "");
                  setEditDesc(project?.description ?? "");
                  setEditStatus(project?.status ?? "");
                  setEditPriority(project?.priority ?? "");
                  setEditDeadline(project?.deadline?.slice(0, 10) ?? "");
                  setShowEdit(v => !v);
                }}
                className="text-xs px-4 py-2 border border-white/10 text-white/50 hover:border-white/20 hover:text-white/80 rounded-xl transition-colors"
              >
                {showEdit ? "Cancel edit" : "Edit project"}
              </button>
            )}
            {canModifyTasks && (
              <button
                onClick={() => setShowCreate(v => !v)}
                className="text-xs px-4 py-2 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-colors"
              >
                {showCreate ? "Cancel" : "+ New task"}
              </button>
            )}
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

      {/* Tag management */}
      {project && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-white/25 font-mono">Tags</p>
          <div className="flex flex-wrap gap-2 items-center">
            {project.tags.map(t => (
              <span
                key={t.id}
                className="flex items-center gap-1.5 text-xs px-3 py-1 bg-white/5 border border-white/10 text-white/50 rounded-lg group"
              >
                {t.name}
                {canManageProject && (
                  <button
                    onClick={() => handleRemoveTag(t.id)}
                    disabled={tagLoading}
                    className="text-white/20 hover:text-red-400 transition-colors disabled:opacity-40 leading-none"
                    title="Remove tag"
                  >
                    x
                  </button>
                )}
              </span>
            ))}
            {canManageProject && availableTags.length > 0 && (
              <select
                value=""
                onChange={e => { if (e.target.value) handleAddTag(Number(e.target.value)); }}
                disabled={tagLoading}
                className="bg-white/5 border border-white/10 text-white/40 text-xs rounded-lg px-3 py-1 focus:outline-none disabled:opacity-40"
              >
                <option value="">+ Add tag</option>
                {availableTags.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      {showEdit && (
        <section className="bg-[#0d0d0d] border border-white/5 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold text-sm">Edit project</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Project name"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20"
            />
            <input
              type="date"
              value={editDeadline}
              onChange={e => setEditDeadline(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20"
            />
            <select
              value={editStatus}
              onChange={e => setEditStatus(e.target.value)}
              className="bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-3 focus:outline-none"
            >
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={editPriority}
              onChange={e => setEditPriority(e.target.value)}
              className="bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-3 focus:outline-none"
            >
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <textarea
              placeholder="Description"
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              className="md:col-span-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white h-20 focus:outline-none focus:border-white/20"
            />
          </div>
          <button
            onClick={handleSaveEdit}
            disabled={saving || !editName.trim()}
            className="px-8 py-3 bg-white text-black text-sm font-bold rounded-xl hover:bg-white/90 transition-colors disabled:opacity-40"
          >
            {saving ? <Spinner size={14} /> : "Save changes"}
          </button>
        </section>
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
