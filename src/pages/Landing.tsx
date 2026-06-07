import { Link } from "react-router-dom";
import { Plane, BellRing, XCircle } from "lucide-react";

const features = [
  {
    icon: Plane,
    titleZh: "盯緊熱門航線",
    titleEn: "Always-on route watching",
    body: "持續監控台北出發的熱門航線（東京、首爾），自動抓最低票價。",
  },
  {
    icon: BellRing,
    titleZh: "達標自動通知",
    titleEn: "Target-price email alerts",
    body: "低於你設定的目標價，就寄 email 提醒你，附上立即訂購連結。",
  },
  {
    icon: XCircle,
    titleZh: "隨時取消",
    titleEn: "Cancel anytime",
    body: "月訂閱制，不想用隨時停，沒有綁約。",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "var(--gradient-radial)" }}
      />
      <header className="container mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 font-bold text-lg">
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "var(--gradient-hero)" }}
          >
            <Plane className="h-4 w-4 text-primary-foreground" />
          </span>
          <span>Flight Price Notifier</span>
        </div>
        <Link
          to="/sign-in"
          className="rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105"
          style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-glow)" }}
        >
          Sign in / 登入
        </Link>
      </header>

      <main>
        <section className="container mx-auto px-6 pt-20 pb-32 text-center animate-fade-in-up">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-primary">
            Taipei · 台北出發
          </p>
          <h1 className="mx-auto max-w-4xl text-5xl font-extrabold leading-tight tracking-tight md:text-7xl">
            Flight Price{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-hero)" }}
            >
              Notifier
            </span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-2xl font-semibold text-foreground/90 md:text-3xl">
            設定航線與目標價，機票降價就通知你
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            Set a route and a target price — we email you when the fare drops.
          </p>
          <div className="mt-10 flex justify-center">
            <Link
              to="/sign-up"
              className="rounded-xl px-8 py-4 text-base font-semibold text-primary-foreground transition-transform hover:scale-105"
              style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-glow)" }}
            >
              Get started — 立即註冊
            </Link>
          </div>
        </section>

        <section className="container mx-auto px-6 pb-32">
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((f, i) => (
              <div
                key={f.titleEn}
                className="rounded-2xl border border-border bg-card p-8 transition-all hover:border-primary/50 hover:-translate-y-1 animate-fade-in-up"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <div
                  className="inline-flex h-12 w-12 items-center justify-center rounded-xl mb-5"
                  style={{ background: "var(--gradient-hero)" }}
                >
                  <f.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold">{f.titleZh}</h3>
                <p className="mt-1 text-sm text-primary">{f.titleEn}</p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="container mx-auto px-6 py-8 text-center text-sm text-muted-foreground">
          © 2026 Flight Price Notifier
        </div>
      </footer>
    </div>
  );
}