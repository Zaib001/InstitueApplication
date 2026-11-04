import React from "react";

interface SectionContainerProps {
  id?: string;
  className?: string;
  children: React.ReactNode;
  narrow?: boolean;
}

export function SectionContainer({
  id,
  className = "",
  children,
  narrow = false,
}: SectionContainerProps) {
  return (
    <section id={id} className={`w-full py-16 sm:py-20 lg:py-24 scroll-mt-20 lg:scroll-mt-24 ${className}`}>
      <div
        className={`mx-auto px-4 sm:px-6 lg:px-8 ${
          narrow ? "max-w-5xl" : "max-w-7xl"
        }`}
      >
        {children}
      </div>
    </section>
  );
}
