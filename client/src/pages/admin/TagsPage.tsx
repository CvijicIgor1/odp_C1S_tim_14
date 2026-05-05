import { useCallback, useEffect, useState } from "react";
import { PageHeader, Empty, ErrorBox, SuccessBox, Spinner, Pagination } from "../../components/ui/UI";
import { tagsApi } from "../../api_services/tag/TagAPIService";
import { useAuth } from "../../hooks/auth/useAuthHook";
import type { TagDto } from "../../models/project/ProjectTypes";

const PAGE_SIZE = 20;

export default function TagsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [tags, setTags] = useState<TagDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await tagsApi.getAll(page, PAGE_SIZE);
      if (res.success) {
        setTags(res.data?.items ?? []);
        setTotal(res.data?.total ?? 0);
      } else {
        setError(res.message);
      }
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    setError("");
    setSuccess("");
    try {
      const res = await tagsApi.create(newName.trim());
      if (res.success) {
        setNewName("");
        setSuccess("Tag created");
        await load();
      } else {
        setError(res.message);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    setError("");
    setSuccess("");
    const res = await tagsApi.delete(id);
    if (res.success) {
      setSuccess("Tag deleted");
      await load();
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Admin" title="Tags" />

      {error && <ErrorBox message={error} />}
      {success && <SuccessBox message={success} />}

      {/* Create form — admin only */}
      {isAdmin && (
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="New tag name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleCreate(); }}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/20 w-64"
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            className="text-xs px-5 py-2.5 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-colors disabled:opacity-40"
          >
            {creating ? <Spinner size={12} /> : "Create"}
          </button>
        </div>
      )}

      {loading && <div className="flex justify-center py-12"><Spinner size={24} /></div>}

      {!loading && tags.length === 0 && <Empty message="No tags found" />}

      {!loading && tags.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {tags.map(t => (
            <div
              key={t.id}
              className="flex items-center gap-2 px-3 py-2 bg-white/4 border border-white/8 rounded-xl group"
            >
              <span className="text-sm text-white/70">{t.name}</span>
              {isAdmin && (
                <button
                  onClick={() => handleDelete(t.id)}
                  className="text-[11px] text-white/15 hover:text-red-400 transition-colors group-hover:text-white/30"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
    </div>
  );
}
