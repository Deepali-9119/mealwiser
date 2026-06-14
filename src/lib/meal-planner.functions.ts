import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PrefsInput = z.object({
  diet: z.string(),
  cuisines: z.array(z.string()),
  health_goals: z.array(z.string()),
  allergies: z.array(z.string()),
  household_size: z.number().int().min(1).max(10),
  spice_level: z.string(),
  cook_time_minutes: z.number().int().min(10).max(120),
  budget_weekly: z.number().int().min(500).max(20000),
});

const GenerateInput = z.object({
  week_start: z.string(), // ISO date
});

const MealSchema = z.object({
  day_index: z.number().int().min(0).max(6),
  slot: z.enum(["breakfast", "lunch", "dinner"]),
  name: z.string(),
  description: z.string(),
  cuisine: z.string(),
  image_emoji: z.string(),
  calories: z.number().int(),
  protein_g: z.number().int(),
  prep_minutes: z.number().int(),
  recipe_steps: z.array(z.string()),
  ingredients: z.array(
    z.object({
      name: z.string(),
      quantity: z.number(),
      unit: z.string(),
      category: z.string(),
      freshness_days: z.number().int(),
    }),
  ),
});

const PlanSchema = z.object({
  summary: z.string(),
  meals: z.array(MealSchema),
});

type Plan = z.infer<typeof PlanSchema>;

function fallbackPlan(): Plan {
  const days = 7;
  const slots = ["breakfast", "lunch", "dinner"] as const;
  const emoji = { breakfast: "🥣", lunch: "🥗", dinner: "🍲" } as const;
  const samples = {
    breakfast: ["Poha", "Vegetable Upma", "Oats Idli", "Besan Chilla", "Paneer Paratha", "Masala Omelette", "Sprouts Bowl"],
    lunch: ["Rajma Chawal", "Veg Pulao + Raita", "Dal Tadka + Roti", "Chickpea Salad", "Paneer Bhurji + Roti", "Khichdi", "Veg Biryani"],
    dinner: ["Palak Paneer + Roti", "Aloo Gobi + Phulka", "Mixed Veg Curry", "Tofu Stir Fry", "Mushroom Masala", "Lentil Soup + Toast", "Bhindi Masala + Roti"],
  };
  const meals = [];
  for (let d = 0; d < days; d++) {
    for (const slot of slots) {
      meals.push({
        day_index: d,
        slot,
        name: samples[slot][d % samples[slot].length],
        description: "Wholesome, balanced and quick to cook.",
        cuisine: "Indian",
        image_emoji: emoji[slot],
        calories: slot === "breakfast" ? 350 : slot === "lunch" ? 550 : 500,
        protein_g: slot === "breakfast" ? 12 : 22,
        prep_minutes: 25,
        recipe_steps: [
          "Prep all ingredients and chop vegetables.",
          "Heat oil in a pan, add spices and aromatics.",
          "Add main ingredients and cook through.",
          "Season, garnish and serve hot.",
        ],
        ingredients: [
          { name: "Onion", quantity: 1, unit: "pcs", category: "vegetables", freshness_days: 14 },
          { name: "Tomato", quantity: 2, unit: "pcs", category: "vegetables", freshness_days: 7 },
          { name: "Cooking Oil", quantity: 15, unit: "ml", category: "pantry", freshness_days: 180 },
          { name: "Salt", quantity: 5, unit: "g", category: "pantry", freshness_days: 365 },
        ],
      });
    }
  }
  return { summary: "Balanced Indian weekly plan focused on home-style comfort meals.", meals };
}

