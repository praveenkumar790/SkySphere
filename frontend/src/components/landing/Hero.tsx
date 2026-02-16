import { useRef } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useMotionTemplate } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import MagneticButton from '@/components/ui/magnetic-button';
// Importing the new cinematic drone asset
import heroBg from '../../Assets/A_Drone.png';

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <section 
      className="relative min-h-[100vh] w-full flex flex-col items-center justify-center overflow-hidden bg-[#050505] text-white pt-0 pb-20"
      onMouseMove={onMouseMove}
      ref={ref}
    >
      {/* Cinematic Background Layer */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-50 scale-105"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-[#050505]/40 to-[#050505]" />
        
        {/* Grain Texture Overlay */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />

        {/* Mouse Follower Spotlight */}
        <motion.div
          className="pointer-events-none absolute -inset-px opacity-0 transition duration-500 group-hover:opacity-100"
          style={{
            background: useMotionTemplate`
              radial-gradient(
                800px circle at ${mouseX}px ${mouseY}px,
                rgba(34, 211, 238, 0.08),
                transparent 80%
              )
            `,
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-7xl px-6 md:px-10 flex flex-col items-center text-center">
        {/* Badge */}


        {/* Main Title Staggered Reveal */}
        <div className="mb-8 overflow-hidden">
             <motion.h1
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter text-white mix-blend-overlay"
            >
              SkySphere
            </motion.h1>
        </div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="max-w-2xl text-lg md:text-xl text-white/60 mb-12 leading-relaxed"
        >
          The operating system for autonomous aerial infrastructure. 
          Orchestrate multi-drone fleets with battlefield-tested reliability and centimeter-level precision.
        </motion.p>

        {/* CTA Buttons with Magnetic Effect */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-6 items-center"
        >
          <MagneticButton>
            <Button 
              size="lg" 
              className="h-14 px-8 rounded-full bg-white text-black hover:bg-blue-50 text-base font-semibold transition-all"
              asChild
            >
              <Link to="/missions">
                Deploy Mission <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </MagneticButton>
          
          <MagneticButton>
            <Button 
              size="lg" 
              variant="outline" 
              className="h-14 px-8 rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white hover:border-white/20 text-base font-medium backdrop-blur-sm transition-all"
              onClick={() => document.getElementById('platform-showcase')?.scrollIntoView({ behavior: 'smooth' })}
            >
              View Platform
            </Button>
          </MagneticButton>
        </motion.div>
      </div>

      {/* Floating Elements (Parallax) */}
      <motion.div style={{ y: y1 }} className="absolute bottom-20 left-0 w-full flex justify-center pointer-events-none">
         <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 animate-pulse">Scroll to Explore</span>
      </motion.div>
    </section>
  );
}
