import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { PageHeader, NodeBadge, StatCard, ErrorBox, SuccessBox, Spinner } from "../../components/ui/UI";
import { readItem } from "../../helpers/local_storage";

const BASE = import.meta.env.VITE_API_URL;

const auth = () => {
  const token = readItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

interface DbNodeInfo {
  name: string;
  host: string;
  port: number;
  status: string;
  lastCheck: string | null;
  successfulWrites: number;
  failedWrites: number;
}

export default function HealthDashboard() {
  const [nodes, setNodes] = useState<DbNodeInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [failing, setFailing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get<{ success: boolean; data: DbNodeInfo[] }>(
        `${BASE}health/db`,
        { headers: auth() },
      );
      if (res.data.success) setNodes(res.data.data);
      else setError("Failed to load DB health");
    } catch (e) {
      setError(axios.isAxiosError(e) ? (e.response?.data as { message?: string })?.message ?? "Request failed" : "Request failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleFailover = async (slaveIndex: 0 | 1) => {
    setFailing(true);
    setError("");
    setSuccess("");
    try {
      const res = await axios.post<{ success: boolean; message: string }>(
        `${BASE}health/failover`,
        { slaveIndex },
        { headers: auth() },
      );
      if (res.data.success) {
        setSuccess(res.data.message);
        await load();
      } else {
        setError(res.data.message);
      }
    } catch (e) {
      setError(axios.isAxiosError(e) ? (e.response?.data as { message?: string })?.message ?? "Failover failed" : "Failover failed");
    } finally {
      setFailing(false);
    }
  };

  const healthy = nodes.filter(n => n.status === "healthy").length;
  const degraded = nodes.filter(n => n.status === "degraded").length;
  const offline = nodes.filter(n => n.status === "unreachable").length;

  const slaves = nodes.filter((_, i) => i > 0);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="DB Health"
        action={
          <button
            onClick={load}
            disabled={loading}
            className="text-xs px-4 py-2 border border-white/10 text-white/50 rounded-xl hover:border-white/20 hover:text-white/70 transition-colors disabled:opacity-30"
          >
            {loading ? <Spinner size={12} /> : "Refresh"}
          </button>
        }
      />

      {error && <ErrorBox message={error} />}
      {success && <SuccessBox message={success} />}

      {/* Summary cards */}
      {nodes.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Healthy" value={healthy} color="text-emerald-400" />
          <StatCard label="Degraded" value={degraded} color="text-yellow-400" />
          <StatCard label="Offline" value={offline} color="text-red-400" />
        </div>
      )}

      {loading && nodes.length === 0 && (
        <div className="flex justify-center py-12"><Spinner size={24} /></div>
      )}

      {/* Node list */}
      {nodes.map((node, i) => (
        <section key={node.name} className="bg-[#0d0d0d] border border-white/5 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-white font-medium text-sm">{node.name}</h2>
              <NodeBadge status={node.status} />
              {i === 0 && (
                <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg font-mono">MASTER</span>
              )}
              {i > 0 && (
                <span className="text-[10px] px-2 py-0.5 bg-white/5 border border-white/10 text-white/30 rounded-lg font-mono">SLAVE {i - 1}</span>
              )}
            </div>
            {i > 0 && (
              <button
                onClick={() => handleFailover((i - 1) as 0 | 1)}
                disabled={failing}
                className="text-xs px-3 py-1.5 border border-amber-500/20 text-amber-400/70 rounded-lg hover:border-amber-500/40 hover:text-amber-400 transition-colors disabled:opacity-30"
              >
                {failing ? <Spinner size={11} /> : "Promote to master"}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono text-white/30">
            <div>
              <p className="text-white/15 uppercase tracking-widest text-[10px] mb-1">Host</p>
              <p className="text-white/50">{node.host}:{node.port}</p>
            </div>
            <div>
              <p className="text-white/15 uppercase tracking-widest text-[10px] mb-1">Last check</p>
              <p className="text-white/50">{node.lastCheck ? new Date(node.lastCheck).toLocaleTimeString() : "—"}</p>
            </div>
            <div>
              <p className="text-white/15 uppercase tracking-widest text-[10px] mb-1">Successful</p>
              <p className="text-emerald-400/70">{node.successfulWrites}</p>
            </div>
            <div>
              <p className="text-white/15 uppercase tracking-widest text-[10px] mb-1">Failed</p>
              <p className="text-red-400/70">{node.failedWrites}</p>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
