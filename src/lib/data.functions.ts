import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    const { data: prefs } = await supabase.from("preferences").select("*").eq("user_id", userId).maybeSingle();
    return { profile, prefs };
  });

const PrefsSchema = z.object({
  diet: z.string(),
  cuisines: z.array(z.string()),
  health_goals: z.array(z.string()),
  allergies: z.array(z.string()),
  household_size: z.number().int().min(1).max(10),
  spice_level: z.string(),
  cook_time_minutes: z.number().int().min(10).max(120),
  budget_weekly: z.number().int().min(500).max(20000),
  full_name: z.string().optional(),
});

export const savePreferences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PrefsSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { full_name, ...prefs } = data;
    await supabase.from("preferences").upsert({ user_id: userId, ...prefs }, { onConflict: "user_id" });
    await supabase
      .from("profiles")
      .update({ onboarded: true, full_name: full_name ?? null, updated_at: new Date().toISOString() })
      .eq("id", userId);
    return { ok: true };
  });

export const getActivePlan = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: plan } = await supabase
      .from("meal_plans")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!plan) return { plan: null, meals: [], basket: null, items: [], deliveries: [], stats: null };

    const [{ data: meals }, { data: basket }, { data: stats }] = await Promise.all([
      supabase.from("meals").select("*").eq("plan_id", plan.id).order("day_index").order("slot"),
      supabase.from("grocery_baskets").select("*").eq("plan_id", plan.id).maybeSingle(),
      supabase.from("weekly_stats").select("*").eq("user_id", userId).eq("week_start", plan.week_start).maybeSingle(),
    ]);

    if (!basket) {
      return { plan, meals: meals ?? [], basket: null, items: [], deliveries: [], stats };
    }
    const [{ data: items }, { data: deliveries }] = await Promise.all([
      supabase.from("basket_items").select("*").eq("basket_id", basket.id).order("category"),
      supabase.from("delivery_schedules").select("*").eq("basket_id", basket.id).order("slot_date"),
    ]);
    return { plan, meals: meals ?? [], basket, items: items ?? [], deliveries: deliveries ?? [], stats };
  });

export const getPlanHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("meal_plans")
      .select("id,week_start,summary,status,created_at")
      .eq("user_id", userId)
      .order("week_start", { ascending: false })
      .limit(12);
    const { data: statsRows } = await supabase
      .from("weekly_stats")
      .select("*")
      .eq("user_id", userId)
      .order("week_start", { ascending: false })
      .limit(12);
    return { plans: data ?? [], stats: statsRows ?? [] };
  });
