import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scrollState, emitScroll } from './scrollState.js';
import { measureDwellZones, buildPacing, samplePacing, dwellAt } from './pacing.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * Installs a single document-wide ScrollTrigger that writes normalized scroll
 * progress into `scrollState`. Everything else in the app, from the camera to the stage
 * fades, fades to the HUD, reads from that one number.
 *
 * Scroll position is also run through the pacing curve here rather than in the
 * camera, so every consumer of `scrollState.eased` stays on the same clock.
 */
export function useScrollDriver() {
  useEffect(() => {
    let zones = null;
    let table = null;

    const publish = (progress) => {
      scrollState.progress = progress;
      scrollState.dwell = dwellAt(progress, zones);
      scrollState.eased = samplePacing(table, progress);
      emitScroll();
    };

    // Section geometry drives the pacing, so it has to be re-read whenever the
    // layout changes. ScrollTrigger already refreshes on resize and on font or
    // image settle, so riding its refresh covers every case.
    const remeasure = () => {
      zones = measureDwellZones();
      table = buildPacing(zones);
      publish(scrollState.progress);
    };

    remeasure();

    const st = ScrollTrigger.create({
      trigger: document.documentElement,
      start: 0,
      end: 'max',
      onRefresh: remeasure,
      onUpdate: (self) => {
        scrollState.velocity = self.getVelocity();
        publish(self.progress);
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
