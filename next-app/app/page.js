export default function Home() {
  return (
    <div className="min-h-screen bg-hero px-6 py-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="animate-rise flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink/50">
              Apex Digital
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold text-ink sm:text-6xl">
              Orchestrate every campaign task with precision and clarity.
            </h1>
            <p className="max-w-xl text-base text-ink/70">
              A focused workspace for digital marketers to manage content
              deadlines, blog production, and marketing ops in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              className="inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-ink/90"
              href="/auth/register"
            >
              Get started
            </a>
            <a
              className="inline-flex items-center justify-center rounded-full border border-ink/10 bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:border-ink/30"
              href="/auth/login"
            >
              Sign in
            </a>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-3">
          {[
            {
              title: "Pipeline clarity",
              detail:
                "See every blog task, deadline, and status in a scannable table.",
            },
            {
              title: "Fast status shifts",
              detail:
                "Toggle tasks from open to complete in one click with instant feedback.",
            },
            {
              title: "Profile control",
              detail:
                "Update your marketer profile and stay aligned with your team.",
            },
          ].map((card, index) => (
            <div
              key={card.title}
              className="animate-rise rounded-3xl border border-ink/10 bg-white/80 p-6 shadow-[0_30px_70px_-50px_rgba(15,23,42,0.35)]"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <h2 className="text-xl font-semibold text-ink">{card.title}</h2>
              <p className="mt-3 text-sm text-ink/60">{card.detail}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
