import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getProfile, getActivePlan } from "@/lib/data.functions";
import { generateWeeklyPlan } from "@/lib/meal-planner.functions";
import { AppHeader } from "@/components/AppHeader";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, ChevronRight, Loader2, Flame, Leaf, ShoppingBasket, Truck, ChefHat } from "lucide-react";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({ meta: [{ title: "Home — Blinkit Meal Planner" }] }),
  component: HomePage,
});

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function weekStartISO() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

function HomePage() {
  const navigate = useNavigate();
  const getProfileFn = useServerFn(getProfile);
  const getPlanFn = useServerFn(getActivePlan);
  const generateFn = useServerFn(generateWeeklyPlan);

  const { data: prof } = useQuery({ queryKey: ["profile"], queryFn: () => getProfileFn() });
  const { data: planData, refetch } = useQuery({ queryKey: ["plan"], queryFn: () => getPlanFn() });

  const [generating, setGenerating] = useState(false);

  if (prof && (!prof.profile?.onboarded || !prof.prefs)) {
    navigate({ to: "/onboarding" });
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      await generateFn({ data: { week_start: weekStartISO() } });
      toast.success("Your week is planned!");
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't generate plan");
    } finally {
      setGenerating(false);
    }
  }

  const today = new Date().getDay();
  const todaysMeals = planData?.meals?.filter((m) => m.day_index === today) ?? [];
  const stats = planData?.stats;
  const firstName = prof?.profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <>
      <AppHeader subtitle={`Hi ${firstName} 👋`} />

      <main className="mx-auto max-w-md px-4 -mt-2 space-y-4">
        {!planData?.plan ? (
          <div className="card-soft p-5">
            <div className="flex items-center gap-2 text-success font-bold">
              <Sparkles className="h-5 w-5" />
              <span>Build your first week</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Our AI will craft 21 meals tailored to your preferences and split grocery deliveries by freshness.
            </p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="mt-4 w-full py-3 rounded-xl success-gradient text-success-foreground font-bold shadow-[var(--shadow-success)] flex items-center justify-center gap-2"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {generating ? "Planning your week…" : "Generate weekly plan"}
            </button>
          </div>
        ) : (
          <>
            <div className="card-soft p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">This week</p>
                  <p className="text-sm font-bold mt-0.5">{planData.plan.summary}</p>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="chip chip-brand"
                >
                  {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  Re-plan
                </button>
              </div>
              {stats && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <Stat icon={<Flame className="h-4 w-4" />} label="Streak" value={`${stats.streak_days}d`} />
                  <Stat icon={<Leaf className="h-4 w-4" />} label="Done" value={`${stats.meals_completed}/${stats.total_meals}`} />
                  <Stat icon={<ShoppingBasket className="h-4 w-4" />} label="Use" value={`${Math.round(stats.utilization_pct)}%`} />
                </div>
              )}
            </div>

            <Link to="/cook/$day" params={{ day: String(today) }} className="block">
              <div className="card-soft p-4 brand-gradient">
                <div className="flex items-center justify-between text-brand-foreground">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide">Today · {DAYS[today]}</p>
                    <p className="text-lg font-black mt-0.5">Cook Mode</p>
                    <p className="text-xs font-semibold opacity-80 mt-0.5">{todaysMeals.length} meals planned</p>
                  </div>
                  <ChefHat className="h-10 w-10" />
                </div>
                <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
                  {todaysMeals.map((m) => (
                    <div key={m.id} className="shrink-0 bg-white/80 rounded-xl px-3 py-2 min-w-[110px]">
                      <div className="text-xl">{m.image_emoji}</div>
                      <div className="text-[10px] font-bold uppercase opacity-70">{m.slot}</div>
                      <div className="text-xs font-bold leading-tight line-clamp-2">{m.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Link>

            <div className="grid grid-cols-2 gap-3">
              <QuickCard to="/groceries" icon={<ShoppingBasket className="h-5 w-5" />} title="Basket" subtitle={`${planData.items?.length ?? 0} items · ₹${planData.basket?.total_value ?? 0}`} />
              <QuickCard to="/deliveries" icon={<Truck className="h-5 w-5" />} title="Drops" subtitle={`${planData.deliveries?.length ?? 0} scheduled`} />
            </div>

            <Link to="/plan" className="card-soft p-4 flex items-center justify-between">
              <div>
                <p className="font-bold">View weekly plan</p>
                <p className="text-xs text-muted-foreground">Browse, swap, or replace meals</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>
          </>
        )}
      </main>
    </>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/60 p-2.5">
      <div className="flex items-center gap-1 text-muted-foreground">{icon}<span className="text-[10px] font-bold uppercase">{label}</span></div>
      <div className="text-lg font-black mt-0.5">{value}</div>
    </div>
  );
}

function QuickCard({ to, icon, title, subtitle }: { to: string; icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <Link to={to} className="card-soft p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[oklch(0.93_0.08_142)] text-success">{icon}</div>
      <p className="mt-2 font-bold text-sm">{title}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>
    </Link>
  );
}
