import { cn } from "@/lib/utils";

export function Logo({ className, showWord = true }: { className?: string; showWord?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl brand-gradient text-brand-foreground font-black text-lg shadow-[var(--shadow-brand)]">
        b
      </div>
      {showWord && (
        <div className="leading-none">
          <div className="text-base font-black tracking-tight">blinkit</div>
          <div className="text-[10px] font-semibold text-success">Meal Planner</div>
        </div>
      )}
    </div>
  );
}
