import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Plane, LogOut } from "lucide-react";
import { useAuthUser } from "@/components/RequireAuth";

export default function AppDashboard() {
  const user = useAuthUser();
  const navigate = useNavigate();

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/sign-in", { replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--gradient-radial)" }}
      />
      <header className="container mx-auto flex items-center justify-between px-6 py-6 relative">
        <div className="flex items-center gap-2 font-bold">
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "var(--gradient-hero)" }}
          >
            <Plane className="h-4 w-4 text-primary-foreground" />
          </span>
          Flight Price Notifier
        </div>
        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary/50"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </header>

      <main className="container mx-auto px-6 py-16 relative animate-fade-in-up">
        <h1 className="text-3xl font-bold md:text-4xl">
          Hi <span className="text-primary">{user.email}</span>
        </h1>
        <div className="mt-8 max-w-2xl rounded-2xl border border-border bg-card p-8">
          <p className="text-lg font-semibold">你的航線追蹤儀表板即將上線</p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            下一個里程碑會加上訂閱航線的功能。
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Your dashboard is coming soon. Route-subscription will be added in the next milestone.
          </p>
        </div>
      </main>
    </div>
  );
}