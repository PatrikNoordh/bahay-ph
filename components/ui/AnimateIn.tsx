"use client";

// Stagger delay values — must be static strings so Tailwind includes them in the build
const DELAY_CLASS: Record<number, string> = {
  0: "",
  50: "delay-50",
  100: "delay-100",
  150: "delay-150",
  200: "delay-200",
  250: "delay-250",
};

interface AnimateInProps {
  children: React.ReactNode;
  delay?: 0 | 50 | 100 | 150 | 200 | 250;
  className?: string;
}

export function AnimateIn({
  children,
  delay = 0,
  className = "",
}: AnimateInProps) {
  const delayClass = DELAY_CLASS[delay] ?? "";
  const classes = ["animate-fade-up", delayClass, className]
    .filter(Boolean)
    .join(" ");

  return <div className={classes}>{children}</div>;
}
