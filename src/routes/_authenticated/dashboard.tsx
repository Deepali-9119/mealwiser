import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getProfile, getPlanHistory } from "@/lib/data.functions";
import { AppHeader } from "@/components/AppHeader";
import { Flame, Leaf, Trash2, CheckCircle2, LogOut } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const getHistoryFn = useServerFn(getPlanHistory);
  const getProfileFn = useServerFn(getProfile);
  const { data } = useQuery({ queryKey: ["history"], queryFn: () => getHistoryFn() });
  const { data: prof } = useQuery({ queryKey: ["profile"], queryFn: () => getProfileFn() });

  const latest = data?.stats?.[0];
  const totalDone = (data?.stats ?? []).reduce((s, x) => s + (x.meals_completed ?? 0), 0);
  const totalWaste = (data?.stats ?? []).reduce((s, x) => s + Number(x.waste_reduction_kg ?? 0), 0);
  const bestStreak = Math.max(0, ...(data?.stats ?? []).map((s) => s.streak_days ?? 0));

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <>
      <AppHeader subtitle="Your progress" />
      <main className="mx-auto max-w-md px-4 pt-3 space-y-3">
        <div className="card-soft p-4 brand-gradient text-brand-foreground">
          <p className="text-xs font-black uppercase opacity-80">Hi {prof?.profile?.full_name?.split(" ")[0] ?? "chef"} —</p>
          <p className="text-lg font-black mt-1">You're building healthy habits 🌱</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Big icon={<Flame className="h-5 w-5" />} label="Best streak" value={`${bestStreak} days`} />
          <Big icon={<CheckCircle2 className="h-5 w-5" />} label="Meals cooked" value={`${totalDone}`} />
          <Big icon={<Leaf className="h-5 w-5" />} label="Utilization" value={`${Math.round(latest?.utilization_pct ?? 0)}%`} />
          <Big icon={<Trash2 className="h-5 w-5" />} label="Waste saved" value={`${totalWaste.toFixed(1)} kg`} />
        </div>

        <div className="card-soft p-4">
          <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3">Weekly history</p>
          {(data?.plans ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No plans yet.</p>
          ) : (
            <div className="space-y-2">
              {data?.plans.map((p) => {
                const s = data.stats.find((x) => x.week_start === p.week_start);
                const pct = s && s.total_meals ? Math.round((s.meals_completed / s.total_meals) * 100) : 0;
                return (
                  <div key={p.id} className="p-3 rounded-xl bg-muted/40">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold">Week of {p.week_start}</p>
                      <span className={`chip ${p.status === "active" ? "chip-success" : ""}`}>{p.status}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{p.summary}</p>
                    <div className="mt-2 h-1.5 rounded-full bg-card overflow-hidden">
                      <div className="h-full success-gradient" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[11px] mt-1 text-muted-foreground">{s?.meals_completed ?? 0}/{s?.total_meals ?? 0} meals cooked</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <button onClick={signOut} className="w-full py-3 rounded-xl border border-border font-semibold flex items-center justify-center gap-2 text-muted-foreground">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </main>
    </>
  );
}

function Big({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card-soft p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[oklch(0.93_0.08_142)] text-success">{icon}</div>
      <p className="text-xs text-muted-foreground font-semibold mt-2">{label}</p>
      <p className="text-xl font-black">{value}</p>
    </div>
  );
}
