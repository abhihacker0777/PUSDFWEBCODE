"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function Navbar({ lastUpdated }: Readonly<{ lastUpdated?: string }>) {
  return (
    <header className="w-full bg-[#b22222] shadow-md sticky top-0 z-50">
      <nav className="w-full pl-[20px] sm:pl-[40px] md:pl-[120px] pr-2 md:pr-4 py-1 flex items-center justify-between">
        {/* Left: Hindi Logo */}
        <Link href="/" className="flex items-center no-underline rounded-lg focus-visible:ring-2 focus-visible:ring-white">
          <Image
            src="/puhindilogo.jpg"
            alt="Poornima University Logo"
            width={180}
            height={56}
            className="h-10 sm:h-12 md:h-14 w-auto object-contain"
            priority
          />
        </Link>


        {/* Center: Title */}
        <div className="hidden sm:block text-white font-bold text-lg md:text-2xl tracking-wide font-serif">
          Previous Year Question Paper
        </div>

        {/* Right: Last Update badge (desktop) + Circular Seal Logo */}
        <div className="flex items-center gap-2 md:gap-3.5 shrink-0">
          {lastUpdated && (
            <div className="hidden sm:flex text-white text-xs md:text-sm font-semibold tracking-wider font-sans whitespace-nowrap bg-black/25 border border-white/25 px-3 py-1 rounded-full shadow-xs items-center gap-1.5">
              <span>Last Update</span>
              <span className="font-bold text-[#ffc107]">{lastUpdated}</span>
            </div>
          )}

          <a
            href="https://poornima.edu.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center transition-transform hover:scale-105 transform-gpu rounded-full focus-visible:ring-2 focus-visible:ring-white"
          >
            <Image
              src="/logo.png"
              alt="PU Seal"
              width={48}
              height={48}
              className="h-10 md:h-12 w-auto object-contain"
              priority
            />
          </a>

        </div>
      </nav>

      {/* Downside bar on mobile: Left has "Previous Year Question Paper", Right has "Last Update" */}
      <div className="sm:hidden py-1 px-3 flex items-center justify-between gap-2 text-white">
        <span className="font-serif font-bold text-[11px] tracking-wide truncate">
          Previous Year Question Paper
        </span>
        {lastUpdated && (
          <span className="text-[10px] font-sans font-medium whitespace-nowrap bg-black/25 border border-white/20 px-2 py-0.5 rounded-full shrink-0">
            Last Update: <span className="font-bold text-[#ffc107]">{lastUpdated}</span>
          </span>
        )}
      </div>
    </header>
  );
}
