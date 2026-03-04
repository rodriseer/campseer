const features = [
  {
    title: "CampScore",
    description: "One score for weather, wind, rain, and comfort.",
  },
  {
    title: "Night Sky Score",
    description: "See when the stars and Milky Way will be clearest.",
  },
  {
    title: "Fire Safety",
    description: "Know fire risk and restrictions before you go.",
  },
];

export default function FeatureCards() {
  return (
    <section
      id="night-sky"
      className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24"
      aria-labelledby="features-heading"
    >
      <div className="mx-auto max-w-5xl">
        <h2 id="features-heading" className="sr-only">
          Features
        </h2>
        <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
          {features.map((feature, i) => (
            <article
              key={feature.title}
              id={feature.title === "Fire Safety" ? "fire-safety" : undefined}
              className="animate-slide-up scroll-mt-24 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur-md transition-opacity hover:bg-white/[0.07] sm:p-8 [animation-fill-mode:both]"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <h3 className="text-lg font-semibold text-white sm:text-xl">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-zinc-400 sm:text-base">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
