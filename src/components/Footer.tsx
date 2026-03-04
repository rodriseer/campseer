import Link from "next/link";
import { MountainIcon } from "@/components/icons/CampSeerIcons";

const footerLinks = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#night-sky", label: "Night Sky" },
  { href: "#fire-safety", label: "Fire Safety" },
  { href: "#explore", label: "Explore" },
];

export default function Footer() {
  return (
    <footer
      className="border-t border-white/5 bg-brand-bg px-4 py-10 sm:px-6 sm:py-12"
      role="contentinfo"
    >
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col items-center gap-1 text-center sm:items-start sm:text-left">
            <div className="flex items-center gap-2 font-heading text-lg font-semibold uppercase tracking-wordmark text-white">
              <MountainIcon className="h-5 w-5 text-white" />
              CAMPSEER
            </div>
            <p className="text-sm text-zinc-500">A Seer Labs Product</p>
            <a
              href="https://theseerlab.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand-accent underline underline-offset-2 transition-colors hover:text-brand-accent/90"
            >
              theseerlab.com
            </a>
          </div>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              {footerLinks.map(({ href, label }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-zinc-500 transition-colors hover:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 focus:ring-offset-brand-bg"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
