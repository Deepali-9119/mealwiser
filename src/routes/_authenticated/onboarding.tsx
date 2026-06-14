import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getProfile, savePreferences } from "@/lib/data.functions";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { ChevronRight, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Tell us about your week" }] }),
  component: OnboardingPage,
});

const DIETS = ["vegetarian", "vegan", "non-vegetarian", "eggetarian", "jain"];
const CUISINES = ["Indian", "South Indian", "Continental", "Asian", "Mediterranean", "Mexican"];
const GOALS = ["weight loss", "muscle gain", "balanced", "high protein", "low carb", "diabetic friendly"];
const ALLERGIES = ["dairy", "nuts", "gluten", "soy", "shellfish"];

function OnboardingPage() {
  const navigate = useNavigate();
  const getProfileFn = useServerFn(getProfile);
  const saveFn = useServerFn(savePreferences);
  const { data: prof } = useQuery({ queryKey: ["profile"], queryFn: () => getProfileFn() });

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [diet, setDiet] = useState("vegetarian");
  const [cuisines, setCuisines] = useState<string[]>(["Indian"]);
  const [goals, setGoals] = useState<string[]>(["balanced"]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [household, setHousehold] = useState(2);
  const [cookTime, setCookTime] = useState(30);
  const [budget, setBudget] = useState(2000);
  const [spice, setSpice] = useState("medium");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (prof?.profile?.full_name) setName(prof.profile.full_name);
  }, [prof]);

  const toggle = (arr: string[], setter: (v: string[]) => void, v: string) =>
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  async function handleSave() {
    setSaving(true);
    try {
      await saveFn({
        data: {
          diet,
          cuisines,
          health_goals: goals,
          allergies,
          household_size: household,
          spice_level: spice,
          cook_time_minutes: cookTime,
          budget_weekly: budget,
          full_name: name,
        },
      });
      toast.success("All set!");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save");
    } finally {
      setSaving(false);
    }
  }

  const steps = [
    {
      title: "What do you eat?",
      sub: "We'll respect this every meal.",
      body: (
        <div className="space-y-2">
          <input
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-input bg-card outline-none focus:border-success focus:ring-2 focus:ring-success/20"
          />
          <div className="grid grid-cols-2 gap-2 pt-2">
            {DIETS.map((d) => (
              <Chip key={d} active={diet === d} onClick={() => setDiet(d)} label={d} />
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "Pick your cuisines",
      sub: "Multi-select — we'll mix them up.",
      body: (
        <div className="flex flex-wrap gap-2">
          {CUISINES.map((c) => (
            <Chip key={c} active={cuisines.includes(c)} onClick={() => toggle(cuisines, setCuisines, c)} label={c} />
          ))}
        </div>
      ),
    },
    {
      title: "Your health goals",
      sub: "Helps us balance protein & calories.",
      body: (
        <div className="flex flex-wrap gap-2">
          {GOALS.map((g) => (
            <Chip key={g} active={goals.includes(g)} onClick={() => toggle(goals, setGoals, g)} label={g} />
          ))}
        </div>
      ),
    },
    {
      title: "Allergies?",
      sub: "We'll avoid these completely.",
      body: (
        <div className="flex flex-wrap gap-2">
          {ALLERGIES.map((a) => (
            <Chip key={a} active={allergies.includes(a)} onClick={() => toggle(allergies, setAllergies, a)} label={a} />
          ))}
        </div>
      ),
    },
    {
      title: "Cooking & basket",
      sub: "Tune for time and budget.",
      body: (
        <div className="space-y-5">
          <Slider label="Household size" value={household} setValue={setHousehold} min={1} max={8} suffix="people" />
          <Slider label="Max cook time" value={cookTime} setValue={setCookTime} min={15} max={90} step={5} suffix="min" />
          <Slider label="Weekly grocery budget" value={budget} setValue={setBudget} min={800} max={8000} step={100} suffix="₹" prefix />
          <div>
            <p className="text-sm font-bold mb-2">Spice level</p>
            <div className="grid grid-cols-3 gap-2">
              {["mild", "medium", "spicy"].map((s) => (
                <Chip key={s} active={spice === s} onClick={() => setSpice(s)} label={s} />
              ))}
            </div>
          </div>
        </div>
      ),
    },
  ];

  const isLast = step === steps.length - 1;
  const current = steps[step];

  return (
    <div className="min-h-screen bg-background">
      <div className="brand-gradient px-6 pt-12 pb-8">
        <Logo />
      </div>
      <div className="-mt-6 bg-background rounded-t-3xl p-6 max-w-md mx-auto">
        <div className="flex gap-1 mb-6">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition ${i <= step ? "bg-success" : "bg-muted"}`} />
          ))}
        </div>
        <h2 className="text-2xl font-black tracking-tight">{current.title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{current.sub}</p>
        <div className="mt-6">{current.body}</div>
        <div className="flex gap-2 mt-8">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="flex-1 py-3 rounded-xl border border-border font-semibold">
              Back
            </button>
          )}
          {!isLast ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex-[2] py-3 rounded-xl success-gradient text-success-foreground font-bold shadow-[var(--shadow-success)] flex items-center justify-center gap-1"
            >
              Continue <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-[2] py-3 rounded-xl success-gradient text-success-foreground font-bold shadow-[var(--shadow-success)] flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Finish setup
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 rounded-full text-sm font-semibold capitalize border transition ${
        active ? "bg-success text-success-foreground border-success" : "bg-card border-border text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function Slider({
  label, value, setValue, min, max, step = 1, suffix = "", prefix = false,
}: { label: string; value: number; setValue: (v: number) => void; min: number; max: number; step?: number; suffix?: string; prefix?: boolean }) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-sm font-bold">{label}</span>
        <span className="text-success font-black">{prefix ? `${suffix}${value}` : `${value} ${suffix}`}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full accent-success"
      />
    </div>
  );
}
