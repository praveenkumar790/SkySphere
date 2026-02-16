import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Settings, Map as MapIcon, ChevronRight } from 'lucide-react';

export default function PlatformShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [15, 0, -15]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.8, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1]);

  return (
    <section id="platform-showcase" ref={ref} className="relative min-h-screen py-32 flex flex-col items-center justify-center overflow-hidden bg-[#050505]">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="container relative z-10 px-4 mx-auto text-center mb-16">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.8 }}
        >
          <Badge className="mb-4 bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20 transition-colors">
            Mission Control Center
          </Badge>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6">
            Command Your Fleet <br />
            <span className="text-white/40">From Anywhere.</span>
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Plan, simulate, and execute complex autonomous missions with our unified interface.
          </p>
        </motion.div>
      </div>

      {/* 3D Dashboard Mockup */}
      <motion.div 
        style={{ rotateX, scale, opacity }}
        className="relative w-full max-w-[1200px] px-4 perspective-1000"
      >
        <div className="relative rounded-xl border border-white/10 bg-[#0A0A0A] backdrop-blur-xl shadow-2xl overflow-hidden p-2">
           {/* Mockup Header */}
           <div className="h-10 border-b border-white/5 bg-white/5 flex items-center px-4 gap-2 mb-2 rounded-t-lg justify-between">
             <div className="flex gap-1.5">
               <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
               <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
               <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
             </div>
             <div className="text-[10px] text-white/30 uppercase tracking-widest font-mono">
               skysphere_mission_planner.exe
             </div>
             <div className="w-16" /> {/* Spacer for centering */}
           </div>

           {/* Mockup Content Grid */}
           <div className="flex flex-col md:flex-row gap-6 h-[600px] p-4 bg-[#050505]">
              
              {/* Main Map Area (Left) */}
              <div className="flex-1 rounded-lg border border-white/10 bg-[#080808] relative overflow-hidden group">
                 {/* Satellite Map Texture */}
                 <div className="absolute inset-0 opacity-40 mix-blend-overlay" 
                      style={{ 
                          backgroundImage: 'url("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/10/100/100")',
                          backgroundSize: 'cover'
                      }} 
                 />
                 
                 {/* Grid Overlay */}
                 <div className="absolute inset-0" 
                      style={{ 
                          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', 
                          backgroundSize: '40px 40px' 
                      }} 
                 />
                 
                 {/* Mission Polygon Area */}
                 <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <defs>
                       <pattern id="hatch" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                          <line x1="0" y="0" x2="0" y2="8" stroke="#2563eb" strokeWidth="1" opacity="0.2" />
                       </pattern>
                    </defs>
                    <polygon points="150,400 300,200 600,250 550,500" fill="url(#hatch)" stroke="#2563eb" strokeWidth="2" strokeDasharray="4 4" className="animate-pulse opacity-80" />
                    
                    {/* Waypoints */}
                    <path d="M 170 380 L 280 220 L 580 270 L 530 480" fill="none" stroke="#60a5fa" strokeWidth="2" className="opacity-60" />
                    {[
                      {x: 170, y: 380}, {x: 280, y: 220}, {x: 580, y: 270}, {x: 530, y: 480}
                    ].map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.y} r="4" fill="#60a5fa" stroke="white" strokeWidth="1" />
                    ))}
                 </svg>

                 {/* Drone Marker */}
                 <div className="absolute top-[220px] left-[280px] -translate-x-1/2 -translate-y-1/2">
                    <div className="w-32 h-32 border border-blue-500/30 rounded-full animate-ping opacity-20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-b-[10px] border-b-blue-500 border-r-[6px] border-r-transparent relative z-10 filter drop-shadow-[0_0_10px_rgba(37,99,235,1)]" />
                 </div>
                 
                 {/* Floating Map Controls */}
                 <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <div className="p-2 bg-black/80 backdrop-blur rounded border border-white/10 hover:bg-white/10 cursor-pointer">
                       <div className="w-4 h-4 border-2 border-white/60 rounded-sm" />
                    </div>
                    <div className="p-2 bg-black/80 backdrop-blur rounded border border-white/10 hover:bg-white/10 cursor-pointer">
                       <div className="w-4 h-4 border-2 border-white/60 rounded-full" />
                    </div>
                 </div>
              </div>

              {/* Sidebar Configuration (Right) */}
              <div className="w-full md:w-[320px] flex flex-col gap-4 bg-[#080808] border border-white/5 rounded-lg p-5">
                 <div className="flex items-center gap-2 mb-2 pb-4 border-b border-white/5">
                   <MapIcon className="h-5 w-5 text-blue-500" />
                   <h3 className="font-bold text-white tracking-wide">Mission Planning</h3>
                 </div>

                 {/* Simulated Form Fields */}
                 <div className="space-y-4 flex-1">
                    <div className="space-y-1.5">
                       <div className="text-[10px] text-white/40 uppercase font-semibold">Mission Name</div>
                       <div className="h-9 w-full bg-white/5 rounded border border-white/5 flex items-center px-3 text-sm text-white/80">
                          Sector Alpha Survey
                       </div>
                    </div>
                    
                    <div className="space-y-1.5">
                       <div className="text-[10px] text-white/40 uppercase font-semibold">Pattern</div>
                       <div className="h-9 w-full bg-white/5 rounded border border-white/5 flex items-center justify-between px-3 text-sm text-white/80">
                          Crosshatch
                          <ChevronRight className="w-4 h-4 text-white/20 rotate-90" />
                       </div>
                    </div>

                    <div className="space-y-1.5">
                       <div className="flex justify-between">
                          <div className="text-[10px] text-white/40 uppercase font-semibold">Altitude</div>
                          <div className="text-[10px] text-blue-400 font-mono">50m</div>
                       </div>
                       <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden relative">
                          <div className="absolute top-0 left-0 h-full w-[40%] bg-blue-500" />
                          <div className="absolute top-1/2 left-[40%] -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow" />
                       </div>
                    </div>

                    <div className="space-y-1.5">
                       <div className="flex justify-between">
                          <div className="text-[10px] text-white/40 uppercase font-semibold">Overlap</div>
                          <div className="text-[10px] text-blue-400 font-mono">75%</div>
                       </div>
                       <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden relative">
                          <div className="absolute top-0 left-0 h-full w-[75%] bg-purple-500" />
                          <div className="absolute top-1/2 left-[75%] -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow" />
                       </div>
                    </div>
                 </div>

                 <div className="mt-auto space-y-3 pt-6 border-t border-white/5">
                    <div className="h-10 w-full bg-white/5 rounded flex items-center justify-center text-sm font-medium text-white hover:bg-white/10 transition-colors border border-white/5 cursor-pointer">
                       <Settings className="w-4 h-4 mr-2" /> Configure Payload
                    </div>
                    <div className="h-10 w-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-shadow cursor-pointer">
                       Generate Waypoints
                    </div>
                 </div>
              </div>

           </div>
        </div>
      </motion.div>
    </section>
  );
}
