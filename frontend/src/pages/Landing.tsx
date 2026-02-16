import Hero from '../components/landing/Hero';
import BentoGrid from '../components/landing/BentoGrid';
import PlatformShowcase from '@/components/landing/PlatformShowcase';
import WorkflowSection from '@/components/landing/WorkflowSection';
import Footer from '@/components/landing/Footer';

export default function Landing() {
  return (
    <main className="relative min-h-screen bg-[#050505] text-white selection:bg-blue-500/30 selection:text-blue-200 overflow-x-hidden">
      <Hero />
      <PlatformShowcase />
      <WorkflowSection />
      <BentoGrid />
      <Footer />
    </main>
  );
}

