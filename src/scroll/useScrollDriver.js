import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scrollState, emitScroll } from './scrollState.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * Installs a single document-wide ScrollTrigger that writes normalized scroll
 * progress into `scrollState`. Everything else in the app, from the camera to the stage
 * fades, fades to the HUD, reads from that one number.
 */
export function useScrollDriver() {
  useEffect(() => {
    const st = ScrollTrigger.create({
      trigger: document.documentElement,
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        scrollState.progress = self.progress;
        scrollState.velocity = self.getVelocity();
        emitScroll();
      },
    });

    // Content images/fonts settle after mount; recalc so `end: max` is honest.
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);
    const t = setTimeout(refresh, 400);

    return () => {
      clearTimeout(t);
      window.removeEventListener('load', refresh);
      st.kill();
    };
  }, []);
}
