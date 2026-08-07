import React from 'react';
import { EVENT, CHALLENGES, RESOURCES } from '../data/content.js';
import { Section, Reveal, Heading } from './Section.jsx';

export function EventDetails() {
  return (
    <>
      <Section id="about" minH="min-h-[85vh]">
        <Reveal>
          <Heading
            eyebrow="Event Details"
            title="Location: Columbia, MO in Lafferre."
            lede="The MU Quantum Innovation Center (QIC) is running a hackathon in October. You will work in a team on one of two challenges. If you are new to quantum computing, the tutorial series runs alongside the hackathon."
          />
        </Reveal>

        <Reveal delay={140}>
          <div className="glass corner-brackets mt-9 grid grid-cols-1 gap-px overflow-hidden bg-white/[0.06] sm:grid-cols-3">
            <Stat label="Dates" value={EVENT.dateRange} accent />
            <Stat label="Format" value="In person. UM System Students in teams of 2-5." />
            <Stat label="Experience" value="None required" />
          </div>
        </Reveal>
      </Section>

      <Section id="challenges" minH="min-h-[110vh]">
        <Reveal>
          <Heading
            eyebrow="The Challenges"
            title=""
            lede="Choose one of two provided prompts to work on with your team."
            accent="gold"
          />
        </Reveal>

        <div className="mt-9 space-y-5">
          {CHALLENGES.map((c, i) => (
            <Reveal key={c.title} delay={120 + i * 120}>
              <ChallengeCard {...c} />
            </Reveal>
          ))}
        </div>

        <Reveal delay={400}>
          <div className="glass mt-8 p-6 sm:p-7">
            <div className="eyebrow mb-4">Resources Provided</div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {RESOURCES.map((r) => (
                <div key={r.name}>
                  <div className="font-display text-sm font-semibold text-white">{r.name}</div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">{r.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  );
}

function Stat({ label, value, accent = false }) {
  return (
    <div className="bg-q-panel/60 px-6 py-6 backdrop-blur-xl">
      <div className="font-mono text-[10px] uppercase tracking-widest2 text-slate-500">{label}</div>
      <div
        className={`mt-2 font-display text-lg font-semibold ${
          accent ? 'text-mizzou-gold text-glow-gold' : 'text-white'
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function ChallengeCard({ tag, title, blurb, points, accent }) {
  const gold = accent === 'gold';
  const ring = gold ? 'hover:border-mizzou-gold/40' : 'hover:border-q-cyan/40';
  const tagColor = gold ? 'text-mizzou-gold' : 'text-q-cyan';
  const bar = gold
    ? 'from-mizzou-gold via-mizzou-gold/40 to-transparent'
    : 'from-q-cyan via-q-cyan/40 to-transparent';

  return (
    <article
      className={`glass group relative overflow-hidden p-6 transition-colors duration-500 sm:p-8 ${ring}`}
    >
      <div className={`absolute left-0 top-0 h-full w-px bg-gradient-to-b ${bar}`} />
      <div className={`font-mono text-[10px] uppercase tracking-widest2 ${tagColor}`}>{tag}</div>
      <h3 className="mt-3 font-display text-2xl font-semibold text-white sm:text-[1.75rem]">
        {title}
      </h3>
      <p className="mt-3 text-[15px] leading-relaxed text-slate-300/85">{blurb}</p>
      <ul className="mt-5 space-y-2.5">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-3 text-sm text-slate-400">
            <span
              className={`mt-[7px] h-1 w-1 flex-none rounded-full ${
                gold ? 'bg-mizzou-gold' : 'bg-q-cyan'
              }`}
            />
            {p}
          </li>
        ))}
      </ul>
    </article>
  );
}
