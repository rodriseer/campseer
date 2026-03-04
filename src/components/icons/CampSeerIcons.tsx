/** Minimal outline icons for CampSeer — monochrome, consistent stroke */

export function TentIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22L12 4l8 18H4z" />
      <path d="M12 4v18" />
      <path d="M4 22h16" />
    </svg>
  );
}

export function MoonStarsIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 6 6c0 2.2-1.2 4.1-3 5.2A6 6 0 1 1 6 9a6 6 0 0 0 6-6z" />
      <path d="M19 2v2M19 8v2M22 5h-2M22 11h-2M17 4l1.5 1.5M17 10l1.5 1.5M20 7l-1.5 1.5M20 13l-1.5 1.5" />
    </svg>
  );
}

export function CampfireIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22c4-2 6-6 6-10 0-3.3-2.7-6-6-6s-6 2.7-6 6c0 4 2 8 6 10z" />
      <path d="M12 12c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
    </svg>
  );
}

/** Minimal mountain/triangle for logo */
export function MountainIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20L12 6l8 14H4z" />
    </svg>
  );
}
