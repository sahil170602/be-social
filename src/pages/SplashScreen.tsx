import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthAndNavigate = () => {
<<<<<<< HEAD
      // 1. Check for persistent login and role
      const savedPhone = localStorage.getItem('sb_user_phone');
      const userRole = localStorage.getItem('user_role');
=======
      // 1. Check for persistent login and specific role
      const savedPhone = localStorage.getItem('sb_user_phone');
      const role = localStorage.getItem('user_role');
>>>>>>> 156638f6e2bff6d51419cdd9fa8935ec56842993
      
      // 2. Extended timeout for the cinematic animation
      const timer = setTimeout(() => {
        if (savedPhone) {
<<<<<<< HEAD
          // Check role to decide destination
          if (userRole === 'pro') {
            navigate('/pro-dashboard', { replace: true });
          } else {
            navigate('/home', { replace: true });
          }
        } else {
          // New user or logged out
          navigate('/select-role', { replace: true }); 
=======
          // --- FIXED ROLE-BASED REDIRECT ---
          if (role === 'pro') {
            // If professional, go to Pro dashboard
            navigate('/pro-dashboard', { replace: true });
          } else {
            // If standard user, go to User home
            navigate('/home', { replace: true });
          }
        } else {
          // Otherwise, go to Role selection
          navigate('/select-role', { replace: true });
>>>>>>> 156638f6e2bff6d51419cdd9fa8935ec56842993
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
      className="fixed inset-0 flex flex-col items-center justify-center bg-[#0a0a0a] z-[1000] h-[100dvh] overflow-hidden select-none"
    >
<<<<<<< HEAD
      {/* Background Decorative Glow */}
=======
      {/* Background decorative glow */}
>>>>>>> 156638f6e2bff6d51419cdd9fa8935ec56842993
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-10 bg-brand-purple" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-10 bg-brand-pink" />

      {/* Main logo container */}
      <div className="relative flex items-center text-6xl md:text-8xl font-black tracking-tighter">
        
        {/* "Be" */}
        <motion.span
          initial={{ x: -220, opacity: 0, filter: "blur(15px)" }}
          animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
          transition={{ 
            duration: 2.5, 
            ease: [0.16, 1, 0.3, 1],
            delay: 0.3 
          }}
          className="bg-gradient-to-r from-brand-purple to-brand-pink bg-clip-text text-transparent pr-3"
        >
          Be
        </motion.span>
        
        {/* "social" */}
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
          social
        </motion.span>
      </div>

      {/* Sub-text */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.2, duration: 1.2, ease: "easeOut" }}
        className="mt-4 flex items-center gap-4 text-[14px] font-bold tracking-[0.1em] text-white/40"
      >
        <span>Find</span>
        <div className="h-1 w-1 rounded-full bg-brand-pink/40" />
        <span>Connect</span>
        <div className="h-1 w-1 rounded-full bg-brand-pink/40" />
        <span>Meet</span>
      </motion.div>

      {/* Subtle loading indicator at bottom */}
      <motion.div 
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.5, duration: 4, ease: "linear" }}
        className="absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r from-brand-purple to-brand-pink origin-left opacity-50"
      />
    </motion.div>
  );
}
