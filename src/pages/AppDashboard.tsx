import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Plane, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthUser } from "@/components/RequireAuth";

// Public HTTP API endpoint (not a secret). Override via VITE_SUBSCRIBE_API_URL if needed.
const SUBSCRIBE_URL =
  import.meta.env.VITE_SUBSCRIBE_API_URL ??
  "https://voqomtriai.execute-api.us-east-1.amazonaws.com/subscribe";

// The two fixed plans — must match the Lambda's PLANS map.
const PLANS = [
  {
    plan_name: "tokyo",
    title: "台北 ✈ 東京",
    sub: "TPE → TYO",
    hint: 9531,
  },
  {
    plan_name: "seoul",
    title: "台北 ✈ 首爾",
    sub: "TPE → SEL",
    hint: 5989,
  },
] as const;

export default function AppDashboard() {
  const user = useAuthUser();
  const navigate = useNavigate();
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/sign-in", { replace: true });
  }

  async function subscribe(plan_name: string) {
    const raw = prices[plan_name];
    const target_price = Number(raw);
    if (!raw || !Number.isFinite(target_price) || target_price <= 0) {
      toast.error("請先輸入有效的目標價 (TWD)");
      return;
    }
    setBusy(plan_name);
    try {
      const res = await fetch(SUBSCRIBE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, plan_name, target_price }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      toast.success(
        `已開始追蹤 ${plan_name === "tokyo" ? "台北✈東京" : "台北✈首爾"}，目標價 NT$${target_price.toLocaleString()}`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "訂閱失敗，請稍後再試");
    } finally {
      setBusy(null);
    }
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

      <main className="container mx-auto px-6 py-12 relative animate-fade-in-up">
        <h1 className="text-3xl font-bold md:text-4xl">
          Hi <span className="text-primary">{user.email}</span>
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          選一條航線，設定你的目標價 (TWD)。當機票降到目標價以下，我們就會通知你。
          <br />
          Pick a route and set your target price in TWD — we’ll alert you when the fare drops below it.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 max-w-3xl">
          {PLANS.map((p) => (
            <div
              key={p.plan_name}
              className="rounded-2xl border border-border bg-card p-6 flex flex-col"
            >
              <div className="flex items-center gap-2">
                <Plane className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">{p.title}</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{p.sub}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                目前最低約 NT${p.hint.toLocaleString()}
              </p>

              <label className="mt-5 text-xs font-medium text-muted-foreground">
                目標價 / Target price (TWD)
              </label>
              <input
                type="number"
                min={1}
                inputMode="numeric"
                value={prices[p.plan_name] ?? ""}
                onChange={(e) =>
                  setPrices((s) => ({ ...s, [p.plan_name]: e.target.value }))
                }
                placeholder={String(p.hint)}
                className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />

              <button
                onClick={() => subscribe(p.plan_name)}
                disabled={busy === p.plan_name}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.01] disabled:opacity-60"
                style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-glow)" }}
              >
                {busy === p.plan_name && <Loader2 className="h-4 w-4 animate-spin" />}
                開始追蹤 / Start tracking
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
