import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getActivePlan } from "@/lib/data.functions";
import { rescheduleDelivery } from "@/lib/meal-planner.functions";
import { AppHeader } from "@/components/AppHeader";
import { Truck, Calendar, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/deliveries")({
  head: () => ({ meta: [{ title: "Delivery schedule" }] }),
  component: DeliveriesPage,
});

type DeliveryItem = { name: string; quantity: number; unit: string; emoji: string };

function DeliveriesPage() {
  const getPlanFn = useServerFn(getActivePlan);
  const rescheduleFn = useServerFn(rescheduleDelivery);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["plan"], queryFn: () => getPlanFn() });
  const [editing, setEditing] = useState<string | null>(null);

  const reschedule = useMutation({
    mutationFn: (vars: { delivery_id: string; slot_date: string; slot_window: string }) =>
      rescheduleFn({ data: vars }),
    onSuccess: () => {
      toast.success("Delivery rescheduled");
      qc.invalidateQueries({ queryKey: ["plan"] });
      setEditing(null);
    },
  });

  return (
    <>
      <AppHeader subtitle="Smart drops" />
      <main className="mx-auto max-w-md px-4 pt-3 space-y-3">
        <div className="card-soft p-4 brand-gradient text-brand-foreground">
          <div className="flex items-center gap-3">
            <Truck className="h-8 w-8" />
            <div>
              <p className="font-black">Split for freshness</p>
              <p className="text-xs font-semibold opacity-80">We deliver perishables closer to when you'll cook them.</p>
            </div>
          </div>
        </div>

        {(data?.deliveries ?? []).map((d) => {
          const items = (d.items as DeliveryItem[]) ?? [];
          return (
            <div key={d.id} className="card-soft p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-sm">{d.label}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{d.slot_date}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{d.slot_window}</span>
                  </div>
                </div>
                <button
                  onClick={() => setEditing(editing === d.id ? null : d.id)}
                  className="chip chip-brand"
                >
                  Reschedule
                </button>
              </div>

              {editing === d.id && (
                <RescheduleForm
                  defaultDate={d.slot_date}
                  defaultWindow={d.slot_window}
                  onSave={(slot_date, slot_window) =>
                    reschedule.mutate({ delivery_id: d.id, slot_date, slot_window })
                  }
                />
              )}

              <div className="mt-3 flex flex-wrap gap-1.5">
                {items.slice(0, 8).map((it, i) => (
                  <span key={i} className="chip">
                    {it.emoji} {it.name}
                  </span>
                ))}
                {items.length > 8 && <span className="chip">+{items.length - 8} more</span>}
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 font-semibold">{items.length} items in this drop</p>
            </div>
          );
        })}
      </main>
    </>
  );
}

function RescheduleForm({ defaultDate, defaultWindow, onSave }: { defaultDate: string; defaultWindow: string; onSave: (d: string, w: string) => void }) {
  const [date, setDate] = useState(defaultDate);
  const [window, setWindow] = useState(defaultWindow);
  const slots = ["07:00-08:00", "09:00-10:00", "11:00-12:00", "16:00-17:00", "19:00-20:00"];
  return (
    <div className="mt-3 p-3 rounded-xl bg-muted/50 space-y-2">
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm"
      />
      <div className="flex flex-wrap gap-1.5">
        {slots.map((s) => (
          <button
            key={s}
            onClick={() => setWindow(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold ${
              window === s ? "bg-success text-success-foreground" : "bg-card border border-border"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <button onClick={() => onSave(date, window)} className="w-full py-2 rounded-lg success-gradient text-success-foreground font-bold text-sm">
        Save
      </button>
    </div>
  );
}
