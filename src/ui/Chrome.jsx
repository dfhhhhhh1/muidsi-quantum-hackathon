import React, { useEffect, useState } from 'react';
import { scrollState, phaseAt } from '../scroll/scrollState.js';
import { EVENT } from '../data/content.js';

const PHASE_LABEL = {
  earth: 'LEAVING ORBIT  EARTH',
  satellite: 'APPROACH  ORBITAL PLATFORM',
  interior: 'INTERIOR  COMPUTE BAY',
  chandelier: 'QPU  DILUTION REFRIGERATOR',
};

const NAV = [
  { href: '#about', label: 'About' },
  { href: '#challenges', label: 'Challenges' },
  { href: '#register', label: 'Register' },
  { href: '#tutorials', label: 'Tutorials' },
  { href: '#schedule', label: 'Schedule' },
];

/** Fixed top bar + right-hand mission-status rail. Pure chrome, no layout impact. */
export function Chrome() {
  const [{ pct, phase }, setState] = useState({ pct: 0, phase: 'earth' });

  useEffect(() => {
    let raf = 0;
    let last = -1;
    const tick = () => {
      const p = Math.round(scrollState.progress * 100);
      if (p !== last) {
        last = p;
        setState({ pct: p, phase: phaseAt(scrollState.progress) });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      {/* Top bar */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-4 sm:px-8">
          <a
            href="#top"
            className="pointer-events-auto group flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-widest2 text-slate-300 transition-colors hover:text-q-cyan"
          >
            <img
              src="tigerLogo.png"
              alt=""
              aria-hidden="true"
              className="h-5 w-auto drop-shadow-[0_0_10px_rgba(241,184,45,0.45)] transition-transform duration-300 group-hover:scale-110"
            />
            Quantum Innovation Center
          </a>

          <nav className="pointer-events-auto hidden items-center gap-7 md:flex">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="font-mono text-[11px] uppercase tracking-widest text-slate-400 transition-colors hover:text-q-cyan"
              >
                {n.label}
              </a>
            ))}
          </nav>

          <a
            href={EVENT.registerUrl}
            className="pointer-events-auto rounded-full border border-mizzou-gold/40 bg-black/30 px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest text-mizzou-gold backdrop-blur-md transition-all hover:bg-mizzou-gold hover:text-black"
          >
            Register
          </a>
        </div>
        <div className="mx-auto h-px max-w-[1600px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </header>

      {/* Mission-status rail (desktop only, the HUD owns the right side on mobile) */}
      <div className="pointer-events-none fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-end gap-4 lg:flex">
        <div className="font-mono text-[9px] uppercase tracking-widest2 text-slate-500">
          Descent
        </div>
        <div className="relative h-52 w-px bg-white/10">
          <div
            className="absolute left-0 top-0 w-px bg-gradient-to-b from-mizzou-gold via-q-cyan to-q-violet transition-[height] duration-150"
            style={{ height: `${pct}%` }}
          />
          <div
            className="absolute -left-[3px] h-1.5 w-1.5 rounded-full bg-q-cyan shadow-glow transition-[top] duration-150"
            style={{ top: `${pct}%` }}
          />
        </div>
        <div className="font-mono text-[10px] tabular-nums text-q-cyan">
          {String(pct).padStart(3, '0')}%
        </div>
      </div>

      {/* Phase readout, bottom-left */}
      <div className="pointer-events-none fixed bottom-5 left-5 z-40 hidden sm:block">
        <div className="flex items-center gap-2.5 rounded-full border border-white/10 bg-black/40 px-3.5 py-1.5 backdrop-blur-md">
          <span className="h-1 w-1 animate-pulse-glow rounded-full bg-q-cyan" />
          <span className="font-mono text-[9px] uppercase tracking-widest2 text-slate-400">
            {PHASE_LABEL[phase]}
          </span>
        </div>
      </div>
    </>
  );
}
