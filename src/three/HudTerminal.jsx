import React, { useEffect, useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import { TERMINAL_BLOCKS } from '../data/content.js';
import { scrollState } from '../scroll/scrollState.js';

/* Typing cadence, in ms. */
const CHAR_MS = 16;
const LINE_PAUSE = 420;
const BLOCK_PAUSE = 1500;
const MAX_LINES = 8;

const TONE = {
  cyan: 'text-[#5eead4]',
  violet: 'text-[#c4b5fd]',
  gold: 'text-[#fcd34d]',
  green: 'text-[#86efac]',
  red: 'text-[#fca5a5]',
  blue: 'text-[#93c5fd]',
  amber: 'text-[#fcd34d]',
  magenta: 'text-[#f0abfc]',
  crimson: 'text-[#fda4af]',
  teal: 'text-[#5eead4]',
};

/** Lines containing WARNING/ALERT get pulled out in alert red regardless of tone. */
function toneFor(line, blockTone) {
  if (/WARNING|ERROR|ALERT/.test(line)) return 'text-[#ff8f6b]';
  return TONE[blockTone] ?? TONE.cyan;
}

/**
 * The glowing screen mounted beside the quantum chandelier.
 *
 * Rendered as real DOM through drei's <Html transform>, so the text stays
 * pin-sharp at any zoom instead of turning into a blurry texture.
 */
export function HudTerminal({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  const [active, setActive] = useState(false);

  // Only run the typewriter once the camera is closing on the chandelier,
  // no point burning timers through the first three phases.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const on = scrollState.smoothed > 0.68;
      setActive((prev) => (prev === on ? prev : on));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <Html
      transform
      position={position}
      rotation={rotation}
      distanceFactor={2.0}
      zIndexRange={[10, 0]}
      style={{ pointerEvents: 'none' }}
      wrapperClass="hud-wrapper"
    >
      <TerminalScreen active={active} />
    </Html>
  );
}

function TerminalScreen({ active }) {
  const { lines, current, tone } = useTypewriter(active);

  return (
    <div
      className="pointer-events-none w-[500px] select-none rounded-lg border border-q-cyan/40 bg-[#02080c]/70 p-4 font-mono text-[13px] leading-[1.65] shadow-[0_0_60px_rgba(34,211,238,0.35)] backdrop-blur-sm"
      style={{ opacity: active ? 1 : 0, transition: 'opacity 700ms ease' }}
    >
      {/* Title bar */}
      <div className="mb-3 flex items-center justify-between border-b border-q-cyan/25 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#5eead4]" />
          <span className="text-[10px] uppercase tracking-[0.22em] text-q-cyan/90">
            QPU · CONTROL TERMINAL
          </span>
        </div>
        <span className="text-[10px] tracking-widest text-slate-500">10 mK</span>
      </div>

      {/* Log body - overflow-hidden + flex flex-col justify-end anchors text to bottom without scrollbars */}
      <div className="scanlines relative flex h-[208px] flex-col justify-end overflow-hidden">
        {lines.map((l, i) => (
          <div key={`${i}-${l.text}`} className={`${toneFor(l.text, l.tone)} whitespace-pre-wrap`}>
            {l.text}
          </div>
        ))}
        {current !== null && (
          <div className={`${toneFor(current, tone)} whitespace-pre-wrap`}>
            {current}
            <span className="ml-0.5 inline-block h-[13px] w-[7px] translate-y-[2px] animate-blink bg-current" />
          </div>
        )}
      </div>

      {/* Status strip */}
      <div className="mt-3 flex items-center justify-between border-t border-q-cyan/25 pt-2.5 text-[10px] tracking-widest text-slate-500">
        <span>MUIDSI · QUANTUM FALL FEST</span>
        <span className="text-[#5eead4]">● LIVE</span>
      </div>
    </div>
  );
}

/**
 * Types the log program out character by character, cycling through blocks
 * forever. Timers are torn down whenever `active` goes false.
 */
function useTypewriter(active) {
  const [state, setState] = useState({ lines: [], current: null, tone: 'cyan' });
  const timer = useRef(null);

  useEffect(() => {
    if (!active) return undefined;

    let cancelled = false;
    let blockIndex = 0;
    let lineIndex = 0;
    let charIndex = 0;
    let printed = [];

    const wait = (ms, fn) => {
      timer.current = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
    };

    const step = () => {
      if (cancelled) return;

      const block = TERMINAL_BLOCKS[blockIndex];
      const line = block.lines[lineIndex];

      if (charIndex <= line.length) {
        setState({ lines: printed, current: line.slice(0, charIndex), tone: block.tone });
        charIndex += 1;
        wait(CHAR_MS, step);
        return;
      }

      // Line finished, so commit it and trim the scrollback.
      printed = [...printed, { text: line, tone: block.tone }].slice(-MAX_LINES);
      charIndex = 0;
      lineIndex += 1;

      if (lineIndex < block.lines.length) {
        setState({ lines: printed, current: '', tone: block.tone });
        wait(LINE_PAUSE, step);
        return;
      }

      // Block finished, so pause, blank line, next block.
      lineIndex = 0;
      blockIndex = (blockIndex + 1) % TERMINAL_BLOCKS.length;
      printed = [...printed, { text: '', tone: block.tone }].slice(-MAX_LINES);
      setState({ lines: printed, current: null, tone: block.tone });
      wait(BLOCK_PAUSE, step);
    };

    step();

    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [active]);

  return state;
}
