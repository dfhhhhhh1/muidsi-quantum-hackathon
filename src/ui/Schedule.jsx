import React from 'react';
import { SCHEDULE } from '../data/content.js';
import { Section, Reveal, Heading } from './Section.jsx';

const PHASE_STYLE = {
  pre: { dot: 'bg-slate-400', ring: 'ring-slate-400/30', label: 'text-slate-400' },
  start: { dot: 'bg-mizzou-gold', ring: 'ring-mizzou-gold/40', label: 'text-mizzou-gold' },
  build: { dot: 'bg-q-cyan', ring: 'ring-q-cyan/30', label: 'text-q-cyan' },
  judge: { dot: 'bg-q-violet', ring: 'ring-q-violet/30', label: 'text-q-violet' },
  finale: { dot: 'bg-mizzou-gold', ring: 'ring-mizzou-gold/40', label: 'text-mizzou-gold' },
};

export function Schedule() {
  return (
    <Section id="schedule" minH="min-h-[135vh]" align="start">
      <Reveal>
        <Heading
          eyebrow="Tentative Schedule"
          title="What happens, and when."
          lede="Rooms and times will be confirmed closer to the event. Everything below is the current plan."
          accent="gold"
        />
      </Reveal>

      <Reveal delay={140}>
        <div className="relative mt-10">
          {/* Timeline spine */}
          <div className="absolute bottom-2 left-[7px] top-2 w-px bg-gradient-to-b from-mizzou-gold/70 via-q-cyan/40 to-q-violet/40" />

          <ol className="space-y-4">
            {SCHEDULE.map((d, i) => {
              const s = PHASE_STYLE[d.phase] ?? PHASE_STYLE.build;
              return (
                <Reveal key={d.date} delay={60 * i}>
                  <li className="relative pl-9">
                    {/* Node */}
                    <span
                      className={`absolute left-0 top-[22px] h-[15px] w-[15px] rounded-full border-2 border-q-void ${s.dot} ring-4 ${s.ring}`}
                    />
                    <div className="glass group px-5 py-4 transition-colors duration-500 hover:border-white/25">
                      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                        <span className="font-mono text-base font-bold text-white">{d.date}</span>
                        <span className="font-mono text-[10px] uppercase tracking-widest2 text-slate-500">
                          {d.day}
                        </span>
                        <span
                          className={`ml-auto font-mono text-[10px] uppercase tracking-widest2 ${s.label}`}
                        >
                          {d.label}
                        </span>
                      </div>
                      <ul className="mt-3 space-y-1.5">
                        {d.items.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-2.5 text-[14px] leading-relaxed text-slate-300/85"
                          >
                            <span className="mt-[9px] h-px w-3 flex-none bg-white/25" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                </Reveal>
              );
            })}
          </ol>
        </div>
      </Reveal>
    </Section>
  );
}
