import React from 'react';
import { EVENT } from '../data/content.js';
import { Section, Reveal } from './Section.jsx';

export function Hero() {
  return (
    <Section id="top" center className="pt-24">
      <Reveal>
        <div className="mx-auto mb-9 flex items-center justify-center gap-4">
          <img
            src="tigerLogo.png"
            alt="Missouri Tigers"
            className="h-12 w-auto drop-shadow-[0_0_20px_rgba(241,184,45,0.45)] sm:h-14"
          />
          <div className="hidden h-10 w-px bg-white/20 sm:block" />
          <div className="hidden text-left sm:block">
            <div className="font-mono text-[10px] uppercase tracking-widest2 text-mizzou-gold/90">
              {EVENT.host}
            </div>
            <div className="mt-1 text-xs text-slate-400">{EVENT.org}</div>
          </div>
        </div>
      </Reveal>

      <Reveal delay={120}>
        <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-q-cyan/30 bg-q-cyan/[0.07] px-4 py-1.5 backdrop-blur-md">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-q-cyan opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-q-cyan" />
          </span>
          <span className="font-mono text-[11px] uppercase tracking-widest2 text-q-ice">
            {EVENT.dateShort}
          </span>
        </div>
      </Reveal>

      <Reveal delay={220}>
        <h1 className="font-display text-[2.6rem] font-bold leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-[5.2rem]">
          <span className="block">Mizzou QIC</span>
          <span className="block bg-gradient-to-r from-mizzou-gold via-q-ice to-q-cyan bg-clip-text text-transparent text-glow-cyan">
            Hackathon Fall Fest
          </span>
        </h1>
      </Reveal>

      <Reveal delay={340}>
        <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-slate-300/90 sm:text-xl">
          {EVENT.subtitle}
        </p>
      </Reveal>

      <Reveal delay={460}>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="#register"
            className="group relative overflow-hidden rounded-full border border-mizzou-gold/50 bg-mizzou-gold/10 px-8 py-3.5 font-display text-sm font-semibold uppercase tracking-widest text-mizzou-gold shadow-glow-gold transition-all duration-300 hover:bg-mizzou-gold hover:text-black"
          >
            <span className="relative z-10">Register Now</span>
          </a>
          <a
            href="#schedule"
            className="rounded-full border border-white/15 bg-white/5 px-8 py-3.5 font-display text-sm font-semibold uppercase tracking-widest text-slate-200 backdrop-blur-md transition-all duration-300 hover:border-q-cyan/50 hover:text-q-cyan"
          >
            View Schedule
          </a>
        </div>
      </Reveal>

      <Reveal delay={620}>
        <div className="mt-20 flex flex-col items-center gap-3">
          <div className="font-mono text-[10px] uppercase tracking-widest2 text-slate-500">
            Scroll to begin
          </div>
          <div className="h-12 w-px bg-gradient-to-b from-q-cyan/70 to-transparent" />
        </div>
      </Reveal>
    </Section>
  );
}
