import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getActivePlan } from "@/lib/data.functions";
import { toggleMealComplete } from "@/lib/meal-planner.functions";
import { AppHeader } from "@/components/AppHeader";
import { useState } from "react";
import { ArrowLeft, Check, Clock, Flame, Drumstick } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/cook/$day")({
  head: () => ({ meta: [{ title: "Cook mode" }] }),
  component: CookPage,
});

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function CookPage() {
  const { day } = useParams({ from: "/_authenticated/cook/$day" });
  const dayIdx = Number(day);
  const getPlanFn = useServerFn(getActivePlan);
  const toggleFn = useServerFn(toggleMealComplete);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["plan"], queryFn: () => getPlanFn() });
  const [active, setActive] = useState<"breakfast" | "lunch" | "dinner">("breakfast");

  const meals = (data?.meals ?? []).filter((m) => m.day_index === dayIdx);
  const meal = meals.find((m) => m.slot === active) ?? meals[0];

  const toggleM = useMutation({
    mutationFn: (vars: { meal_id: string; completed: boolean }) => toggleFn({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plan"] }),
  });

  const { data: ingredients } = useQuery({
    queryKey: ["ingredients", meal?.id],
    enabled: !!meal,
    queryFn: async () => {
      const { data } = await supabase.from("ingredients").select("*").eq("meal_id", meal!.id);
      return data ?? [];
    },
  });

  if (!meal) return <div className="p-8 text-center text-muted-foreground">No meals for this day.</div>;

  return (
    <>
      <AppHeader subtitle={`Cook Mode · ${DAYS[dayIdx]}`} />
      <main className="mx-auto max-w-md px-4 pt-3 space-y-3">
        <Link to="/" className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back home
        </Link>

        <div className="flex gap-2">
          {(["breakfast", "lunch", "dinner"] as const).map((slot) => (
            <button
              key={slot}
              onClick={() => setActive(slot)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase capitalize ${
                active === slot ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {slot}
            </button>
          ))}
        </div>

        <div className="card-soft p-5 brand-gradient text-brand-foreground">
          <div className="text-5xl">{meal.image_emoji}</div>
          <h1 className="text-2xl font-black mt-2 tracking-tight">{meal.name}</h1>
          <p className="text-sm font-semibold opacity-80 mt-1">{meal.description}</p>
          <div className="flex gap-4 mt-3 text-xs font-bold">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{meal.prep_minutes} min</span>
            <span className="flex items-center gap-1"><Flame className="h-3.5 w-3.5" />{meal.calories} kcal</span>
            <span className="flex items-center gap-1"><Drumstick className="h-3.5 w-3.5" />{meal.protein_g}g protein</span>
          </div>
        </div>

        <div className="card-soft p-4">
          <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2">Ingredients</p>
          <ul className="space-y-1.5">
            {(ingredients ?? []).map((ing) => (
              <li key={ing.id} className="flex justify-between text-sm py-1 border-b border-border last:border-0">
                <span className="capitalize">{ing.name}</span>
                <span className="font-bold text-muted-foreground">
                  {Number(ing.quantity) % 1 === 0 ? ing.quantity : Number(ing.quantity).toFixed(1)} {ing.unit}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card-soft p-4">
          <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2">Steps</p>
          <ol className="space-y-3">
            {meal.recipe_steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground text-xs font-black">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed pt-1">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        <button
          onClick={() => toggleM.mutate({ meal_id: meal.id, completed: !meal.completed })}
          className={`w-full py-4 rounded-xl font-black flex items-center justify-center gap-2 ${
            meal.completed ? "bg-muted text-muted-foreground" : "success-gradient text-success-foreground shadow-[var(--shadow-success)]"
          }`}
        >
          <Check className="h-5 w-5" />
          {meal.completed ? "Cooked — mark undone" : "Mark as cooked"}
        </button>
      </main>
    </>
  );
}
