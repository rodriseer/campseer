export function HowItWorksSection() {
  const steps = [
    { n: "1", title: "Search a spot", desc: "Enter a location or campground." },
    { n: "2", title: "Get scores", desc: "See CampScore, night sky, and fire risk." },
    { n: "3", title: "Pick the best night", desc: "Plan around the clearest, safest nights." },
  ];
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-t border-white/5 bg-brand-bg px-4 py-14 sm:px-6 sm:py-20"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto max-w-5xl">
        <h2
          id="how-it-works-heading"
          className="font-heading text-2xl tracking-heading text-white sm:text-3xl"
        >
          How it works
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3 sm:gap-8">
          {steps.map((s) => (
            <div key={s.n} className="text-center">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-accent/30 bg-brand-accent/10 font-sans text-sm font-semibold text-brand-accent">
                {s.n}
              </span>
              <h3 className="mt-3 font-heading text-lg tracking-heading text-white">
                {s.title}
              </h3>
              <p className="mt-1 text-sm text-zinc-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function NightSkySection() {
  return (
    <section
      id="night-sky"
      className="scroll-mt-20 border-t border-white/5 bg-brand-bg px-4 py-14 sm:px-6 sm:py-20"
      aria-labelledby="night-sky-heading"
    >
      <div className="mx-auto max-w-5xl">
        <h2
          id="night-sky-heading"
          className="font-heading text-2xl tracking-heading text-white sm:text-3xl"
        >
          Night Sky Score
        </h2>
        <p className="mt-3 text-sm text-zinc-400">
          See when the stars and Milky Way will be clearest—based on cloud cover and moon phase.
        </p>
      </div>
    </section>
  );
}

export function FireSafetySection() {
  return (
    <section
      id="fire-safety"
      className="scroll-mt-20 border-t border-white/5 bg-brand-bg px-4 py-14 sm:px-6 sm:py-20"
      aria-labelledby="fire-safety-heading"
    >
      <div className="mx-auto max-w-5xl">
        <h2
          id="fire-safety-heading"
          className="font-heading text-2xl tracking-heading text-white sm:text-3xl"
        >
          Fire Safety
        </h2>
        <p className="mt-3 text-sm text-zinc-400">
          Know fire risk from wind and dryness before you go. We show LOW, MED, or HIGH so you can plan safely.
        </p>
      </div>
    </section>
  );
}
