import React from "react";

interface SectionHeadingProps {
  badge?: string;
  badgeIcon?: React.ReactNode;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  light?: boolean;
}

export function SectionHeading({
  badge,
  badgeIcon,
  title,
  subtitle,
  align = "center",
  light = false,
}: SectionHeadingProps) {
  const isCenter = align === "center";

  return (
    <div
      className={`space-y-4 mb-12 sm:mb-16 ${
        isCenter ? "text-center max-w-3xl mx-auto" : "max-w-2xl"
      }`}
    >
      {badge && (
        <div
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide ${
            light
              ? "bg-white/10 text-brand-gold border border-white/20 backdrop-blur-xs"
              : "bg-brand-blue-surface text-brand-blue border border-blue-200/60"
          }`}
        >
          {badgeIcon && <span className="shrink-0">{badgeIcon}</span>}
          <span>{badge}</span>
        </div>
      )}

      <h2
        className={`text-2xl sm:text-4xl lg:text-5xl font-black font-heading tracking-tight leading-[1.15] ${
          light ? "text-white" : "text-brand-navy"
        }`}
      >
        {title}
      </h2>

      {subtitle && (
        <p
          className={`text-base sm:text-lg leading-relaxed ${
            light ? "text-slate-300" : "text-brand-muted"
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
