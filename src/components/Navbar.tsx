"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { MountainIcon } from "@/components/icons/CampSeerIcons";

const navLinks = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#night-sky", label: "Night Sky" },
  { href: "#fire-safety", label: "Fire Safety" },
  { href: "#explore", label: "Explore" },
];

function handleOpenApp(e: React.MouseEvent) {
  e.preventDefault();
  const el = document.getElementById("search-input");
  el?.scrollIntoView({ behavior: "smooth", block: "center" });
  setTimeout(() => el?.focus(), 400);
}

export default function Navbar() {
  const reduced = useReducedMotion();

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-brand-bg/90 backdrop-blur-md"
      role="navigation"
      aria-label="Main"
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-heading text-xl font-semibold uppercase tracking-wordmark text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 focus:ring-offset-brand-bg sm:text-2xl"
          aria-label="CampSeer home"
        >
          <MountainIcon className="h-6 w-6 shrink-0 text-white sm:h-7 sm:w-7" />
          <span>CAMPSEER</span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-4">
          <ul className="hidden items-center gap-1 sm:flex sm:gap-6">
            {navLinks.map(({ href, label }) => (
              <li key={label}>
                <Link
                  href={href}
                  className="rounded-md px-3 py-2 text-sm text-zinc-400 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 focus:ring-offset-brand-bg"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <motion.button
            type="button"
            onClick={handleOpenApp}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-brand-accent px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 focus:ring-offset-brand-bg"
            whileHover={reduced ? {} : { y: -2, boxShadow: "0 4px 20px rgba(31,122,90,0.35)" }}
            whileTap={reduced ? {} : { scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            Open App
          </motion.button>
        </div>
      </div>
    </nav>
  );
}
