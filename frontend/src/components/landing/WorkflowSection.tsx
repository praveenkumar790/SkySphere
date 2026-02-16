import { motion } from 'framer-motion';
import { Map, Send, Activity, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';

const steps = [
  {
    icon: Map,
    title: "Plan",
    description: "Draw survey areas directly on the map. Select pattern, altitude, and overlap.",
    color: "text-blue-400",
    bg: "bg-blue-950/30",
    border: "border-blue-500/20"
  },
  {
    icon: Send,
    title: "Deploy",
    description: "One-click mission upload. Automated pre-flight checks and drone dispatch.",
    color: "text-purple-400",
    bg: "bg-purple-950/30",
    border: "border-purple-500/20"
  },
  {
    icon: Activity,
    title: "Monitor",
    description: "Track live telemetry, battery status, and video feed in real-time.",
    color: "text-emerald-400",
    bg: "bg-emerald-950/30",
    border: "border-emerald-500/20"
  },
  {
    icon: FileText,
    title: "Analyze",
    description: "Generate comprehensive mission reports with flight logs and coverage maps.",
    color: "text-yellow-400",
    bg: "bg-yellow-950/30",
    border: "border-yellow-500/20"
  }
];

export default function WorkflowSection() {
  return (
    <section className="relative py-32 bg-[#050505]">
      <div className="container px-4 mx-auto">
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="text-center mb-20"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            From Plan to Insight <br />
            <span className="text-white/50">in Four Steps.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
           {/* Connecting Line (Desktop) */}
           <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent hidden lg:block -translate-y-1/2 z-0" />
           
           {steps.map((step, index) => (
             <motion.div
               key={index}
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               transition={{ delay: index * 0.1 }}
               viewport={{ once: true }}
               className="relative z-10"
             >
               <Card className={`h-full p-6 bg-[#0A0A0A] border ${step.border} hover:bg-white/5 transition-colors group`}>
                 <div className={`w-12 h-12 rounded-xl ${step.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <step.icon className={`w-6 h-6 ${step.color}`} />
                 </div>
                 <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                 <p className="text-sm text-white/50 leading-relaxed">
                   {step.description}
                 </p>
               </Card>
             </motion.div>
           ))}
        </div>
      </div>
    </section>
  );
}
