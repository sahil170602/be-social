import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Briefcase } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';

export default function RoleSelection() {
  const navigate = useNavigate();

  const handleSelectRole = (role: 'user' | 'pro') => {
    localStorage.setItem('user_role', role);
    navigate(`/auth/${role}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <div className="min-h-[100dvh] bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
      
      {/* Background Animated Glows */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-purple/20 rounded-full blur-[120px] pointer-events-none" 
      />
      <motion.div 
        animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-pink/20 rounded-full blur-[120px] pointer-events-none" 
      />

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="z-10 w-full max-w-3xl text-center">
        <motion.h1 variants={itemVariants} className="text-4xl md:text-5xl font-bold mb-4">
          Join <span className="font-extrabold bg-gradient-to-r from-brand-purple to-brand-pink bg-clip-text text-transparent">Be Social</span>
        </motion.h1>    
        <motion.p variants={itemVariants} className="text-zinc-500 mb-12 text-sm tracking-wide">
          Choose your path. Professionals undergo a verification process.
        </motion.p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* USER CARD */}
          <motion.button 
            variants={itemVariants} 
            whileHover={{ y: -5 }} 
            whileTap={{ scale: 0.98 }} 
            onClick={() => handleSelectRole('user')} 
            className="text-left w-full group outline-none"
          >
            <GlassCard className="h-full border-white/5 group-hover:border-brand-purple/40 group-hover:bg-brand-purple/[0.02]">
              <div className="flex items-center gap-5 mb-5">
                <div className="p-4 bg-brand-purple/10 rounded-2xl text-brand-purple group-hover:bg-brand-purple/20 transition-colors">
                  <User size={32} strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-bold">Find a Pro</h2>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">Discover professionals, book meetings, and expand your network.</p>
            </GlassCard>
          </motion.button>

          {/* PRO CARD */}
          <motion.button 
            variants={itemVariants} 
            whileHover={{ y: -5 }} 
            whileTap={{ scale: 0.98 }} 
            onClick={() => handleSelectRole('pro')} 
            className="text-left w-full group outline-none"
          >
            <GlassCard className="h-full border-white/5 group-hover:border-brand-pink/40 group-hover:bg-brand-pink/[0.02]">
              <div className="flex items-center gap-5 mb-5">
                <div className="p-4 bg-brand-pink/10 rounded-2xl text-brand-pink group-hover:bg-brand-pink/20 transition-colors">
                  <Briefcase size={32} strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-bold">Become a Pro</h2>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">Offer expertise, manage schedule, and earn securely through escrow.</p>
            </GlassCard>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}