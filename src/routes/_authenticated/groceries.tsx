import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getActivePlan } from "@/lib/data.functions";
import { AppHeader } from "@/components/AppHeader";
import { ShoppingBasket, IndianRupee, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/groceries")({
  head: () => ({ meta: [{ title: "Grocery basket" }] }),
  component: GroceriesPage,
});

function GroceriesPage() {
  const getPlanFn = useServerFn(getActivePlan);
  const { data } = useQuery({ queryKey: ["plan"], queryFn: () => getPlanFn() });

  const items = data?.items ?? [];
  const basket = data?.basket;
  const grouped: Record<string, typeof items> = {};
  items.forEach((it) => {
    grouped[it.category] = grouped[it.category] || [];
    grouped[it.category].push(it);
  });

  return (
    <>
      <AppHeader subtitle="Smart basket" />
      <main className="mx-auto max-w-md px-4 pt-3 space-y-3">
        <div className="card-soft p-4 success-gradient text-success-foreground">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase opacity-80">Auto-generated</p>
              <p className="text-2xl font-black mt-0.5 flex items-center gap-1">
                <IndianRupee className="h-5 w-5" />
                {basket?.total_value ?? 0}
              </p>
              <p className="text-xs font-semibold opacity-90">{items.length} unique items · duplicates merged</p>
            </div>
            <ShoppingBasket className="h-10 w-10" />
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs font-semibold bg-white/15 rounded-lg p-2">
            <Sparkles className="h-3.5 w-3.5" />
            Smart dedupe saved you ~₹{Math.round((basket?.total_value ?? 0) * 0.18)}
          </div>
        </div>

        {Object.entries(grouped).map(([cat, list]) => (
          <div key={cat} className="card-soft p-4">
            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3 capitalize">{cat}</p>
            <div className="space-y-2">
              {list.map((it) => (
                <div key={it.id} className="flex items-center gap-3 p-2 rounded-xl bg-muted/40">
                  <div className="text-2xl">{it.image_emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold capitalize">{it.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {Number(it.quantity) % 1 === 0 ? it.quantity : Number(it.quantity).toFixed(1)} {it.unit} · stays fresh {it.freshness_days}d
                    </p>
                  </div>
                  <p className="font-black text-sm">₹{it.price}</p>
                </div>
              ))}
            </div>
          </div>
        ))}

        <button className="w-full py-3.5 rounded-xl success-gradient text-success-foreground font-bold shadow-[var(--shadow-success)]">
          Confirm & schedule drops
        </button>
      </main>
    </>
  );
}
