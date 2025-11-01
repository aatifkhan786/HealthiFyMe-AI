import React from "react";

export const Logo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1200 1200"
    fill="none"
    {...props}
  >
    {/* 🔹 Background (green gradient rounded) */}
    <rect
      width="1200"
      height="1200"
      rx="300"
      fill="url(#bgGradient)"
    />

    {/* 🔹 Central circular pulse effect */}
    <g opacity="0.5">
      <circle
        cx="600"
        cy="600"
        r="150"
        fill="white"
        fillOpacity="0.15"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="8"
      />
    </g>

    {/* 🔹 White heartbeat line */}
    <path
      d="M350 600h150l60-180 120 360 80-180h190"
      stroke="white"
      strokeWidth="60"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* 🔹 Gradient definition */}
    <defs>
      <linearGradient
        id="bgGradient"
        x1="0"
        y1="0"
        x2="1200"
        y2="1200"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#34d399" /> {/* emerald-400 */}
        <stop offset="1" stopColor="#10b981" /> {/* emerald-500 */}
      </linearGradient>
    </defs>
  </svg>
);
