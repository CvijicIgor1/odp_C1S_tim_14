import { useState } from "react";
import { useAuth } from "../../hooks/auth/useAuthHook";
import type { IAuthAPIService } from "../../api_services/auth/IAuthAPIService";

export function RegisterForm({ authApi }: { authApi: IAuthAPIService }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(""); setLoading(true);
    const res = await authApi.register(form.username, form.email, form.password, "user");
    setLoading(false);
    if (!res.success || !res.data) { setError(res.message ?? "Registration failed"); return; }
    login(res.data);
  };

  return (
    <div className="w-full max-w-sm rounded-3xl bg-[#0b1220]/90 backdrop-blur-xl shadow-[0_25px_80px_rgba(0,0,0,0.6)] px-8 py-10">
      <div className="text-center mb-10">
        <h1 className="text-2xl font-semibold text-white">Create account</h1>
        <p className="text-sm text-slate-400 mt-1">Your journey starts here</p>
      </div>

      {error && (
        <div className="mb-5 bg-red-500/10 border border-red-500/20 text-red-300 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="flex flex-col gap-4">
        {(["username", "email", "password"] as const).map((field) => (
          <div key={field}>
            <label className="block text-xs text-white/40 mb-2 font-medium capitalize">{field}</label>
            <input
              type={field === "password" ? "password" : field === "email" ? "email" : "text"}
              value={form[field]} onChange={set(field)} required
              className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-slate-500 transition-colors"
              placeholder={field === "password" ? "Minimum 8 chars, 1 uppercase, 1 number" : ""} />
          </div>
        ))}
        <button type="submit" disabled={loading}
          className="mt-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl py-3 text-sm transition-colors cursor-pointer">
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-center text-slate-400 text-sm mt-6">
        Already have an account?{" "}
        <a href="/login" className="text-slate-100 hover:text-white transition-colors">Sign in</a>
      </p>
    </div>
  );
}
