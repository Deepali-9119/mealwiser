import { Logo } from "./Logo";
import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";

export function AppHeader({ subtitle }: { subtitle?: string }) {
  return (
    <header className="sticky top-0 z-30 brand-gradient pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="mx-auto flex max-w-md items-center justify-between px-4">
        <Link to="/app">
          <Logo />
        </Link>
        <button
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/40 text-brand-foreground"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-success" />
        </button>
      </div>
      {subtitle && (
        <div className="mx-auto mt-2 max-w-md px-4 text-sm font-semibold text-brand-foreground/80">
          {subtitle}
        </div>
      )}
    </header>
  );
}
