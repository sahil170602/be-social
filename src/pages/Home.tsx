import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  User, Bell, Star, Check, X, ArrowRight, WifiOff 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
  'UI/UX Designer', 'Full Stack Developer', 'Event Planner', 
  'Photographer', 'Digital Marketer', 'DevOps Engineer', 
  'Illustrator', 'Fitness Coach', 'Content Strategist', 'Video Editor'
];

export default function Home() {
  const [profile, setProfile] = useState<any>(null);
  const [pros, setPros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const userPhone = localStorage.getItem('sb_user_phone');
      if (!userPhone) { setLoading(false); return; }

      // 1. Fetch User
      const { data: userData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('phone', userPhone)
        .maybeSingle();

      // 2. Fetch Pros (Initially ONLY online ones)
      const { data: prosData } = await supabase
        .from('pro_profiles')
        .select('*')
        .eq('is_online', true)
        .order('rating', { ascending: false });

      if (userData) {
        setProfile(userData);
        if (!userData.interests || userData.interests.length === 0) setShowPopup(true);
      }
      if (prosData) setPros(prosData);
      setLoading(false);
    };

    fetchData();

    // 3. REALTIME SUBSCRIPTION
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pro_profiles' },
        (payload) => {
          const updatedPro = payload.new as any;

          setPros((prevPros) => {
            const isAlreadyInList = prevPros.some(p => p.id === updatedPro.id);

            if (updatedPro.is_online) {
              if (isAlreadyInList) {
                return prevPros.map(p => p.id === updatedPro.id ? updatedPro : p);
              } else {
                return [updatedPro, ...prevPros].sort((a, b) => b.rating - a.rating);
              }
            } else {
              return prevPros.filter(p => p.id !== updatedPro.id);
            }
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSaveInterests = async () => {
    const phoneToUpdate = profile?.phone || localStorage.getItem('sb_user_phone');
    if (!phoneToUpdate) return;
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ interests: selectedInterests })
      .eq('phone', phoneToUpdate)
      .select();
    if (!error && data) {
      setProfile((prev: any) => ({ ...prev, interests: selectedInterests }));
      setShowPopup(false);
    }
  };

  const toggleInterest = (cat: string) => {
    setSelectedInterests(prev => 
      prev.includes(cat) ? prev.filter(i => i !== cat) : [...prev, cat]
    );
  };

  const recommendedPros = pros.filter(pro => 
    profile?.interests?.includes(pro.profession)
  );

  const otherPros = pros.filter(pro => 
    !profile?.interests?.includes(pro.profession)
  );

  if (loading) {
    return (
      <div className="h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-brand-purple/30 pb-32">
      {/* ADDED pt-14 and pb-4 HERE to push the header down below the Android status bar */}
      <nav className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 px-6 pb-4 pt-14">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <h1 className="font-extrabold text-[30px] bg-gradient-to-r from-brand-purple to-brand-pink bg-clip-text text-transparent tracking-tighter">Be Social</h1>
          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-white/5 rounded-full transition-colors">
              <Bell size={24} className="text-zinc-400" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-brand-purple rounded-full border border-[#0a0a0a]"></span>
            </button>
            <motion.div 
              whileTap={{ scale: 0.95 }}
              onClick={() => profile?.avatar_url && setIsZoomed(true)}
              className="w-11 h-11 rounded-full bg-gradient-to-tr from-brand-purple to-brand-pink p-[1.5px] cursor-pointer overflow-hidden"
            >
              <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center overflow-hidden border border-white/5">
                {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Profile" /> : <User size={22} />}
              </div>
            </motion.div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6 space-y-8">
        <section>
          <h1 className="text-4xl font-black tracking-tighter">Hey, {profile?.full_name?.split(' ')[0] || 'Social'}!</h1>
        </section>

        {/* --- RECOMMENDED --- */}
        <AnimatePresence>
          {recommendedPros.length > 0 && (
            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h3 className="text-lg font-black tracking-tight px-2 flex items-center gap-2 uppercase text-[12px] text-zinc-500 tracking-[0.2em]">
                <span className="h-2 w-2 rounded-full bg-brand-pink animate-pulse" /> Recommended
              </h3>
              
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
                {recommendedPros.map((pro) => (
                  <motion.div 
                    layout 
                    key={pro.id} 
                    className="min-w-[290px] cursor-pointer active:scale-95 transition-transform"
                    onClick={() => navigate(`/pro/${pro.id}`)}
                  >
                    <GlassCard className="p-4 border-white/5 h-full flex flex-col gap-3 relative rounded-[2.2rem]">
                      <div className="flex gap-4 items-center">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 shrink-0">
                          <img src={pro.avatar_url} className="w-full h-full object-cover" alt={pro.full_name} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-[17px] leading-tight truncate">{pro.full_name}</h4>
                          <p className="text-brand-pink text-[10px] font-black uppercase tracking-wider mb-1">
                            {pro.profession}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <Star size={12} className="text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-black text-white">{pro.rating}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-zinc-400 text-[11px] line-clamp-2 leading-relaxed italic px-1">
                        "{pro.bio}"
                      </p>

                      <div className="flex justify-between items-center mt-auto pt-3 border-t border-white/5">
                        <div className="flex flex-col">
                          <span className="text-[14px] font-black text-brand-purple italic leading-none">
                            ₹{pro.price_per_hour}
                          </span>
                          <span className="text-[9px] text-zinc-600 font-bold uppercase mt-0.5">per hour</span>
                        </div>
                        
                        <div className="bg-brand-purple/10 text-brand-purple p-2 rounded-xl border border-brand-purple/10">
                          <ArrowRight size={20} />
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* --- ALL EXPERTS --- */}
        <section className="space-y-6">
          <h3 className="text-lg font-black tracking-tight px-2">All Experts</h3>
          <div className="grid grid-cols-1 gap-4">
            {otherPros.length > 0 ? (
              otherPros.map((pro) => (
                <motion.div 
                  layout 
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  key={pro.id}
                  className="cursor-pointer active:scale-[0.98] transition-transform"
                  onClick={() => navigate(`/pro/${pro.id}`)}
                >
                  <GlassCard className="p-1 border-white/5 flex gap-4 items-center hover:bg-white/[0.04] transition-colors group">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 shrink-0 relative">
                      <img src={pro.avatar_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={pro.full_name} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-black text-base truncate tracking-tight">{pro.full_name}</h4>
                          <p className="text-brand-purple text-[10px] font-bold uppercase tracking-wider">{pro.profession}</p>
                        </div>
                        <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg">
                          <Star size={10} className="text-yellow-500 fill-yellow-500" />
                          <span className="text-[10px] font-bold">{pro.rating}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-white font-bold text-xs italic">₹{pro.price_per_hour}/hr</span>
                        <span className="text-brand-pink text-[10px] font-black uppercase tracking-tighter group-hover:underline">View Profile</span>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-12 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                <WifiOff className="mx-auto text-zinc-700 mb-4" size={40} />
                <p className="text-zinc-600 font-bold uppercase text-[10px] tracking-widest">No experts are live right now</p>
              </motion.div>
            )}
          </div>
        </section>
      </main>

      {/* Popups */}
      <AnimatePresence>
        {showPopup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-xl flex items-end sm:items-center justify-center p-4">
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="w-full max-w-lg bg-[#111] border border-white/10 rounded-[40px] p-8 shadow-2xl">
              <h2 className="text-3xl font-black tracking-tighter mb-2">What are you looking for?</h2>
              <div className="flex flex-wrap gap-3 mb-10">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => toggleInterest(cat)} className={`px-4 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border ${selectedInterests.includes(cat) ? 'bg-brand-purple border-brand-purple text-white shadow-lg shadow-brand-purple/20' : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/20'}`}>
                    <div className="flex items-center gap-2">{cat} {selectedInterests.includes(cat) && <Check size={12} />}</div>
                  </button>
                ))}
              </div>
              <button onClick={handleSaveInterests} disabled={selectedInterests.length === 0} className="w-full bg-gradient-to-r from-brand-purple to-brand-pink py-5 rounded-[24px] font-black tracking-tight disabled:opacity-50 active:scale-95 transition-all shadow-xl shadow-brand-purple/20 text-white">Let's Get Started</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isZoomed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsZoomed(false)} className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6">
            <button className="absolute top-10 right-10 p-3 bg-white/10 rounded-full text-white"><X size={28} /></button>
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="relative w-full max-w-sm aspect-square rounded-[50px] overflow-hidden border border-white/10" onClick={(e) => e.stopPropagation()}>
              <img src={profile?.avatar_url} className="w-full h-full object-cover" alt="Zoomed Profile" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}