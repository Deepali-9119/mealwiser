
-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- preferences
CREATE TABLE public.preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  diet TEXT NOT NULL DEFAULT 'vegetarian',
  cuisines TEXT[] NOT NULL DEFAULT '{}',
  health_goals TEXT[] NOT NULL DEFAULT '{}',
  allergies TEXT[] NOT NULL DEFAULT '{}',
  household_size INT NOT NULL DEFAULT 2,
  spice_level TEXT NOT NULL DEFAULT 'medium',
  cook_time_minutes INT NOT NULL DEFAULT 30,
  budget_weekly INT NOT NULL DEFAULT 2000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.preferences TO authenticated;
GRANT ALL ON public.preferences TO service_role;
ALTER TABLE public.preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own prefs all" ON public.preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- meal_plans
CREATE TABLE public.meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX meal_plans_user_idx ON public.meal_plans(user_id, week_start DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meal_plans TO authenticated;
GRANT ALL ON public.meal_plans TO service_role;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own plans" ON public.meal_plans FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- meals
CREATE TABLE public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.meal_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_index INT NOT NULL,
  slot TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cuisine TEXT,
  recipe_steps TEXT[] NOT NULL DEFAULT '{}',
  image_emoji TEXT DEFAULT '🍽️',
  calories INT,
  protein_g INT,
  prep_minutes INT,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX meals_plan_idx ON public.meals(plan_id, day_index, slot);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meals TO authenticated;
GRANT ALL ON public.meals TO service_role;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own meals" ON public.meals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ingredients
CREATE TABLE public.ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'pcs',
  category TEXT NOT NULL DEFAULT 'pantry',
  freshness_days INT NOT NULL DEFAULT 7
);
CREATE INDEX ingredients_meal_idx ON public.ingredients(meal_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ingredients TO authenticated;
GRANT ALL ON public.ingredients TO service_role;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ingredients" ON public.ingredients FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- grocery_baskets
CREATE TABLE public.grocery_baskets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.meal_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_items INT NOT NULL DEFAULT 0,
  total_value NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.grocery_baskets TO authenticated;
GRANT ALL ON public.grocery_baskets TO service_role;
ALTER TABLE public.grocery_baskets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own baskets" ON public.grocery_baskets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- basket_items
CREATE TABLE public.basket_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  basket_id UUID NOT NULL REFERENCES public.grocery_baskets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'pcs',
  category TEXT NOT NULL DEFAULT 'pantry',
  price NUMERIC NOT NULL DEFAULT 0,
  freshness_days INT NOT NULL DEFAULT 7,
  image_emoji TEXT DEFAULT '🛒'
);
CREATE INDEX basket_items_basket_idx ON public.basket_items(basket_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.basket_items TO authenticated;
GRANT ALL ON public.basket_items TO service_role;
ALTER TABLE public.basket_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own basket_items" ON public.basket_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- delivery_schedules
CREATE TABLE public.delivery_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  basket_id UUID NOT NULL REFERENCES public.grocery_baskets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  slot_window TEXT NOT NULL DEFAULT '10:00-11:00',
  label TEXT NOT NULL DEFAULT 'Drop',
  status TEXT NOT NULL DEFAULT 'scheduled',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.delivery_schedules TO authenticated;
GRANT ALL ON public.delivery_schedules TO service_role;
ALTER TABLE public.delivery_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own deliveries" ON public.delivery_schedules FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- weekly_stats
CREATE TABLE public.weekly_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  meals_completed INT NOT NULL DEFAULT 0,
  total_meals INT NOT NULL DEFAULT 0,
  streak_days INT NOT NULL DEFAULT 0,
  waste_reduction_kg NUMERIC NOT NULL DEFAULT 0,
  utilization_pct NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_stats TO authenticated;
GRANT ALL ON public.weekly_stats TO service_role;
ALTER TABLE public.weekly_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own stats" ON public.weekly_stats FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- profile auto-create
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
