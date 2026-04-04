import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthAndNavigate = () => {
      // 1. Check for our custom persistent login key
      const savedPhone = localStorage.getItem('sb_user_phone');
      
      // 2. Extended timeout to allow the slow, cinematic animation to finish
      const timer = setTimeout(() => {
        if (savedPhone) {
          // If phone exists, user is "logged in", go Home
          navigate('/home'); 
        } else {
          // Otherwise, go to Role Selection
          navigate('/select-role'); 
        }
      }, 4800);

      return () => clearTimeout(timer);
    };

    checkAuthAndNavigate();
  }, [navigate]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="bg-glow fixed inset-0 flex flex-col items-center justify-center bg-[#0a0a0a] z-50 h-[100dvh] overflow-hidden select-none"
    >
      {/* Background Decorative Glow (Matches Auth UI) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-10 bg-brand-purple" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-10 bg-brand-pink" />

      {/* Main Logo Container */}
      <div className="relative flex items-center text-6xl md:text-8xl font-black tracking-tighter">
        
        {/* "BE" */}
        <motion.span
          initial={{ x: -220, opacity: 0, filter: "blur(15px)" }}
          animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
          transition={{ 
            duration: 2.5, 
            ease: [0.16, 1, 0.3, 1],
            delay: 0.3 
          }}
          className="bg-gradient-to-r from-brand-purple to-brand-pink bg-clip-text text-transparent pr-2"
        >
          Be
        </motion.span>
        
        {/* "SOCIAL" */}
        <motion.span
          initial={{ x: 220, opacity: 0, filter: "blur(15px)" }}
          animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
          transition={{ 
            duration: 2.5, 
            ease: [0.16, 1, 0.3, 1],
            delay: 0.3 
          }}
          className="bg-gradient-to-r from-brand-purple to-brand-pink bg-clip-text text-transparent"
        >
          Social
        </motion.span>
      </div>

      {/* Sub-text */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.2, duration: 1.2, ease: "easeOut" }}
        className="mt-4 flex items-center gap-4 text-[14px] md:text-md font-bold tracking-[0.1em] text-white/40"
      >
        <span>Find</span>
        <div className="h-1 w-1 rounded-full bg-brand-pink/40" />
        <span>Connect</span>
        <div className="h-1 w-1 rounded-full bg-brand-pink/40" />
        <span>Meet</span>
      </motion.div>

      {/* Subtle Loading Indicator */}
      <motion.div 
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.5, duration: 4, ease: "linear" }}
        className="absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r from-brand-purple to-brand-pink origin-left opacity-50"
      />
    </motion.div>
  );
}