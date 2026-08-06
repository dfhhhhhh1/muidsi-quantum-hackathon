import React, { useEffect, useRef, useState } from 'react';

/**
 * A scroll section. Content sits in a left-hand column on large screens so the
 * right side of the 3D scene (and the chandelier HUD) stays visible.
 * Pass `center` for full-width centered layout (used by the hero).
 */
export function Section({
  id,
  children,
  className = '',
  minH = 'min-h-screen',
  center = false,
  align = 'center',
}) {
  const alignClass =
    align === 'start' ? 'items-start pt-28' : align === 'end' ? 'items-end pb-28' : 'items-center';

  return (
    <section
      id={id}
      className={`relative flex ${minH} w-full ${alignClass} px-5 sm:px-8 ${className}`}
    >
      <div className={`mx-auto w-full max-w-7xl ${center ? '' : 'lg:mx-0 lg:ml-[4%]'}`}>
        <div className={center ? 'mx-auto max-w-4xl text-center' : 'w-full lg:max-w-2xl'}>
          {children}
        </div>
      </div>
    </section>
  );
}

/** Fades + lifts its children in the first time they enter the viewport. */
export function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-[900ms] ease-out ${
        shown ? 'translate-y-0 opacity-100 blur-0' : 'translate-y-8 opacity-0 blur-[2px]'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/** Section heading block: eyebrow label + title + optional lede. */
export function Heading({ eyebrow, title, lede, accent = 'cyan', center = false }) {
  const accentClass = accent === 'gold' ? 'text-mizzou-gold' : 'text-q-cyan';
  return (
    <div className={center ? 'text-center' : ''}>
      {eyebrow && (
        <div className={`eyebrow mb-4 ${accentClass} ${center ? 'justify-center' : ''}`}>
          <span className="mr-2 opacity-60">//</span>
          {eyebrow}
        </div>
      )}
      <h2 className="font-display text-3xl font-semibold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-[2.9rem]">
        {title}
      </h2>
      {lede && (
        <p className={`mt-5 text-base leading-relaxed text-slate-300/90 sm:text-lg ${center ? 'mx-auto max-w-2xl' : 'max-w-xl'}`}>
          {lede}
        </p>
      )}
    </div>
  );
}

/** Vertical breathing room between sections so the 3D scene can play. */
export function Spacer({ h = '60vh' }) {
  return <div aria-hidden="true" style={{ height: h }} />;
}
