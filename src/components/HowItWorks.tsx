const steps = [
  { number: "1", title: "Search a spot", description: "Enter a location or campground." },
  { number: "2", title: "Get scores", description: "See CampScore, night sky, and fire risk." },
  { number: "3", title: "Pick the best night", description: "Plan around the clearest, safest nights." },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24"
      aria-labelledby="how-heading"
    >
      <div className="mx-auto max-w-5xl">
        <h2
          id="how-heading"
          className="text-center text-2xl font-semibold text-white sm:text-3xl"
        >
          How it works
        </h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-3 sm:gap-12">
          {steps.map((step) => (
            <div
              key={step.number}
              className="flex flex-col items-center text-center"
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/5 text-lg font-semibold text-white"
                aria-hidden
              >
                {step.number}
              </span>
              <h3 className="mt-4 text-lg font-medium text-white">
                {step.title}
              </h3>
              <p className="mt-1 text-sm text-zinc-400">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
