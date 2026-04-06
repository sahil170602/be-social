import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  User, Bell, Star, Check, X, ArrowRight, WifiOff 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
  'Ui/ux designer', 'Full stack developer', 'Event planner', 
  'Photographer', 'Digital marketer', 'Devops engineer', 
  'Illustrator', 'Fitness coach', 'Content strategist', 'Video editor'
];

export default function Home() {
  const [profile, setProfile] = useState<any>(null);
  const [pros, setPros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
   
useEffect(() => {
  const fetchUnread = async () => {
    const userPhone = localStorage.getItem('sb_user_phone');
    const { data: user } = await supabase.from('user_profiles').select('id').eq('phone', userPhone).single();
    if (user) {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      setUnreadCount(count || 0);
    }
  };
  fetchUnread();
}, []);

  useEffect(() => {
    const fetchData = async () => {
      const userPhone = localStorage.getItem('sb_user_phone');
      if (!userPhone) { setLoading(false); return; }

      const { data: userData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('phone', userPhone)
        .maybeSingle();

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
<<<<<<< HEAD
    <div className="h-screen bg-[#0a0a0a] text-white font-sans flex flex-col overflow-hidden">
      
      {/* FIXED HEADER */}
      <nav className="shrink-0 z-[100] bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 px-6 pb-4 pt-4">
=======
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-brand-purple/30 pb-20">
      {/* ADDED pt-14 and pb-4 HERE to push the header down below the Android status bar */}
      <nav className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 px-6 pb-4 pt-4">
>>>>>>> 156638f6e2bff6d51419cdd9fa8935ec56842993
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <h1 className="font-extrabold text-[28px] bg-gradient-to-r from-brand-purple to-brand-pink bg-clip-text text-transparent tracking-tighter">
            Be social
          </h1>
          <div className="flex items-center gap-4">
            <button 
  onClick={() => navigate('/notifications')}
  className="relative p-2 hover:bg-white/5 rounded-full transition-colors"
>
  <Bell size={24} className="text-zinc-400" />
  {unreadCount > 0 && (
    <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-brand-pink rounded-full border-2 border-[#0a0a0a]"></span>
  )}
</button>
            <div 
              onClick={() => navigate('/profile-edit')}
              className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-purple to-brand-pink p-[1.5px] cursor-pointer active:scale-90 transition-transform shadow-lg"
            >
              <div className="w-full h-full rounded-[0.9rem] bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Profile" />
                ) : (
                  <User size={20} className="text-zinc-500" />
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* SCROLLABLE BODY */}
      <main className="flex-1 overflow-y-auto p-6 space-y-8 pb-24 hide-scrollbar">
        <section>
          <h2 className="text-4xl font-black tracking-tighter">
            Hey, {profile?.full_name?.split(' ')[0] || 'Social'}!
          </h2>
        </section>

        {/* --- RECOMMENDED --- */}
        <AnimatePresence>
          {recommendedPros.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <h3 className="text-[14px] font-black text-zinc-500 tracking-[0em] px-1">
                Recommended for you
              </h3>
              
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
                {recommendedPros.map((pro) => (
                  <motion.div 
                    layout 
                    key={pro.id} 
                    className="min-w-[280px] cursor-pointer active:scale-95 transition-transform"
                    onClick={() => navigate(`/pro/${pro.id}`)}
                  >
                    <GlassCard className="p-2 border-white/5 h-full flex flex-col gap-3 relative rounded-[2rem]">
                      <div className="flex gap-4 items-center">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 shrink-0">
                          <img src={pro.avatar_url || 'https://placehold.co/150/111/fff?text=Pro'} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-[16px] leading-tight truncate">{pro.full_name}</h4>
                          <p className="text-brand-pink text-[10px] font-bold mt-0.5">{pro.profession}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star size={10} className="text-yellow-500 fill-yellow-500" />
                            <span className="text-[11px] font-black">{pro.rating}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-zinc-400 text-[14px] line-clamp-2 leading-relaxed px-1">
                        {pro.bio}
                      </p>

                      <div className="flex justify-between items-center mt-auto pt-3 border-t border-white/5">
                        <div className="flex flex-col">
                          <span className="text-[18px] font-black text-brand-purple leading-none">
                            ₹{pro.price_per_hour} <span className="text-[12px] text-zinc-600 font-bold mt-0.5 tracking-tight">/hr</span>
                          </span>
                          
                        </div>
                        <div className="bg-brand-purple/10 text-brand-purple p-2 rounded-xl border border-brand-purple/10">
                          <ArrowRight size={18} />
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
        <section className="space-y-4">
          <h3 className="text-[14px] font-black text-zinc-500 tracking-[0em] px-1">
            All experts
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {otherPros.length > 0 ? (
              otherPros.map((pro) => (
                <motion.div 
                  layout 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  key={pro.id}
                  className="cursor-pointer active:scale-[0.98] transition-transform"
                  onClick={() => navigate(`/pro/${pro.id}`)}
                >
                  <GlassCard className="p-3 border-white/5 flex gap-4 items-center hover:bg-white/[0.04] transition-colors rounded-[1.8rem]">
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/10 shrink-0">
                      <img src={pro.avatar_url || 'https://placehold.co/150/111/fff?text=Pro'} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-black text-sm truncate tracking-tight">{pro.full_name}</h4>
                          <p className="text-brand-purple text-[10px] font-bold">{pro.profession}</p>
                        </div>
                        <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg">
                          <Star size={10} className="text-yellow-500 fill-yellow-500" />
                          <span className="text-[10px] font-bold">{pro.rating}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-zinc-400 font-bold text-[11px]">₹{pro.price_per_hour}/hr</span>
                        <span className="text-brand-pink text-[10px] font-black tracking-tight">View profile</span>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))
            ) : (
              <div className="p-12 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                <WifiOff className="mx-auto text-zinc-700 mb-4" size={32} />
                <p className="text-zinc-600 font-bold text-[10px] tracking-widest">No experts are live right now</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* POPUP: INTERESTS */}
      <AnimatePresence>
        {showPopup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-end sm:items-center justify-center p-4">
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="w-full max-w-lg bg-[#111] border border-white/10 rounded-[3rem] p-8 shadow-2xl">
              <h2 className="text-3xl font-black tracking-tighter mb-2">What are you looking for?</h2>
              <div className="flex flex-wrap gap-3 mb-10 mt-4">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => toggleInterest(cat)} 
                    className={`px-4 py-2.5 rounded-2xl text-[11px] font-black transition-all border ${
                      selectedInterests.includes(cat) 
                        ? 'bg-brand-purple border-brand-purple text-white shadow-lg shadow-brand-purple/20' 
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">{cat} {selectedInterests.includes(cat) && <Check size={12} />}</div>
                  </button>
                ))}
              </div>
              <button onClick={handleSaveInterests} disabled={selectedInterests.length === 0} 
                className="w-full bg-gradient-to-r from-brand-purple to-brand-pink py-5 rounded-[1.5rem] font-black tracking-tight disabled:opacity-50 active:scale-95 transition-all shadow-xl shadow-brand-purple/20 text-white"
              >
                Let's get started
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
