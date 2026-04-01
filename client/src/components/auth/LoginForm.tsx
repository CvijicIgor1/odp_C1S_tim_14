import { useState } from "react";
import { useAuth } from "../../hooks/auth/useAuthHook";
import type { IAuthAPIService } from "../../api_services/auth/IAuthAPIService";

export function LoginForm({ authApi }: { authApi: IAuthAPIService }) {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(""); setLoading(true);
    const res = await authApi.login(username, password);
    setLoading(false);
    if (!res.success || !res.data) { setError(res.message ?? "Invalid credentials"); return; }
    login(res.data);
  };

  return (
    <div className="w-full max-w-sm rounded-3xl border border-white/5 bg-white/5 backdrop-blur-2xl shadow-[0_20px_70px_rgba(0,0,0,0.6)] ring-1 ring-white/10 px-8 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Welcome back</h1>
        <p className="text-sm text-slate-300 mt-2">Log in</p>
      </div>

      {error && (
        <div className="mb-5 bg-red-500/10 border border-red-500/20 text-red-300 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs text-slate-300 mb-2 font-medium">Username</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-white/30 transition-all duration-200"
            placeholder="username_here" />
        </div>
        <div>
          <label className="block text-xs text-slate-300 mb-2 font-medium">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-white/30 transition-all duration-200"
            placeholder="••••••••" />
        </div>
        <button type="submit" disabled={loading}
          className="mt-2 rounded-2xl bg-white text-slate-900 font-semibold py-3.5 text-sm transition-all duration-200 hover:bg-slate-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-300">
        Don't have an account?{" "}
        <a href="/register" className="font-medium text-white hover:text-slate-200 transition-colors">Register here</a>
      </p>
    </div>
  );
}
