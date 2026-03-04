import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import {
  HowItWorksSection,
  NightSkySection,
  FireSafetySection,
} from "@/components/PageSections";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-brand-bg text-white">
      <Navbar />
      <Hero />
      <HowItWorksSection />
      <NightSkySection />
      <FireSafetySection />
      <Footer />
    </main>
  );
}