export const generateWeeklyPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GenerateInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: prefs } = await supabase
      .from("preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const p = PrefsInput.parse(
      prefs ?? {
        diet: "vegetarian",
        cuisines: ["Indian"],
        health_goals: ["balanced"],
        allergies: [],
        household_size: 2,
        spice_level: "medium",
        cook_time_minutes: 30,
        budget_weekly: 2000,
      },
    );

    let plan: Plan;
    try {
      const { callAiJson } = await import("./ai-gateway.server");
      const raw = await callAiJson<unknown>({
        messages: [
          {
            role: "system",
            content:
              "You are a meal-planning chef for Blinkit India. Output strict JSON only. Use realistic Indian groceries. Be concise.",
          },
          {
            role: "user",
            content: `Generate a 7-day meal plan with breakfast, lunch, dinner (21 meals total).
Preferences:
- diet: ${p.diet}
- cuisines: ${p.cuisines.join(", ") || "Indian"}
- health goals: ${p.health_goals.join(", ") || "balanced"}
- allergies: ${p.allergies.join(", ") || "none"}
- household size: ${p.household_size}
- max cook time: ${p.cook_time_minutes} minutes
- spice level: ${p.spice_level}
- weekly grocery budget INR: ${p.budget_weekly}

Vary cuisines and ingredients. Avoid repeats. Optimize for freshness (use perishables early in week).

Return JSON:
{
  "summary": "1-sentence theme",
  "meals": [
    {
      "day_index": 0..6,
      "slot": "breakfast" | "lunch" | "dinner",
      "name": "string",
      "description": "1 line",
      "cuisine": "string",
      "image_emoji": "single emoji",
      "calories": int,
      "protein_g": int,
      "prep_minutes": int,
      "recipe_steps": ["step1","step2","step3","step4"],
      "ingredients": [{"name":"...","quantity":number,"unit":"g|ml|pcs|tbsp","category":"vegetables|fruits|dairy|grains|protein|pantry|spices","freshness_days":int}]
    }
  ]
}`,
          },
        ],
      });
      plan = PlanSchema.parse(raw);
    } catch (err) {
      console.error("AI plan failed, using fallback:", err);
      plan = fallbackPlan();
    }

    // Archive previous active plans for same week
    await supabase
      .from("meal_plans")
      .update({ status: "archived" })
      .eq("user_id", userId)
      .eq("status", "active");

    const { data: newPlan, error: planErr } = await supabase
      .from("meal_plans")
      .insert({ user_id: userId, week_start: data.week_start, summary: plan.summary, status: "active" })
      .select()
      .single();
    if (planErr || !newPlan) throw planErr ?? new Error("Plan insert failed");

    const mealRows = plan.meals.map((m) => ({
      plan_id: newPlan.id,
      user_id: userId,
      day_index: m.day_index,
      slot: m.slot,
      name: m.name,
      description: m.description,
      cuisine: m.cuisine,
      image_emoji: m.image_emoji,
      calories: m.calories,
      protein_g: m.protein_g,
      prep_minutes: m.prep_minutes,
      recipe_steps: m.recipe_steps,
    }));
    const { data: mealsInserted, error: mealsErr } = await supabase
      .from("meals")
      .insert(mealRows)
      .select();
    if (mealsErr || !mealsInserted) throw mealsErr ?? new Error("Meals insert failed");

    // Map back ingredients
    const ingRows: Array<{
      meal_id: string;
      user_id: string;
      name: string;
      quantity: number;
      unit: string;
      category: string;
      freshness_days: number;
    }> = [];
    plan.meals.forEach((m, idx) => {
      const dbMeal = mealsInserted[idx];
      m.ingredients.forEach((ing) =>
        ingRows.push({
          meal_id: dbMeal.id,
          user_id: userId,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          category: ing.category,
          freshness_days: ing.freshness_days,
        }),
      );
    });
    if (ingRows.length) await supabase.from("ingredients").insert(ingRows);

    // Build aggregated grocery basket (dedupe by name+unit, sum quantities)
    const map = new Map<string, { name: string; quantity: number; unit: string; category: string; freshness_days: number }>();
    for (const r of ingRows) {
      const key = `${r.name.toLowerCase()}|${r.unit}`;
      const existing = map.get(key);
      if (existing) existing.quantity += r.quantity;
      else map.set(key, { name: r.name, quantity: r.quantity, unit: r.unit, category: r.category, freshness_days: r.freshness_days });
    }
    const aggregated = Array.from(map.values());

    // Pricing heuristic by category (INR)
    const priceFor = (cat: string, qty: number, unit: string) => {
      const base: Record<string, number> = {
        vegetables: 0.08, fruits: 0.15, dairy: 0.2, grains: 0.1, protein: 0.5, pantry: 0.05, spices: 0.8,
      };
      const perUnit = base[cat] ?? 0.1;
      const factor = unit === "g" || unit === "ml" ? 1 : unit === "pcs" ? 20 : 10;
      return Math.max(15, Math.round(qty * perUnit * factor));
    };
    const emojiFor = (cat: string) =>
      ({ vegetables: "🥬", fruits: "🍎", dairy: "🥛", grains: "🌾", protein: "🥚", pantry: "🧂", spices: "🌶️" })[cat] ?? "🛒";

    let totalValue = 0;
    const basketItemsData = aggregated.map((a) => {
      const price = priceFor(a.category, a.quantity, a.unit);
      totalValue += price;
      return { ...a, price, image_emoji: emojiFor(a.category) };
    });

    const { data: basket, error: basketErr } = await supabase
      .from("grocery_baskets")
      .insert({
        plan_id: newPlan.id,
        user_id: userId,
        total_items: basketItemsData.length,
        total_value: totalValue,
        status: "ready",
      })
      .select()
      .single();
    if (basketErr || !basket) throw basketErr ?? new Error("Basket insert failed");

    await supabase.from("basket_items").insert(
      basketItemsData.map((b) => ({
        basket_id: basket.id,
        user_id: userId,
        name: b.name,
        quantity: b.quantity,
        unit: b.unit,
        category: b.category,
        price: b.price,
        freshness_days: b.freshness_days,
        image_emoji: b.image_emoji,
      })),
    );

    // Smart delivery schedule: split into 3 drops based on freshness
    const weekStartDate = new Date(data.week_start);
    const drops = [
      { offset: 0, label: "Day 1 — Pantry + Long-life", maxFresh: 365, slot: "07:00-08:00" },
      { offset: 0, label: "Day 1 — Fresh produce", maxFresh: 30, slot: "10:00-11:00" },
      { offset: 3, label: "Mid-week top-up", maxFresh: 7, slot: "09:00-10:00" },
    ];
    const used = new Set<number>();
    const deliveryRows = drops.map((d, di) => {
      const items = basketItemsData.filter((b, i) => {
        if (used.has(i)) return false;
        // Day 1 long-life: freshness > 30; Day 1 fresh: 8-30; Day 4: <=7
        if (di === 0 && b.freshness_days > 30) { used.add(i); return true; }
        if (di === 1 && b.freshness_days > 7 && b.freshness_days <= 30) { used.add(i); return true; }
        if (di === 2 && b.freshness_days <= 7) { used.add(i); return true; }
        return false;
      });
      const date = new Date(weekStartDate);
      date.setDate(date.getDate() + d.offset);
      return {
        basket_id: basket.id,
        user_id: userId,
        slot_date: date.toISOString().slice(0, 10),
        slot_window: d.slot,
        label: d.label,
        status: "scheduled",
        items: items.map((i) => ({ name: i.name, quantity: i.quantity, unit: i.unit, emoji: i.image_emoji })),
      };
    });
    // Anything leftover -> day 1 long-life
    basketItemsData.forEach((b, i) => {
      if (!used.has(i)) deliveryRows[0].items.push({ name: b.name, quantity: b.quantity, unit: b.unit, emoji: b.image_emoji });
    });

    await supabase.from("delivery_schedules").insert(deliveryRows);

    // Stats row
    await supabase.from("weekly_stats").upsert(
      {
        user_id: userId,
        week_start: data.week_start,
        meals_completed: 0,
        total_meals: mealsInserted.length,
        streak_days: 0,
        waste_reduction_kg: 1.4,
        utilization_pct: 0,
      },
      { onConflict: "user_id,week_start" },
    );

    return { plan_id: newPlan.id };
  });

