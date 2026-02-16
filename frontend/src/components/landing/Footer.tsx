import { Hexagon, Twitter, Github, Linkedin, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function Footer() {
  return (
    <footer className="relative bg-[#050505] pt-32 pb-16 overflow-hidden border-t border-white/5">
      <div className="container px-4 mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-24">
           <div>
              <h2 className="text-6xl md:text-8xl font-bold text-white tracking-tighter mb-8 leading-[0.9]">
                 Ready to <br />
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Take Flight?</span>
              </h2>
              <p className="text-xl text-white/50 max-w-md">
                 Join the autonomous revolution. Deploy your first mission in minutes, not days.
              </p>
           </div>
           
           <div className="flex flex-col justify-end items-start md:items-end gap-6">
              <Button size="lg" className="h-16 px-10 rounded-full text-lg bg-white text-black hover:bg-blue-50 transition-colors" asChild>
                 <Link to="/missions">
                    Start Now <ArrowUpRight className="ml-2 w-5 h-5" />
                 </Link>
              </Button>
              <div className="flex gap-6">
                 {[Twitter, Github, Linkedin].map((Icon, i) => (
                    <a key={i} href="#" className="p-3 rounded-full border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group">
                       <Icon className="w-5 h-5 text-white/60 group-hover:text-white" />
                    </a>
                 ))}
              </div>
           </div>
        </div>
        

        
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5">
           <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Hexagon className="w-6 h-6 text-blue-500 fill-blue-500/20" />
              <span className="text-lg font-bold text-white tracking-widest">SKYSPHERE</span>
           </div>
           <div className="text-white/30 text-sm">
              © 2026 SkySphere Inc. All rights reserved.
           </div>
        </div>
      </div>
      
      {/* Big text bottom decoration */}
      <motion.div 
         initial={{ x: "0%" }}
         animate={{ x: "-100%" }}
         transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
         className="absolute -bottom-10 left-0 whitespace-nowrap opacity-[0.03] select-none pointer-events-none"
      >
         <span className="text-[20vw] font-black text-white/40 leading-none">AUTONOMOUS AERIAL INFRASTRUCTURE</span>
         <span className="text-[20vw] font-black text-white/40 leading-none ml-10">AUTONOMOUS AERIAL INFRASTRUCTURE</span>
      </motion.div>
    </footer>
  );
}
