import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getActivePlan } from "@/lib/data.functions";
import { replaceMeal } from "@/lib/meal-planner.functions";
import { AppHeader } from "@/components/AppHeader";
import { Share2, RefreshCw, ChefHat, Clock, Flame } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/plan")({
  head: () => ({ meta: [{ title: "Your weekly plan" }] }),
  component: PlanPage,
});

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function PlanPage() {
  const getPlanFn = useServerFn(getActivePlan);
  const replaceMealFn = useServerFn(replaceMeal);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["plan"], queryFn: () => getPlanFn() });

  const replaceM = useMutation({
    mutationFn: (meal_id: string) => replaceMealFn({ data: { meal_id } }),
    onSuccess: () => {
      toast.success("Meal swapped!");
      qc.invalidateQueries({ queryKey: ["plan"] });
    },
  });

  async function share() {
    const text = data?.meals
      ?.map((m) => `${DAYS[m.day_index]} ${m.slot}: ${m.image_emoji} ${m.name}`)
      .join("\n");
    const full = `My Blinkit Meal Plan 🍽️\n\n${text}`;
    if (navigator.share) {
      try { await navigator.share({ title: "My Meal Plan", text: full }); } catch {}
    } else {
      await navigator.clipboard.writeText(full);
      toast.success("Plan copied to clipboard");
    }
  }

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  if (!data?.plan) return (
    <div className="p-8 text-center">
      <p className="text-muted-foreground">No active plan yet.</p>
      <Link to="/" className="text-success font-bold mt-2 inline-block">Generate a plan →</Link>
    </div>
  );

  const byDay: Record<number, typeof data.meals> = {};
  data.meals.forEach((m) => {
    byDay[m.day_index] = byDay[m.day_index] || [];
    byDay[m.day_index].push(m);
  });

  return (
    <>
      <AppHeader subtitle="Your weekly plan" />
      <main className="mx-auto max-w-md px-4 pt-3 space-y-3">
        <div className="card-soft p-3 flex items-center justify-between">
          <div className="text-sm">
            <p className="font-bold">{data.plan.summary}</p>
            <p className="text-xs text-muted-foreground">Week of {data.plan.week_start}</p>
          </div>
          <button onClick={share} className="chip chip-brand">
            <Share2 className="h-3.5 w-3.5" /> Share
          </button>
        </div>

        {DAYS.map((day, i) => (
          <div key={i} className="card-soft p-3">
            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2">{day}</p>
            <div className="space-y-2">
              {(byDay[i] || []).map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-2 rounded-xl bg-muted/40">
                  <div className="text-3xl">{m.image_emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase text-success">{m.slot}</span>
                      {m.completed && <span className="chip chip-success !py-0 !px-1.5 !text-[9px]">Done</span>}
                    </div>
                    <p className="text-sm font-bold leading-tight truncate">{m.name}</p>
                    <div className="flex gap-3 text-[10px] text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{m.prep_minutes}m</span>
                      <span className="flex items-center gap-1"><Flame className="h-3 w-3" />{m.calories}kcal</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Link to="/cook/$day" params={{ day: String(i) }} className="p-2 rounded-lg bg-success text-success-foreground" aria-label="Cook">
                      <ChefHat className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      onClick={() => replaceM.mutate(m.id)}
                      disabled={replaceM.isPending}
                      className="p-2 rounded-lg border border-border"
                      aria-label="Replace meal"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>
    </>
  );
}