export const toggleMealComplete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ meal_id: z.string().uuid(), completed: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase
      .from("meals")
      .update({ completed: data.completed, completed_at: data.completed ? new Date().toISOString() : null })
      .eq("id", data.meal_id)
      .eq("user_id", userId);

    // recompute stats for the plan's week
    const { data: meal } = await supabase.from("meals").select("plan_id").eq("id", data.meal_id).single();
    if (meal) {
      const { data: plan } = await supabase.from("meal_plans").select("week_start").eq("id", meal.plan_id).single();
      const { data: allMeals } = await supabase.from("meals").select("completed").eq("plan_id", meal.plan_id);
      if (plan && allMeals) {
        const completed = allMeals.filter((m) => m.completed).length;
        const total = allMeals.length;
        await supabase.from("weekly_stats").upsert(
          {
            user_id: userId,
            week_start: plan.week_start,
            meals_completed: completed,
            total_meals: total,
            streak_days: Math.min(7, Math.floor(completed / 3)),
            utilization_pct: total ? Math.round((completed / total) * 100) : 0,
            waste_reduction_kg: Number((completed * 0.08).toFixed(2)),
          },
          { onConflict: "user_id,week_start" },
        );
      }
    }
    return { ok: true };
  });

export const rescheduleDelivery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ delivery_id: z.string().uuid(), slot_date: z.string(), slot_window: z.string() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase
      .from("delivery_schedules")
      .update({ slot_date: data.slot_date, slot_window: data.slot_window })
      .eq("id", data.delivery_id)
      .eq("user_id", userId);
    return { ok: true };
  });

