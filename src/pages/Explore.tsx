import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Search, Star, ArrowRight, SlidersHorizontal, WifiOff 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';
import { useNavigate } from 'react-router-dom';

export default function Explore() {
  const [pros, setPros] = useState<any[]>([]);
  const [filteredPros, setFilteredPros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPros = async () => {
      const { data } = await supabase
        .from('pro_profiles')
        .select('*')
        .eq('is_online', true)
        .order('rating', { ascending: false });

      if (data) {
        setPros(data);
        setFilteredPros(data);
      }
      setLoading(false);
    };

    fetchPros();

    const channel = supabase
      .channel('explore-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pro_profiles' },
        (payload) => {
          const updatedPro = payload.new as any;
          setPros((prev) => {
            if (updatedPro.is_online) {
              const exists = prev.some(p => p.id === updatedPro.id);
              if (exists) return prev.map(p => p.id === updatedPro.id ? updatedPro : p);
              return [updatedPro, ...prev].sort((a, b) => b.rating - a.rating);
            }
            return prev.filter(p => p.id !== updatedPro.id);
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    let result = pros;
    if (searchQuery) {
      result = result.filter(pro => 
        pro.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pro.profession.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredPros(result);
  }, [searchQuery, pros]);

  if (loading) {
    return (
      <div className="h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-brand-purple/30 pb-20">
      
      
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5 p-4 pt-4">
        <div className="w-full space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-black tracking-tighter">Explore</h1>
           
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-brand-purple transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Find talent online..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:border-brand-purple/50 transition-all placeholder:text-zinc-600 text-sm font-medium"
            />
          </div>
        </div>
      </header>

      <main className="w-full p-3 pt-4">
        {filteredPros.length > 0 ? (

          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <AnimatePresence mode='popLayout'>
              {filteredPros.map((pro) => (
                <motion.div
                  layout
                  key={pro.id}
                  layoutId={`card-${pro.id}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => navigate(`/pro/${pro.id}`)}
                  className="cursor-pointer"
                >
                  <GlassCard className="h-full border-white/5 flex flex-col items-center p-3 group relative overflow-hidden rounded-[1.8rem]">

  <div className="relative w-40 h-44 rounded-[1.4rem] overflow-hidden border border-white/10 shrink-0">
    <img 
      src={pro.avatar_url} 
      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
      alt={pro.full_name} 
    />
    
    
    <div className="absolute top-2 left-2 bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded-lg border border-white/10 flex items-center gap-1">
      <Star size={8} className="text-yellow-500 fill-yellow-500" />
      <span className="text-[9px] font-black text-white">{pro.rating}</span>
    </div>

    
    <div className="absolute top-2 right-2 h-2 w-2 bg-emerald-500 rounded-full border border-white/20 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
  </div>

  
  <div className="w-35 flex flex-col flex-1 pt-3 justify-between">
    <div className="text-left">
      <p className="text-brand-pink text-[14px] font-black  tracking-wide truncate mb-0.5 opacity-100">
        {pro.profession}
      </p>
      <h4 className="font-black text-[14px] truncate leading-tight tracking-tight text-zinc-100">
        {pro.full_name}
      </h4>
    </div>
    
    
    <div className="flex items-center justify-between pt-2 px-0">
      <div className="flex flex-col">
        <span className="text-[13px] font-black text-brand-purple leading-none">₹{pro.price_per_hour}</span>
        <span className="text-[10px] font-bold text-zinc-500 ">/ Hr</span>
      </div>
      
      <motion.button 
        whileTap={{ scale: 0.9 }}
        className="w-7 h-7 bg-white/5 hover:bg-brand-purple text-zinc-400 hover:text-white rounded-lg border border-white/10 flex items-center justify-center transition-all"
      >
        <ArrowRight size={14} />
      </motion.button>
    </div>
  </div>
</GlassCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem] mx-4">
            <WifiOff size={0} className="text-zinc-700 mx-auto mb-4" />
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">No Search Experts</h3>
          </div>
        )}
      </main>
    </div>
  );
}