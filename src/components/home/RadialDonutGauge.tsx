"use client";

import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n";

interface RadialDonutGaugeProps {
  value?: number; // e.g. 96.7
  className?: string;
}

export function RadialDonutGauge({ value = 96.7, className = "" }: RadialDonutGaugeProps) {
  const { t } = useTranslation();

  const totalTicks = 54;
  const activeTicksCount = Math.round((value / 100) * totalTicks); // ~52 ticks for 96.7%

  // Radius dimensions
  const size = 150;
  const center = size / 2;
  const innerRadius = 50;
  const outerRadius = 66;

  // Generate separated radial tick lines
  const ticks = Array.from({ length: totalTicks }, (_, i) => {
    // Start angle from 120deg to 420deg (or standard 0 to 360)
    // In Lexicon reference, the arc starts from bottom-left (approx 135deg) around the top to bottom-right
    const angleDeg = (i / totalTicks) * 360 - 90; // Start from top (-90deg)
    const angleRad = (angleDeg * Math.PI) / 180;

    const x1 = center + innerRadius * Math.cos(angleRad);
    const y1 = center + innerRadius * Math.sin(angleRad);
    const x2 = center + outerRadius * Math.cos(angleRad);
    const y2 = center + outerRadius * Math.sin(angleRad);

    const isActive = i <= activeTicksCount;

    return {
      id: i,
      x1,
      y1,
      x2,
      y2,
      isActive,
      angleDeg,
    };
  });

  // Position of the glowing indicator bead at 96.7%
  const tipAngleDeg = (activeTicksCount / totalTicks) * 360 - 90;
  const tipAngleRad = (tipAngleDeg * Math.PI) / 180;
  const beadRadius = (innerRadius + outerRadius) / 2;
  const beadX = center + beadRadius * Math.cos(tipAngleRad);
  const beadY = center + beadRadius * Math.sin(tipAngleRad);

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="w-32 h-32 sm:w-36 sm:h-36 overflow-visible"
      >
        <defs>
          <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id="activeTickGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#e59a38" />
          </linearGradient>
        </defs>

        {/* Separated radial tick lines */}
        {ticks.map((tick, idx) => (
          <motion.line
            key={tick.id}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            stroke={tick.isActive ? "url(#activeTickGradient)" : "#224163"}
            strokeWidth={tick.isActive ? 2.5 : 1.8}
            strokeLinecap="round"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.4,
              delay: idx * 0.012,
              ease: "easeOut",
            }}
          />
        ))}

        {/* Continuous overlay arc for smooth glow */}
        <circle
          cx={center}
          cy={center}
          r={beadRadius}
          stroke="#1b3857"
          strokeWidth="3"
          fill="none"
          strokeDasharray="2 6"
          opacity={0.4}
        />

        {/* Glowing bead on the gauge tip */}
        <motion.circle
          cx={beadX}
          cy={beadY}
          r="4.5"
          fill="#ffffff"
          stroke="#e59a38"
          strokeWidth="2.5"
          filter="url(#gaugeGlow)"
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.25, 1] }}
          transition={{
            scale: { repeat: Infinity, duration: 2, ease: "easeInOut" },
            delay: 0.6,
          }}
        />
      </svg>

      {/* Center Label (Bigger, Bold, Animated) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <motion.span
          className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {value}%
        </motion.span>
        <span className="text-[10px] sm:text-[11px] text-slate-300 font-semibold tracking-wider uppercase mt-1 leading-tight">
          {t("hero.successRate", "Taux de Réussite")}
        </span>
      </div>
    </div>
  );
}
