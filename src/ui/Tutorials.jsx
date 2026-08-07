import React from 'react';
import { TUTORIALS } from '../data/content.js';
import { Section, Reveal, Heading } from './Section.jsx';

export function Tutorials() {
  return (
    <Section id="tutorials" minH="min-h-[105vh]">
      <Reveal>
        <Heading
          eyebrow="Tutorials"
          title=""
          lede="These tutorials are meant to assist and supplement the learning during the hackathon, and will have time at the end for questions."
        />
      </Reveal>

      <div className="mt-9 space-y-3">
        {TUTORIALS.map((t, i) => (
          <Reveal key={t.id} delay={100 + i * 90}>
            <article className="glass group flex gap-5 p-5 transition-colors duration-500 hover:border-q-cyan/40 sm:gap-6 sm:p-6">
              <div className="flex-none">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-q-cyan/25 bg-q-cyan/[0.07] font-mono text-sm font-bold text-q-cyan transition-all duration-500 group-hover:border-q-cyan/60 group-hover:shadow-glow">
                  {t.id}
                </div>
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-lg font-semibold leading-snug text-white sm:text-xl">
                  {t.title}
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-slate-400">{t.blurb}</p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
