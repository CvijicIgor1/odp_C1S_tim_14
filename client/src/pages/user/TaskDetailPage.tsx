import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PageHeader, Empty, ErrorBox, SuccessBox, Spinner, Combobox } from "../../components/ui/UI";
import { usersApi } from "../../api_services/users/UsersAPIService";
import { tasksApi } from "../../api_services/task/TaskAPIService";
import { projectsApi } from "../../api_services/project/ProjectAPIService";
import { teamsApi } from "../../api_services/team/TeamAPIService";
import { useAuth } from "../../hooks/auth/useAuthHook";
import type { TaskDetailDto, CommentDto, TaskAssigneeDto } from "../../models/project/ProjectTypes";
import type { TeamMemberDto } from "../../models/team/TeamTypes";

export default function TaskDetailPage() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const tid = Number(id);

  const [detail, setDetail] = useState<TaskDetailDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [comment, setComment] = useState("");
  const [addingComment, setAdding] = useState(false);

  const [teamMembers, setTeamMembers] = useState<TeamMemberDto[]>([]);
  const [isTeamOwner, setIsTeamOwner] = useState(false);
  const [userMap, setUserMap] = useState<Map<number, string>>(new Map());
  const [assigneeId, setAssigneeId] = useState("");
  const [addingAssignee, setAddingAss] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await tasksApi.getById(tid);
      if (res.success && res.data) {
        setDetail(res.data);

        let members: TeamMemberDto[] = [];
        const projectRes = await projectsApi.getById(res.data.task.projectId);
        if (projectRes.success && projectRes.data) {
          const teamRes = await teamsApi.getById(projectRes.data.teamId);
          if (teamRes.success && teamRes.data) {
            setIsTeamOwner(teamRes.data.currentUserRole === "owner");
          }
          const membersRes = await teamsApi.getMembers(projectRes.data.teamId);
          if (membersRes.success && membersRes.data) {
            members = membersRes.data.items;
            setTeamMembers(members);
          }
        }

        const ids = new Set<number>();
        for (const a of res.data.assignees) ids.add(a.userId);
        for (const c of res.data.comments) ids.add(c.userId);
        for (const m of members) ids.add(m.userId);

        const map = new Map<number, string>();
        await Promise.all(
          Array.from(ids).map(async (uid) => {
            const r = await usersApi.getById(uid);
            if (r.success && r.data) map.set(uid, r.data.username);
          })
        );
        setUserMap(map);
      } else {
        setError(res.message);
      }
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
  const currentUserId = user?.id ?? 0;
  const isTaskCreator = task?.createdByUserId === currentUserId;
  const canManageAssignees = isTaskCreator || isTeamOwner;
  const canComment = isTeamOwner || !!detail?.assignees.some((assignee) => assignee.userId === currentUserId);

  const assignedUserIds = new Set(detail?.assignees.map((a) => a.userId) ?? []);
  const availableMembers = teamMembers.filter((m) => !assignedUserIds.has(m.userId));

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
                    <span className="text-white/60 text-sm font-mono">
                      {userMap.get(a.userId) ?? `User #${a.userId}`}
                    </span>
                    {canManageAssignees && (
                      <button
                        onClick={() => handleRemoveAssignee(a.userId)}
                        className="text-[11px] text-red-500/40 hover:text-red-500 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {canManageAssignees && availableMembers.length > 0 && (
              <div className="flex items-center gap-2">
                <Combobox
                  options={availableMembers.map((m) => ({ value: String(m.userId), label: userMap.get(m.userId) ?? `User #${m.userId}` }))}
                  value={assigneeId}
                  onChange={setAssigneeId}
                  placeholder="Search member..."
                />
                <button
                  onClick={handleAddAssignee}
                  disabled={addingAssignee || !assigneeId}
                  className="text-xs px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 disabled:opacity-40 transition-colors"
                >
                  {addingAssignee ? <Spinner size={12} /> : "Add"}
                </button>
              </div>
            )}
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
                      <span className="text-[11px] font-mono text-white/25">{userMap.get(c.userId) ?? `User #${c.userId}`} · {c.createdAt?.slice(0, 10)}</span>
                      {c.userId === currentUserId && (
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className="text-[11px] text-red-500/30 hover:text-red-500 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="text-white/70 text-sm">{c.content}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Add comment */}
            {canComment && (
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
            )}
          </section>
        </>
      )}
    </div>
  );
}
