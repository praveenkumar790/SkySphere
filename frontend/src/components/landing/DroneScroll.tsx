import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const SECTION_HEIGHT_VH = 400;

// Eagerly import any available frame assets. For a full cinematic sequence,
// drop 120 frames in `src/Assets/frames` following your preferred naming.
const frameModules = import.meta.glob('../../Assets/frames/*.{webp,jpg,jpeg,png}', {
  as: 'url',
  eager: true,
});

const frameUrls = Object.keys(frameModules)
  .sort()
  .map((key) => frameModules[key] as string);

const TOTAL_FRAMES = frameUrls.length;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function DroneScroll() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [progress, setProgress] = useState(0);
  const tickingRef = useRef(false);
  const progressRef = useRef(0);

  const images = useMemo(() => {
    const cache: HTMLImageElement[] = [];
    frameUrls.forEach((src, index) => {
      const img = new Image();
      img.src = src;
      cache[index] = img;
    });
    return cache;
  }, []);

  // Draw a specific frame index to canvas, respecting aspect ratio.
  const drawFrame = (index: number) => {
    const canvas = canvasRef.current;
    const image = images[index];
    if (!canvas || !image || !image.complete) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const { width, height } = canvas;
    const iw = image.width;
    const ih = image.height;

    if (!iw || !ih) return;

    // Use "cover" scaling, slightly zoomed to push any black frame edges off-screen
    const baseScale = Math.max(width / iw, height / ih);
    const scale = baseScale * 1.08;
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (width - dw) / 2;
    const dy = (height - dh) / 2;

    context.clearRect(0, 0, width, height);
    context.drawImage(image, dx, dy, dw, dh);
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const context = canvas.getContext('2d');
      if (context) {
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      drawFrame(0);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef.current, images.length]);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current || TOTAL_FRAMES === 0) return;

      if (!tickingRef.current) {
        tickingRef.current = true;

        window.requestAnimationFrame(() => {
          if (!sectionRef.current || TOTAL_FRAMES === 0) {
            tickingRef.current = false;
            return;
          }

          const rect = sectionRef.current.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          const sectionHeight = (SECTION_HEIGHT_VH / 100) * windowHeight;

          const start = rect.top;
          const rawProgress = (windowHeight - start) / (sectionHeight + windowHeight);
          const p = clamp(rawProgress, 0, 1);

          // Only trigger React re-render when the visible progress meaningfully changes
          if (Math.abs(p - progressRef.current) > 0.01) {
            progressRef.current = p;
            setProgress(p);
          }

          const frameIndex = Math.floor(p * (TOTAL_FRAMES - 1));
          drawFrame(frameIndex);

          tickingRef.current = false;
        });
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true } as EventListenerOptions);
    return () => window.removeEventListener('scroll', handleScroll as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length]);

  // Narrative beats driven by progress.
  // Intro stays visible until ~30%
  const introOpacity = clamp(1 - progress / 0.35, 0, 1);
  // Systems copy from ~30% to ~55%
  const systemsIn = clamp((progress - 0.25) / 0.2, 0, 1);
  const systemsOut = clamp((0.6 - progress) / 0.2, 0, 1);
  const systemsOpacity = systemsIn * systemsOut;
  // Intelligence copy from ~55% to ~80%
  const intelligenceIn = clamp((progress - 0.5) / 0.2, 0, 1);
  const intelligenceOut = clamp((0.85 - progress) / 0.2, 0, 1);
  const intelligenceOpacity = intelligenceIn * intelligenceOut;
  // Finale from ~80% to 100%
  const finaleOpacity = clamp((progress - 0.8) / 0.2, 0, 1);

  return (
    <section
      ref={sectionRef}
      className="relative w-full"
      style={{ height: `${SECTION_HEIGHT_VH}vh` }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#050505]">
        <div className="relative z-0 h-full w-full">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full bg-gradient-to-b from-[#050505] via-black to-[#050505] [image-rendering:high-quality]"
          />

          <div className="pointer-events-none absolute inset-0 flex items-stretch justify-stretch">
            {/* Intro */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center px-6 sm:px-10"
              animate={{ opacity: introOpacity }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <div className="max-w-3xl text-center rounded-3xl border border-white/5 bg-black/60 px-6 py-6 backdrop-blur-md">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-white/40">
                  Autonomy For The Physical World
                </p>
                <h1 className="text-balance text-4xl font-semibold leading-tight text-white/90 sm:text-5xl md:text-6xl">
                  SkySphere.
                  <span className="block text-white/60">
                  Embedded autonomy for outdoor drone operations.
                  </span>
                </h1>
              </div>
            </motion.div>

            {/* Precision Systems In Motion */}
            <motion.div
              className="absolute inset-0 flex items-center justify-start px-6 sm:px-16"
              animate={{ opacity: systemsOpacity, x: systemsOpacity ? 0 : -40 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <div className="max-w-md pointer-events-auto rounded-3xl border border-white/5 bg-black/70 px-5 py-5 backdrop-blur-md">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-white/40">
                  30% · Hardware Foundation
                </p>
                <h2 className="mb-3 text-2xl font-semibold text-white/90 sm:text-3xl">
                  Precision Systems In Motion.
                </h2>
                <p className="text-sm text-white/60">
                  Motors, airframe, and powertrain separate in mid-air, exposing the engineered
                  skeleton that keeps every mission stable in crosswinds, rain, and real-world
                  complexity.
                </p>
              </div>
            </motion.div>

            {/* Intelligence That Sees, Learns, And Acts */}
            <motion.div
              className="absolute inset-0 flex items-center justify-end px-6 sm:px-16"
              animate={{ opacity: intelligenceOpacity, x: intelligenceOpacity ? 0 : 40 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <div className="max-w-md text-right pointer-events-auto rounded-3xl border border-white/5 bg-black/70 px-5 py-5 backdrop-blur-md">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-white/40">
                  60% · Perception &amp; Compute
                </p>
                <h2 className="mb-3 text-2xl font-semibold text-white/90 sm:text-3xl">
                  Systems That See, Analyze, And Act.
                </h2>
                <p className="text-sm text-white/60">
                  Sensor arrays, edge compute, and real-time processing layers reveal themselves around the
                  frame — building a live model of the world to drive autonomous decision
                  making.
                </p>
              </div>
            </motion.div>

            {/* Finale / CTA */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center px-6 sm:px-10"
              animate={{ opacity: finaleOpacity, y: finaleOpacity ? 0 : 24 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <div className="pointer-events-auto max-w-xl text-center rounded-3xl border border-white/5 bg-black/70 px-6 py-6 backdrop-blur-md">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-white/40">
                  90% · Autonomous Core
                </p>
                <h2 className="mb-4 text-3xl font-semibold text-white/90 sm:text-4xl">
                  SkySphere. Embedded Autonomy At Scale.
                </h2>
                <p className="mb-8 text-sm text-white/60">
                  Real-time awareness. Autonomous response. A unified command for fleets of drones
                  executing complex outdoor operations without human micromanagement.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <a
                    href="/missions"
                    className="inline-flex items-center rounded-full border border-blue-400/40 bg-blue-500/10 px-6 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-200 shadow-[0_0_40px_rgba(37,99,235,0.35)] backdrop-blur-md transition hover:border-blue-300/70 hover:bg-blue-400/20 hover:text-white"
                  >
                    Launch Autonomy
                  </a>
                  <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">
                    Outdoor · Real-time · Multi-drone
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Ambient gradient + texture */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,rgba(37,99,235,0.14),transparent_55%),radial-gradient(circle_at_80%_100%,rgba(94,234,212,0.18),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 -z-20 opacity-[0.08] mix-blend-screen [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.4)_1px,transparent_0)] [background-size:3px_3px]" />
      </div>
    </section>
  );
}

