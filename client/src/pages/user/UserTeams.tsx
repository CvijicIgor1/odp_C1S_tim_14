import { PageHeader } from "../../components/ui/UI";
import { useAuth } from "../../hooks/auth/useAuthHook";

export default function UserTeams() {
  const { user } = useAuth();

  return (
    <div className="space-y-12">
      {/* Header sekcija */}
      <PageHeader eyebrow="MANAGEMENT" title={`User: ${user?.username}`} />

      {/* 1. SEKCIJA: KREIRANJE TIMA */}
      <section className="bg-[#0d0d0d] border border-white/5 rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-4">Create a team</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            type="text" 
            placeholder="Team name" 
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20"
          />
          <input 
            type="text" 
            placeholder="image URL (promenicu ovo u dugme)" 
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20"
          />
          <textarea 
            placeholder="Description" 
            className="md:col-span-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white h-24 focus:outline-none focus:border-white/20"
          />
          <button className="md:w-max px-8 py-3 bg-white text-black text-sm font-bold rounded-xl hover:bg-white/90 transition-colors">
            Done
          </button>
        </div>
      </section>

      {/* 2. SEKCIJA: PREGLED TIMOVA (DASHBOARD) */}
      <section>
        <h2 className="text-white/50 text-xs uppercase tracking-widest mb-6">My teams</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Primer kartice jednog tima */}
          <div className="group bg-[#0d0d0d] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl">
                  ⌬
                </div>
                <div>
                  <h3 className="text-white font-medium">Alpha Team (nije stvaran, samo placeholder)</h3>
                  <p className="text-white/30 text-xs">Vlasnik: {user?.username}</p>
                </div>
              </div>
              <span className="bg-white/5 text-[10px] text-white/40 px-2 py-1 rounded border border-white/10 uppercase tracking-tighter">
                Vlasnik
              </span>
            </div>
            
            <p className="text-white/50 text-sm mb-6 line-clamp-2">
              Glavni razvojni tim za projekat Avlija. Radimo na UI/UX i API integracijama.
            </p>

            {/* 3. & 4. UPRAVLJANJE ČLANOVIMA (UI Unutar kartice ili kao lista) */}
            <div className="border-t border-white/5 pt-4 space-y-4">
               <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    placeholder="Dodaj člana po username-u..." 
                    className="flex-1 bg-white/5 border border-transparent rounded-lg px-3 py-2 text-xs text-white focus:border-white/10 outline-none"
                  />
                  <button className="text-xs text-white bg-white/10 px-3 py-2 rounded-lg hover:bg-white/20">Dodaj</button>
               </div>

               {/* Lista članova za vlasnika */}
               <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-white/[0.02]">
                    <span className="text-white/70">Korisnik_123</span>
                    <div className="flex gap-2">
                        <select className="bg-transparent text-white/30 outline-none cursor-pointer hover:text-white">
                          <option>Member</option>
                          <option>Admin</option>
                        </select>
                        <button className="text-white/20 hover:text-red-500 transition-colors">Ukloni</button>
                    </div>
                  </div>
               </div>
            </div>

            {/* 5. & 6. OPASNE AKCIJE */}
            <div className="flex gap-4 mt-6 pt-4 border-t border-white/5">
                <button className="text-[11px] text-white/20 hover:text-white transition-colors">Prenesi vlasništvo</button>
                <button className="text-[11px] text-red-500/40 hover:text-red-500 transition-colors">Obriši tim (Kaskadno)</button>
            </div>
          </div>

          {/* Primer kartice gde je korisnik samo običan član */}
          <div className="bg-[#0d0d0d] border border-white/5 rounded-2xl p-5">
             <div className="flex gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl">
                  ▽
                </div>
                <div>
                  <h3 className="text-white font-medium">Design System</h3>
                  <p className="text-white/30 text-xs">Vlasnik: Admin_User</p>
                </div>
             </div>
             <button className="w-full py-2 bg-red-500/5 text-red-500/50 hover:bg-red-500/10 hover:text-red-500 text-xs rounded-xl transition-all border border-red-500/10">
                Napusti tim (Izađi iz svih projekata)
             </button>
          </div>

        </div>
      </section>
    </div>
  );
}