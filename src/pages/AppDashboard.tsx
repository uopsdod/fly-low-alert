import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Plane, LogOut, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthUser } from "@/components/RequireAuth";

// Public HTTP API endpoints (not secrets). Override via VITE_API_BASE_URL if needed.
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ??
  "https://voqomtriai.execute-api.us-east-1.amazonaws.com";
const SUBSCRIBE_URL = `${API_BASE}/subscribe`;
const LIST_URL = `${API_BASE}/subscriptions`;

// The two fixed plans — must match the Lambda's PLANS map.
const PLANS = [
  { plan_name: "tokyo", title: "台北 ✈ 東京", sub: "TPE → TYO", hint: 9531 },
  { plan_name: "seoul", title: "台北 ✈ 首爾", sub: "TPE → SEL", hint: 5989 },
] as const;

type Subscription = {
  plan_name: string;
  route: string;
  target_price: number;
};

export default function AppDashboard() {
  const user = useAuthUser();
  const navigate = useNavigate();
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  // plan_name -> existing subscription (the durable DynamoDB row)
  const [subs, setSubs] = useState<Record<string, Subscription>>({});
  const [loadingSubs, setLoadingSubs] = useState(true);

  async function loadSubscriptions() {
    setLoadingSubs(true);
    try {
      const res = await fetch(`${LIST_URL}?email=${encodeURIComponent(user.email ?? "")}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data?.subscriptions)) {
        const map: Record<string, Subscription> = {};
        for (const s of data.subscriptions as Subscription[]) map[s.plan_name] = s;
        setSubs(map);
      }
    } catch {
      // non-fatal: the cards just won't show prior state
    } finally {
      setLoadingSubs(false);
    }
  }

  useEffect(() => {
    loadSubscriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      // reflect the new durable subscription immediately
      setSubs((s) => ({
        ...s,
        [plan_name]: data.subscription ?? { plan_name, route: "", target_price },
      }));
      setPrices((s) => ({ ...s, [plan_name]: "" }));
      toast.success(
        `已訂閱 ${plan_name === "tokyo" ? "台北✈東京" : "台北✈首爾"}，目標價 NT$${target_price.toLocaleString()}`,
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
          {PLANS.map((p) => {
            const sub = subs[p.plan_name];
            const subscribed = Boolean(sub);
            return (
              <div
                key={p.plan_name}
                className={`rounded-2xl border bg-card p-6 flex flex-col transition-colors ${
                  subscribed ? "border-primary" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Plane className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold">{p.title}</h2>
                  </div>
                  {subscribed && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      已訂閱 / Subscribed
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{p.sub}</p>

                {subscribed ? (
                  <>
                    <div className="mt-5 rounded-lg border border-border bg-input px-3 py-3 text-sm">
                      <span className="text-muted-foreground">目前目標價 / Target</span>
                      <div className="mt-0.5 text-lg font-bold text-foreground">
                        NT${Number(sub.target_price).toLocaleString()}
                      </div>
                    </div>
                    <label className="mt-4 text-xs font-medium text-muted-foreground">
                      想調整？輸入新的目標價 / Update target (TWD)
                    </label>
                  </>
                ) : (
                  <>
                    <p className="mt-1 text-xs text-muted-foreground">
                      目前最低約 NT${p.hint.toLocaleString()}
                    </p>
                    <label className="mt-5 text-xs font-medium text-muted-foreground">
                      目標價 / Target price (TWD)
                    </label>
                  </>
                )}

                <input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={prices[p.plan_name] ?? ""}
                  onChange={(e) =>
                    setPrices((s) => ({ ...s, [p.plan_name]: e.target.value }))
                  }
                  placeholder={String(subscribed ? sub.target_price : p.hint)}
                  className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                />

                <button
                  onClick={() => subscribe(p.plan_name)}
                  disabled={busy === p.plan_name || loadingSubs}
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.01] disabled:opacity-60"
                  style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-glow)" }}
                >
                  {busy === p.plan_name && <Loader2 className="h-4 w-4 animate-spin" />}
                  {subscribed ? "更新目標價 / Update" : "開始追蹤 / Start tracking"}
                </button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
