import React from 'react';
import { EVENT } from '../data/content.js';
import { Section, Reveal } from './Section.jsx';

export function Footer() {
  return (
    <Section id="footer" minH="min-h-[70vh]" align="end">
      <Reveal>
        <div className="glass-strong p-7 sm:p-9">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <img
                src="universityLogo.png"
                alt="University Logo"
                className="h-11 w-auto opacity-90"
              />
              <div>
                <div className="font-display text-sm font-semibold text-white">{EVENT.host}</div>
                <div className="mt-0.5 text-xs text-slate-400">{EVENT.org}</div>
              </div>
            </div>

            <a
              href={EVENT.registerUrl}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-mizzou-gold/50 bg-mizzou-gold/10 px-7 py-3 font-display text-xs font-bold uppercase tracking-widest text-mizzou-gold transition-all duration-300 hover:bg-mizzou-gold hover:text-black"
            >
              Register Now →
            </a>
          </div>

          <div className="rule my-7" />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono text-[11px] text-slate-500">
              {EVENT.title} · {EVENT.dateRange}
            </p>
            <p className="font-mono text-[11px] text-slate-600">
              Hosted by {EVENT.org}
            </p>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
