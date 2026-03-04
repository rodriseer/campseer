"use client";

import { useEffect, useState } from "react";
import { animate } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface ScoreCountUpProps {
  value: number;
  duration?: number;
  className?: string;
}

export function ScoreCountUp({
  value,
  duration = 0.4,
  className = "",
}: ScoreCountUpProps) {
  const [display, setDisplay] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [value, duration, reduced]);

  return (
    <span className={className}>
      {display.toFixed(1)}
    </span>
  );
}
