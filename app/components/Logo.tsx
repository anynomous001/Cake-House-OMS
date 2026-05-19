import React from 'react';

interface LogoProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  showText?: boolean;
}

export default function Logo({ className = '', width = '100%', height = '100%', showText = true }: LogoProps) {
  return (
    <svg
      viewBox="0 0 500 500"
      width={width}
      height={height}
      className={`select-none ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Luxury Gold/Champagne Gradient */}
        <linearGradient id="logoGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5DDB3" />
          <stop offset="40%" stopColor="#D8A65C" />
          <stop offset="100%" stopColor="#9C7338" />
        </linearGradient>

        {/* Gorgeous Rose Gold Gradient */}
        <linearGradient id="logoPink" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FACCD6" />
          <stop offset="50%" stopColor="#E78C85" />
          <stop offset="100%" stopColor="#AF5C54" />
        </linearGradient>

        {/* Soft Pink to Gold Transition for Ribbon & Highlights */}
        <linearGradient id="logoRibbon" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E88B84" />
          <stop offset="50%" stopColor="#F1AC9B" />
          <stop offset="100%" stopColor="#E7BF88" />
        </linearGradient>

        {/* Dark Shadow/Depth for Isometric Faces */}
        <linearGradient id="shadowGold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#A87E41" />
          <stop offset="100%" stopColor="#6E5023" />
        </linearGradient>
      </defs>

      {/* ================= CAKE ICON GROUP ================= */}
      <g transform="translate(20, -10)">
        {/* Heart Ribbon Frosting on Top */}
        {/* Loops upwards, forms a gorgeous heart path, and anchors into the top slice */}
        <path
          d="M 230 200 
             C 170 170, 160 110, 210 90
             C 230 82, 245 100, 245 110
             C 245 100, 260 82, 280 90
             C 330 110, 320 170, 260 200
             C 245 208, 235 204, 230 200 Z"
          fill="url(#logoRibbon)"
          opacity="0.95"
        />
        {/* Inner Heart cutout for definition */}
        <path
          d="M 230 185
             C 185 160, 178 122, 212 108
             C 225 102, 235 118, 235 125
             C 235 118, 245 102, 258 108
             C 292 122, 285 160, 240 185
             C 235 188, 232 187, 230 185 Z"
          fill="#160E0A"
        />

        {/* Upper Cake Slice (Layer 1) */}
        {/* Left Side (Gold Shaded) */}
        <path
          d="M 160 210 L 230 240 L 230 215 L 160 185 Z"
          fill="url(#shadowGold)"
        />
        {/* Right Side (Rose Gold) */}
        <path
          d="M 230 240 L 330 200 L 330 175 L 230 215 Z"
          fill="url(#logoPink)"
        />
        {/* Cake Slice Top Surface */}
        <path
          d="M 160 185 L 230 215 L 330 175 L 260 148 Z"
          fill="url(#logoRibbon)"
          opacity="0.85"
        />

        {/* Middle dark gap layer for depth */}
        <path
          d="M 160 210 L 230 240 L 330 200 L 330 204 L 230 244 L 160 214 Z"
          fill="#160E0A"
        />

        {/* Lower Cake Slice (Layer 2) */}
        {/* Left Side (Gold Shaded) */}
        <path
          d="M 160 236 L 230 266 L 230 242 L 160 212 Z"
          fill="url(#shadowGold)"
        />
        {/* Right Side (Rose Gold) */}
        <path
          d="M 230 266 L 330 226 L 330 202 L 230 242 Z"
          fill="url(#logoPink)"
        />

        {/* Bottom gap layer */}
        <path
          d="M 160 236 L 230 266 L 330 226 L 330 230 L 230 270 L 160 240 Z"
          fill="#160E0A"
        />

        {/* Bottom Cake Base (Layer 3) */}
        {/* Left Side (Gold Shaded) */}
        <path
          d="M 160 262 L 230 292 L 230 268 L 160 238 Z"
          fill="url(#shadowGold)"
        />
        {/* Right Side (Rose Gold) */}
        <path
          d="M 230 292 L 330 252 L 330 228 L 230 268 Z"
          fill="url(#logoPink)"
        />
      </g>

      {/* ================= BRAND TEXT "TOTA" ================= */}
      {showText && (
        <g>
          {/* Letter "T" (Left) */}
          <path
            d="M 55 310 H 125 V 323 H 96 V 385 H 84 V 323 H 55 Z"
            fill="url(#logoGold)"
          />

          {/* Letter "O" (Middle-Left) */}
          <path
            d="M 190 309 C 226 309, 226 386, 190 386 C 154 386, 154 309, 190 309 Z
               M 190 322 C 210 322, 210 373, 190 373 C 170 373, 170 322, 190 322 Z"
            fill="url(#logoGold)"
            fillRule="evenodd"
          />

          {/* Letter "T" (Middle-Right) */}
          <path
            d="M 255 310 H 325 V 323 H 296 V 385 H 284 V 323 H 255 Z"
            fill="url(#logoGold)"
          />

          {/* Letter "A" (Right) */}
          {/* Custom styled "A" with open top angle and solid pink inner triangle */}
          <path
            d="M 390 309 
               L 426 385 
               H 411 
               L 390 340 
               L 369 385 
               H 354 
               L 390 309 Z"
            fill="url(#logoGold)"
          />
          {/* Inner Accent Pink Triangle inside "A" */}
          <path
            d="M 390 343 
               L 405 376 
               H 375 
               Z"
            fill="url(#logoPink)"
          />

          {/* ================= SUBTITLE "— CAKE HOUSE —" ================= */}
          <text
            x="245"
            y="435"
            textAnchor="middle"
            fontFamily="var(--font-outfit), system-ui, sans-serif"
            fontWeight="600"
            fontSize="18"
            fill="url(#logoRibbon)"
            letterSpacing="8"
            className="uppercase tracking-[0.4em]"
          >
            — CAKE HOUSE —
          </text>
        </g>
      )}
    </svg>
  );
}
