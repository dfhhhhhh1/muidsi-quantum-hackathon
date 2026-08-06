import React, { useEffect, useState } from 'react';
import { Scene } from './three/Scene.jsx';
import { useScrollDriver } from './scroll/useScrollDriver.js';
import { Chrome } from './ui/Chrome.jsx';
import { Hero } from './ui/Hero.jsx';
import { EventDetails } from './ui/EventDetails.jsx';
import { Registration } from './ui/Registration.jsx';
import { Tutorials } from './ui/Tutorials.jsx';
import { Schedule } from './ui/Schedule.jsx';
import { Footer } from './ui/Footer.jsx';
import { Spacer } from './ui/Section.jsx';
import { Loader } from './ui/Loader.jsx';

export default function App() {
  useScrollDriver();
  const reducedMotion = usePrefersReducedMotion();

  return (
    <>
      <Loader />

      {/* Fixed 3D layer */}
      <Scene reducedMotion={reducedMotion} />

      {/* Fixed UI chrome */}
      <Chrome />

      {/* Scrolling content. z-10 keeps it above the canvas; the canvas itself is
          pointer-events-none so scroll passes straight through. */}
      <main className="relative z-10">
        <Hero />
        <Spacer h="55vh" />
        <EventDetails />
        <Spacer h="45vh" />
        <Registration />
        <Spacer h="40vh" />
        <Tutorials />
        <Spacer h="35vh" />
        <Schedule />
        <Footer />
      </main>

      {/* A soft floor gradient so text always has something to sit against */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[5] h-40 bg-gradient-to-t from-q-void/90 to-transparent" />
    </>
  );
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return reduced;
}
