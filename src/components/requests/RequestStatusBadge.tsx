"use client";

import React from "react";
import { RequestStatus } from "@prisma/client";
import { getRequestStatusMeta } from "@/lib/tutoring-request/state-machine";
import { useTranslation } from "@/lib/i18n";

interface RequestStatusBadgeProps {
  status: RequestStatus;
  showDescription?: boolean;
  short?: boolean;
}

export function RequestStatusBadge({
  status,
  showDescription = false,
  short = true,
}: RequestStatusBadgeProps) {
  const { locale } = useTranslation();
  const meta = getRequestStatusMeta(status, locale);
  const displayLabel =
    short && (meta as any).shortLabel ? (meta as any).shortLabel : meta.label;

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-tight whitespace-nowrap border shadow-2xs ${meta.badgeClass}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dotClass}`} />
        <span>{displayLabel}</span>
      </span>
      {showDescription && (
        <span className="text-[10px] text-slate-400 font-normal">
          {meta.description}
        </span>
      )}
    </div>
  );
}

