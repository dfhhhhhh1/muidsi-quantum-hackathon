import React from 'react';
import { EVENT } from '../data/content.js';
import { Section, Reveal, Heading } from './Section.jsx';

export function Registration() {
  return (
    <Section id="register" minH="min-h-[100vh]">
      <Reveal>
        <Heading
          eyebrow="Registration"
          title="Sign up."
          lede="Registration is free for University of Missouri students and open to every skill level. Scan the code or use the button."
          accent="gold"
        />
      </Reveal>

      <Reveal delay={150}>
        <div className="glass-strong corner-brackets mt-9 flex flex-col items-center gap-8 p-7 sm:flex-row sm:items-center sm:gap-10 sm:p-9">
          {/* QR code, framed like a scanner target */}
          <div className="relative flex-none">
            <div className="absolute -inset-3 rounded-2xl bg-q-cyan/10 blur-2xl" />
            <div className="relative rounded-xl border border-q-cyan/30 bg-white p-3 shadow-glow">
              <img
                src="qrCode.png"
                alt="Registration QR Code"
                className="h-40 w-40 object-contain sm:h-44 sm:w-44"
              />
              {/* Scanning sweep */}
              <div className="pointer-events-none absolute inset-3 overflow-hidden rounded">
                <div className="h-full w-full animate-scan bg-gradient-to-b from-transparent via-mizzou-gold/30 to-transparent" />
              </div>
            </div>
            <div className="mt-3 text-center font-mono text-[10px] uppercase tracking-widest2 text-slate-500">
              Scan to register
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="font-mono text-[10px] uppercase tracking-widest2 text-q-cyan">
              Status: Open
            </div>
            <h3 className="mt-3 font-display text-2xl font-semibold leading-tight text-white sm:text-3xl">
              {EVENT.dateRange}
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-300/85">
              Come with a team or come on your own. If you are on your own, we will help you find a
              group at the opening ceremony.
            </p>

            <a
              href={EVENT.registerUrl}
              className="group relative mt-7 inline-flex items-center gap-3 overflow-hidden rounded-full border border-mizzou-gold/60 bg-mizzou-gold/10 px-9 py-4 font-display text-sm font-bold uppercase tracking-widest text-mizzou-gold shadow-glow-gold transition-all duration-300 hover:bg-mizzou-gold hover:text-black hover:shadow-[0_0_40px_rgba(241,184,45,0.6)]"
            >
              {/* Sheen sweep on hover */}
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative z-10">Register Now</span>
              <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </a>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
