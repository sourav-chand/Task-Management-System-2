"use client";

import React from "react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Icon: Squircle container with Pyramid delta symbol */}
      <div className="w-8 h-8 bg-[#0F172A] dark:bg-neutral-100 rounded-xl flex items-center justify-center shadow-xs transition-colors">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white dark:text-neutral-950"
        >
          <path d="M12 3L2 20h20L12 3z" fill="currentColor" fillOpacity="0.15" />
          <path d="M12 3L2 20h20L12 3z" />
          <path d="M12 9l-4.5 8h9L12 9z" />
        </svg>
      </div>

      {/* Brand Title */}
      <span className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 select-none">
        Pyramid
      </span>
    </div>
  );
}
