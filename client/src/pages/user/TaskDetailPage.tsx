import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PageHeader, Empty, ErrorBox, SuccessBox, Spinner } from "../../components/ui/UI";
import { tasksApi } from "../../api_services/task/TaskAPIService";
import type { TaskDetailDto, CommentDto, TaskAssigneeDto } from "../../models/project/ProjectTypes";

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const tid = Number(id);

  const [detail, setDetail] = useState<TaskDetailDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [comment, setComment] = useState("");
  const [addingComment, setAdding] = useState(false);

  const [assigneeId, setAssigneeId] = useState("");
  const [addingAssignee, setAddingAss] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await tasksApi.getById(tid);
      if (res.success && res.data) setDetail(res.data);
      else setError(res.message);
    } finally {
      setLoading(false);
    }
  }, [tid]);

  useEffect(() => { load(); }, [load]);

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    setAdding(true);
    setError("");
    setSuccess("");
    try {
      const res = await tasksApi.addComment(tid, comment.trim());
      if (res.success) {
        setComment("");
        setSuccess("Comment added");
        await load();
      } else {
        setError(res.message);
      }
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    setError("");
    setSuccess("");
    const res = await tasksApi.deleteComment(tid, commentId);
    if (res.success) { setSuccess("Comment deleted"); await load(); }
    else setError(res.message);
  };

  const handleAddAssignee = async () => {
    const uid = Number(assigneeId);
    if (!uid) return;
    setAddingAss(true);
    setError("");
    setSuccess("");
    try {
      const res = await tasksApi.addAssignee(tid, uid);
      if (res.success) {
        setAssigneeId("");
        setSuccess("Assignee added");
        await load();
      } else {
        setError(res.message);
      }
    } finally {
      setAddingAss(false);
    }
  };

  const handleRemoveAssignee = async (userId: number) => {
    setError("");
    setSuccess("");
    const res = await tasksApi.removeAssignee(tid, userId);
    if (res.success) { setSuccess("Assignee removed"); await load(); }
    else setError(res.message);
  };

  const task = detail?.task;

  return (
    <div className="space-y-8 max-w-3xl">
      <PageHeader eyebrow="TASK" title={task?.title ?? `Task ${tid}`} />

      {error && <ErrorBox message={error} />}
      {success && <SuccessBox message={success} />}

      {loading && <div className="flex justify-center py-12"><Spinner size={24} /></div>}

      {!loading && task && (
        <>
          {/* Task meta */}
          <section className="bg-[#0d0d0d] border border-white/5 rounded-2xl p-6 space-y-4">
            <p className="text-white/60 text-sm leading-relaxed">{task.description}</p>
            <div className="flex flex-wrap gap-5 text-xs font-mono text-white/30">
              <span>Status: <span className="text-white/60">{task.status}</span></span>
              <span>Priority: <span className="text-white/60">{task.priority}</span></span>
              {task.deadline && <span>Deadline: <span className="text-white/60">{task.deadline.slice(0, 10)}</span></span>}
              {task.estimatedHours > 0 && <span>Est: <span className="text-white/60">{task.estimatedHours}h</span></span>}
            </div>
          </section>

          {/* Assignees */}
          <section className="space-y-4">
            <h2 className="text-xs font-mono uppercase tracking-widest text-white/30">Assignees</h2>

            {detail.assignees.length === 0 && <Empty message="No assignees" />}
            {detail.assignees.length > 0 && (
              <div className="space-y-2">
                {detail.assignees.map((a: TaskAssigneeDto) => (
                  <div key={a.userId} className="flex items-center justify-between bg-[#0d0d0d] border border-white/5 rounded-xl px-4 py-3">
                    <span className="text-white/60 text-sm font-mono">User #{a.userId}</span>
                    <button
                      onClick={() => handleRemoveAssignee(a.userId)}
                      className="text-[11px] text-red-500/40 hover:text-red-500 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                placeholder="User ID"
                value={assigneeId}
                onChange={e => setAssigneeId(e.target.value)}
                className="w-32 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20"
              />
              <button
                onClick={handleAddAssignee}
                disabled={addingAssignee || !assigneeId}
                className="text-xs px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 disabled:opacity-40 transition-colors"
              >
                {addingAssignee ? <Spinner size={12} /> : "Add"}
              </button>
            </div>
          </section>

          {/* Comments */}
          <section className="space-y-4">
            <h2 className="text-xs font-mono uppercase tracking-widest text-white/30">Comments</h2>

            {detail.comments.length === 0 && <Empty message="No comments yet" />}
            {detail.comments.length > 0 && (
              <div className="space-y-3">
                {detail.comments.map((c: CommentDto) => (
                  <div key={c.id} className="bg-[#0d0d0d] border border-white/5 rounded-xl px-4 py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-white/25">User #{c.userId} · {c.createdAt?.slice(0, 10)}</span>
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        className="text-[11px] text-red-500/30 hover:text-red-500 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                    <p className="text-white/70 text-sm">{c.content}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Add comment */}
            <div className="space-y-3">
              <textarea
                placeholder="Add a comment..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white h-24 focus:outline-none focus:border-white/20"
              />
              <button
                onClick={handleAddComment}
                disabled={addingComment || !comment.trim()}
                className="text-xs px-6 py-2.5 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-colors disabled:opacity-40"
              >
                {addingComment ? <Spinner size={12} /> : "Post comment"}
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