export const replaceMeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ meal_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: meal } = await supabase.from("meals").select("*").eq("id", data.meal_id).eq("user_id", userId).single();
    if (!meal) throw new Error("Meal not found");

    const alternates: Record<string, Array<{ name: string; emoji: string; cuisine: string }>> = {
      breakfast: [
        { name: "Moong Dal Cheela", emoji: "🥞", cuisine: "Indian" },
        { name: "Avocado Toast", emoji: "🥑", cuisine: "Continental" },
        { name: "Vegetable Dosa", emoji: "🫓", cuisine: "South Indian" },
        { name: "Fruit & Yogurt Bowl", emoji: "🥣", cuisine: "Healthy" },
      ],
      lunch: [
        { name: "Quinoa Buddha Bowl", emoji: "🥗", cuisine: "Healthy" },
        { name: "Veg Thali", emoji: "🍛", cuisine: "Indian" },
        { name: "Stir-fried Noodles", emoji: "🍜", cuisine: "Asian" },
        { name: "Hummus Wrap", emoji: "🌯", cuisine: "Mediterranean" },
      ],
      dinner: [
        { name: "Grilled Paneer Skewers", emoji: "🍢", cuisine: "Indian" },
        { name: "Pumpkin Soup + Bread", emoji: "🍲", cuisine: "Continental" },
        { name: "Veg Khao Suey", emoji: "🍜", cuisine: "Burmese" },
        { name: "Stuffed Capsicum", emoji: "🫑", cuisine: "Indian" },
      ],
    };
    const pool = alternates[meal.slot as keyof typeof alternates] ?? alternates.lunch;
    const pick = pool[Math.floor(Math.random() * pool.length)];

    await supabase
      .from("meals")
      .update({
        name: pick.name,
        cuisine: pick.cuisine,
        image_emoji: pick.emoji,
        description: "Fresh swap — picked just for you.",
      })
      .eq("id", data.meal_id);
    return { ok: true };
  });
