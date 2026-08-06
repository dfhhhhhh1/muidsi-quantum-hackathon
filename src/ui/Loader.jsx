import React, { useEffect, useState } from 'react';

/**
 * Boot splash. Procedural textures are generated synchronously on first render
 * of the 3D layer, which costs a few hundred milliseconds. This covers that
 * gap rather than flashing an empty black page.
 */
export function Loader() {
  const [progress, setProgress] = useState(0);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = () => {
      // Ease toward 100% over ~1.6s, then hold until the browser is idle.
      const t = Math.min((performance.now() - start) / 1600, 1);
      setProgress(Math.round((1 - Math.pow(1 - t, 3)) * 100));
      if (t < 1) raf = requestAnimationFrame(tick);
      else setTimeout(() => setGone(true), 350);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (gone) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-q-void transition-opacity duration-700"
      style={{ opacity: progress >= 100 ? 0 : 1 }}
    >
      <div className="w-64 text-center">
        <div className="font-mono text-[10px] uppercase tracking-widest2 text-q-cyan/80">
          Loading
        </div>
        <div className="mt-4 h-px w-full bg-white/10">
          <div
            className="h-px bg-gradient-to-r from-mizzou-gold to-q-cyan transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-3 font-mono text-[10px] tabular-nums text-slate-500">
          {String(progress).padStart(3, '0')}%
        </div>
      </div>
    </div>
  );
}
