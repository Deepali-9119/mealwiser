import { Link } from "@tanstack/react-router";
import { Home, CalendarDays, ShoppingBasket, Truck, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = { to: string; label: string; icon: typeof Home; exact?: boolean };
const tabs: Tab[] = [
  { to: "/app", label: "Home", icon: Home, exact: true },
  { to: "/app/plan", label: "Plan", icon: CalendarDays },
  { to: "/app/groceries", label: "Basket", icon: ShoppingBasket },
  { to: "/app/deliveries", label: "Drops", icon: Truck },
  { to: "/app/dashboard", label: "Stats", icon: BarChart3 },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <li key={t.to} className="flex-1">
              <Link
                to={t.to}
                activeOptions={{ exact: t.exact ?? false }}
                className="group flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium text-muted-foreground data-[status=active]:text-success"
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full transition",
                        isActive && "bg-[oklch(0.93_0.08_142)]",
                      )}
                    >
                      <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
                    </span>
                    <span>{t.label}</span>
                  </>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
