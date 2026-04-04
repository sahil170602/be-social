import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { 
  ArrowLeft, Star, ShieldCheck, Clock, 
  MapPin, MessageSquare, Calendar, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pro, setPro] = useState<any>(null);
  const [suggestedPros, setSuggestedPros] = useState<any[]>([]);
  const [recentPros, setRecentPros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Scroll to top whenever the ID changes (for when users click a suggested/recent pro)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const fetchProDetailsAndLists = async () => {
      setLoading(true);
      
      // 1. Fetch Current Pro
      const { data: proData, error } = await supabase
        .from('pro_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (proData) {
        setPro(proData);

        // 2. Fetch Suggested Pros (Up to 10, prioritizing same profession)
        const { data: sameProfession } = await supabase
          .from('pro_profiles')
          .select('*')
          .eq('profession', proData.profession)
          .neq('id', proData.id) // Exclude current pro
          .limit(10);

        let suggested = sameProfession || [];

        // If we have less than 10 of the same profession, fill the rest with others
        if (suggested.length < 10) {
          const limitNeeded = 10 - suggested.length;
          const { data: otherProfession } = await supabase
            .from('pro_profiles')
            .select('*')
            .neq('profession', proData.profession)
            .neq('id', proData.id)
            .limit(limitNeeded);
          
          if (otherProfession) {
            suggested = [...suggested, ...otherProfession];
          }
        }
        setSuggestedPros(suggested);

        // 3. Update and Fetch Recently Viewed Pros (from localStorage)
        const storedHistory = localStorage.getItem('recentlyViewedPros');
        let viewedPros: any[] = storedHistory ? JSON.parse(storedHistory) : [];
        
        // Filter out the current pro so we don't show the one we are currently looking at
        let historyToShow = viewedPros.filter((p: any) => p.id !== proData.id);
        
        // Set the UI state (Only shows pros actually visited, ordered newest to oldest, max 10)
        setRecentPros(historyToShow.slice(0, 10));

        // Create a lightweight object to save to local storage (saves memory)
        const proToSave = {
          id: proData.id,
          full_name: proData.full_name,
          avatar_url: proData.avatar_url,
          profession: proData.profession,
          rating: proData.rating,
          price_per_hour: proData.price_per_hour
        };

        // Add the current pro to the VERY FRONT of the list, and keep only the first 10
        const updatedHistory = [proToSave, ...historyToShow].slice(0, 10);
        localStorage.setItem('recentlyViewedPros', JSON.stringify(updatedHistory));
      }
      
      setLoading(false);
    };

    fetchProDetailsAndLists();
  }, [id]);

  if (loading) return <div className="h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full animate-spin"></div></div>;

  // Helper component for the horizontal scroll cards
  const ProCard = ({ p }: { p: any }) => (
    <div 
      onClick={() => navigate(`/pro/${p.id}`)}
      className="min-w-[200px] w-[200px] snap-center bg-white/[0.02] border border-white/5 rounded-[1.5rem] p-4 cursor-pointer active:scale-95 transition-transform flex flex-col"
    >
      <div className="flex items-center gap-3 mb-3">
        <img src={p.avatar_url || 'https://via.placeholder.com/150'} className="w-12 h-12 rounded-xl object-cover border border-white/10" alt={p.full_name} />
        <div className="flex-1 overflow-hidden">
          <h4 className="font-black text-sm text-white truncate">{p.full_name}</h4>
          <p className="text-[9px] text-brand-purple font-bold uppercase tracking-widest truncate">{p.profession}</p>
        </div>
      </div>
      
      <div className="mt-auto flex justify-between items-center pt-3 border-t border-white/5">
        <span className="text-xs font-black text-white flex items-center gap-1">
          <Star size={12} className="text-yellow-500" fill="currentColor"/> 
          {p.rating || 'New'}
        </span>
        <span className="text-xs font-black text-zinc-400">₹{p.price_per_hour}<span className="text-[9px]">/hr</span></span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-12 font-sans selection:bg-brand-purple/30 overflow-x-hidden">
      {/* Header Image Section */}
      <div className="relative h-[45vh] w-full">
        <img src={pro?.avatar_url} className="w-full h-full object-cover" alt={pro?.full_name} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
        
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-14 left-6 p-3 bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 text-white active:scale-90 transition-transform"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      {/* Profile Info */}
      <main className="px-6 -mt-12 relative z-10">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tighter">{pro?.full_name}</h1>
            <p className="text-brand-purple font-bold text-md tracking-wide mt-1">{pro?.profession}</p>
            <div className="flex items-center gap-1.5 text-yellow-500 mt-2">
                <Star size={16} fill="currentColor" />
                <span className="text-md font-black text-white">{pro?.rating || 'New'}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-white leading-none tracking-tighter">₹{pro?.price_per_hour}</p>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Per hour</p>
          </div>
        </div>

        {/* Action Tabs */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button className="flex items-center justify-center gap-2 py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-transform">
            <MessageSquare size={18} className="text-brand-pink" /> Chat
          </button>
          <button 
            onClick={() => navigate(`/book/${pro.id}`)}
            className="flex items-center justify-center gap-2 py-4 bg-primary-gradient text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-purple/20 active:scale-95 transition-transform"
          >
            <Calendar size={18} /> Book Now
          </button>
        </div>

        {/* Bio Section */}
        <section className="mb-8">
          <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" /> About Expert
          </h3>
          <p className="text-zinc-400 text-sm leading-relaxed font-medium">
            "{pro?.bio || 'No bio available for this expert.'}"
          </p>
        </section>

        {/* Services Section */}
        {pro?.services && pro.services.length > 0 && (
          <section className="mb-8">
            <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" /> Services Offered
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {pro.services.map((service: string, index: number) => (
                <div 
                  key={index} 
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-zinc-300 tracking-wide"
                >
                  {service}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Trust Badges */}
        <section className="grid grid-cols-2 gap-3 mb-10">
          <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-[1.5rem] flex items-center gap-3">
            <ShieldCheck className="text-emerald-500" size={20} />
            <span className="text-[10px] font-black uppercase text-emerald-500/70 tracking-widest">Verified Pro</span>
          </div>
          <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-[1.5rem] flex items-center gap-3">
            <Clock className="text-blue-500" size={20} />
            <span className="text-[10px] font-black uppercase text-blue-500/70 tracking-widest">Fast Response</span>
          </div>
        </section>

        {/* --- Suggested Pros Section --- */}
        {suggestedPros.length > 0 && (
          <section className="mb-10">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-sm font-black tracking-tight">Suggested Experts</h3>
             </div>
             {/* Horizontal Scroll Container */}
             <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {suggestedPros.map(p => <ProCard key={p.id} p={p} />)}
             </div>
          </section>
        )}

        {/* --- Recently Viewed Pros Section --- */}
        {recentPros.length > 0 && (
          <section className="mb-6">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-sm font-black tracking-tight">Recently Viewed</h3>
             </div>
             {/* Horizontal Scroll Container */}
             <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {recentPros.map(p => <ProCard key={p.id} p={p} />)}
             </div>
          </section>
        )}

      </main>
    </div>
  );
}