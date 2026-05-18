import { useCallback, useEffect, useState } from "react";
import { PageHeader, NodeBadge, StatCard, ErrorBox, SuccessBox, Spinner } from "../../components/ui/UI";
import { healthApi } from "../../api_services/health/HealthAPIService";
import type { DbNodeInfo } from "../../api_services/health/IHealthAPIService";

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
      const res = await healthApi.getDbHealth();
      if (res.success) setNodes(res.data ?? []);
      else setError(res.message);
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
      const res = await healthApi.failover(slaveIndex);
      if (res.success) {
        setSuccess((res as { message?: string }).message ?? "Failover successful");
        await load();
      } else {
        setError(res.message);
      }
    } finally {
      setFailing(false);
    }
  };

  const healthy = nodes.filter(n => n.status === "healthy").length;
  const degraded = nodes.filter(n => n.status === "degraded").length;
  const offline  = nodes.filter(n => n.status === "unreachable").length;

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
              <p className="text-emerald-400/70">{node.successfulConnections}</p>
            </div>
            <div>
              <p className="text-white/15 uppercase tracking-widest text-[10px] mb-1">Failed</p>
              <p className="text-red-400/70">{node.failedConnections}</p>
            </div>
          {i > 0 && (
            <div className="flex items-center gap-2 text-xs font-mono mt-1">
              <span className="text-white/15 uppercase tracking-widest text-[10px]">Replication lag:</span>
              {node.replicationLagMs === null
                ? <span className="text-white/20">n/a</span>
                : <span className={node.replicationLagMs > 2000 ? "text-red-400" : node.replicationLagMs > 500 ? "text-yellow-400" : "text-emerald-400"}>
                    {node.replicationLagMs < 1000 ? `${node.replicationLagMs}ms` : `${(node.replicationLagMs / 1000).toFixed(1)}s`}
                  </span>
              }
            </div>
          )}
          </div>
        </section>
      ))}
    </div>
  );
}
