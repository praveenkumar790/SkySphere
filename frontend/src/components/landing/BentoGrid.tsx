import { motion } from 'framer-motion';
import { 
  Cpu, 
  Radio, 
  ShieldCheck, 
  Zap 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const features = [
  {
    title: "Mission Orchestration",
    description: "Plan complex multi-drone surveys with sub-meter precision. Define waypoints, altitudes, and speeds in a visual 3D interface.",
    icon: <Radio className="w-6 h-6 text-blue-400" />,
    className: "md:col-span-2",
    bg: "bg-gradient-to-br from-blue-950/30 to-slate-950/50"
  },
  {
    title: "Real-time Telemetry",
    description: "Low-latency streaming of position, battery, and sensor data directly to your command center.",
    icon: <Zap className="w-6 h-6 text-yellow-400" />,
    className: "md:col-span-1",
    bg: "bg-slate-900/50"
  },
  {
    title: "Safety Systems",
    description: "Built-in failsafes including return-to-home, battery monitoring, and geofencing enforcement.",
    icon: <Cpu className="w-6 h-6 text-purple-400" />,
    className: "md:col-span-1",
    bg: "bg-slate-900/50"
  },
  {
    title: "Secure Comms",
    description: "End-to-end encrypted datalinks ensuring your fleet data remains private and tamper-proof.",
    icon: <ShieldCheck className="w-6 h-6 text-green-400" />,
    className: "md:col-span-2",
    bg: "bg-gradient-to-bl from-green-950/30 to-slate-950/50"
  },
];

const BentoCard = ({ title, description, icon, className, bg, index }: any) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-white/10 p-8 backdrop-blur-sm transition-colors hover:border-white/20",
        className,
        bg
      )}
    >
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10 transition-transform group-hover:scale-110 group-hover:bg-white/10 backdrop-blur-md">
          {icon}
        </div>
        
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
          <p className="text-sm text-white/50 leading-relaxed group-hover:text-white/70 transition-colors">{description}</p>
        </div>
      </div>

      {/* Subtle Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('/grid.svg')] pointer-events-none" />
      
      {/* Glass gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Hover Gradient Effect */}
      <div 
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: "radial-gradient(600px circle at var(--mouse-x, 0) var(--mouse-y, 0), rgba(255, 255, 255, 0.06), transparent 40%)"
        }} 
      />
    </motion.div>
  );
};

export default function BentoGrid() {
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    for (const card of e.currentTarget.getElementsByClassName("group")) {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      (card as HTMLElement).style.setProperty("--mouse-x", `${x}px`);
      (card as HTMLElement).style.setProperty("--mouse-y", `${y}px`);
    }
  };

  return (
    <section 
      className="relative z-10 mx-auto max-w-7xl px-6 py-24 md:px-10"
      onMouseMove={handleMouseMove}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-16 text-center"
      >
        <h2 className="text-3xl font-bold tracking-tight text-white mb-4 sm:text-4xl">
          Engineered for Autonomy
        </h2>
        <p className="text-lg text-white/50 max-w-2xl mx-auto">
          SkySphere provides the critical infrastructure needed to scale from a single drone to a global fleet.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {features.map((feature, i) => (
          <BentoCard key={i} index={i} {...feature} />
        ))}
      </div>
    </section>
  );
}
