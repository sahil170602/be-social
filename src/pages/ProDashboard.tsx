import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, CalendarClock, TrendingUp, 
  Wallet, MessageSquare, Settings, LogOut, Check, X, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient'; 
import { App as CapApp } from '@capacitor/app';

export default function ProDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [statsData, setStatsData] = useState({ completedCount: 0, upcomingCount: 0 });
  const [pendingBookings, setPendingBookings] = useState<any[]>([]); 
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; type: 'auth' | 'db' | null }>({ message: '', type: null });

  // --- 1. BACK NAVIGATION: EXIT APP ON DASHBOARD ---
  useEffect(() => {
    const handleBack = () => {
      // Standard behavior for a main hub page: Exit the app
      CapApp.exitApp();
    };

    // Hardware back button listener (Android)
    const capListener = CapApp.addListener('backButton', handleBack);
    
    // Browser back button trap (Windows/Web)
    window.history.pushState(null, '', window.location.pathname);
    window.addEventListener('popstate', handleBack);

    return () => {
      capListener.then(l => l.remove());
      window.removeEventListener('popstate', handleBack);
    };
  }, []);

  // --- 2. DATA FETCHING & REALTIME SYNC ---
  useEffect(() => {
    let walletChannel: any;
    let meetingsChannel: any;

    async function fetchProData() {
      setLoading(true);
      try {
        const phone = localStorage.getItem('sb_user_phone');
        if (!phone) throw { message: "No login session found.", type: 'auth' };

        // A. Fetch Profile
        const { data: pro, error: proError } = await supabase
          .from('pro_profiles')
          .select('*')
          .eq('phone', phone)
          .single();

        if (proError) throw proError;
        setProfile(pro);
        setIsOnline(pro.is_online);

        // B. Fetch Wallet Balance from new pro_wallets table
        const { data: wallet } = await supabase
          .from('pro_wallets')
          .select('balance')
          .eq('pro_id', pro.id)
          .maybeSingle();
        
        if (wallet) setWalletBalance(wallet.balance);

        // C. Fetch Stats (Completed vs Upcoming)
        const { data: meetings } = await supabase
          .from('meetings')
          .select('meeting_status')
          .eq('pro_id', pro.id);

        if (meetings) {
          setStatsData({
            completedCount: meetings.filter(m => m.meeting_status === 'completed').length,
            upcomingCount: meetings.filter(m => 
              m.meeting_status === 'scheduled' || 
              m.meeting_status === 'confirmed' || 
              m.meeting_status === 'started'
            ).length
          });
        }

        // D. Fetch Pending Bookings
        const { data: pending } = await supabase
          .from('meetings')
          .select(`
            id,
            meeting_date,
            start_time,
            end_time,
            services,
            user_profiles (
              full_name,
              avatar_url
            )
          `)
          .eq('pro_id', pro.id)
          .eq('meeting_status', 'pending');

        if (pending) setPendingBookings(pending);

        // --- REALTIME: WALLET UPDATES ---
        walletChannel = supabase
          .channel(`wallet-updates-${pro.id}`)
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'pro_wallets', filter: `pro_id=eq.${pro.id}` },
            (payload) => setWalletBalance(payload.new.balance)
          )
          .subscribe();

        // --- REALTIME: MEETINGS UPDATES ---
        meetingsChannel = supabase
          .channel(`meetings-sync-${pro.id}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'meetings', filter: `pro_id=eq.${pro.id}` },
            () => {
              // Re-fetch stats and pending list on any change
              fetchProData();
            }
          )
          .subscribe();

      } catch (err: any) {
        setError({ message: err.message || "Error connecting to database", type: 'db' });
      } finally {
        setLoading(false);
      }
    }

    fetchProData();

    return () => {
      if (walletChannel) supabase.removeChannel(walletChannel);
      if (meetingsChannel) supabase.removeChannel(meetingsChannel);
    };
  }, []);

  // --- 3. ACTIONS ---
  const toggleOnlineStatus = async () => {
    if (!profile?.id) return;
    const nextStatus = !isOnline;
    setIsOnline(nextStatus);
    try {
      await supabase.from('pro_profiles').update({ is_online: nextStatus }).eq('id', profile.id);
    } catch (err) {
      setIsOnline(!nextStatus);
    }
  };

  const handleLogout = async () => {
    if (profile?.id) {
      await supabase.from('pro_profiles').update({ is_online: false }).eq('id', profile.id);
    }
    await supabase.auth.signOut();
    localStorage.removeItem('sb_user_phone');
    navigate('/', { replace: true });
  };

  const handleBookingAction = async (bookingId: string, action: 'scheduled' | 'cancelled') => {
    // Optimistic UI update
    setPendingBookings(prev => prev.filter(b => b.id !== bookingId));

    const { error } = await supabase
      .from('meetings')
      .update({ meeting_status: action })
      .eq('id', bookingId);

    if (!error && action === 'scheduled') {
      const proName = profile?.full_name?.split(' ')[0] || 'Professional';
      await supabase.from('messages').insert({
        meeting_id: bookingId,
        sender_id: profile.id,
        sender_type: 'pro',
        text: `Hi! I have accepted your booking. I am looking forward to our meeting!`
      });
    }
  };

  if (error.type) {
    return (
      <div className="h-screen bg-[#0a0a0a] flex items-center justify-center p-8 text-center">
        <div className="p-10 bg-white/[0.02] border border-white/10 rounded-[2.5rem] max-w-sm">
          <AlertCircle className="text-brand-pink mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-black mb-2 text-brand-pink tracking-tight">Be social</h2>
          <p className="text-zinc-500 mb-8 text-sm leading-relaxed">{error.message}</p>
          <button onClick={() => navigate('/')} className="w-full py-4 bg-brand-pink text-white rounded-2xl font-bold">Go to login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0a0a0a] text-white font-sans flex flex-col overflow-hidden selection:bg-brand-pink/30">
      
      {/* --- FIXED HEADER --- */}
      <header className="shrink-0 z-[100] bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 px-6 pb-4 pt-4 flex justify-between items-center">
        <div>
          <h1 className="font-extrabold text-[28px] bg-gradient-to-r from-brand-purple to-brand-pink bg-clip-text text-transparent tracking-tighter">Be social</h1>
          <p className="text-zinc-400 text-[14px] font-bold tracking-tight flex items-center gap-2 mt-0.5">
            <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
            {profile?.full_name || 'Professional'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleOnlineStatus} 
            className={`relative w-11 h-6 rounded-full transition-colors flex items-center p-1 ${isOnline ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-zinc-800 border border-zinc-700'}`}
          >
            <motion.div animate={{ x: isOnline ? 20 : 0 }} className={`h-4 w-4 rounded-full ${isOnline ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-zinc-500'}`} />
          </button>
          <button onClick={handleLogout} className="h-9 w-9 rounded-xl bg-red-500/5 border border-red-500/10 flex items-center justify-center text-red-500/70 active:scale-90 transition-transform">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* --- SCROLLABLE BODY --- */}
      <main className="flex-1 overflow-y-auto p-6 space-y-8 hide-scrollbar pb-4">
        
        {/* Available Balance Card */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="rounded-[2.2rem] bg-gradient-to-br from-brand-pink to-brand-purple p-8 shadow-xl shadow-brand-pink/10 relative overflow-hidden group">
             <TrendingUp size={110} className="absolute -right-4 -bottom-4 text-white/10" />
             <p className="text-xs font-bold text-white/70 tracking-tight">Lifetime Earning</p>
             <div className="text-5xl font-black text-white mt-1 leading-none tracking-tighter">₹{walletBalance}</div>
             
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white/[0.03] border border-white/5 rounded-[1.8rem] p-6">
              <div className="w-10 h-10 bg-blue-400/10 rounded-xl flex items-center justify-center mb-4 text-blue-400">
                <CheckCircle2 size={20} />
              </div>
              <div className="text-2xl font-black leading-none">{statsData.completedCount}</div>
              <p className="text-[10px] font-bold text-zinc-500 mt-2">Completed</p>
           </div>
           <div className="bg-white/[0.03] border border-white/5 rounded-[1.8rem] p-6">
              <div className="w-10 h-10 bg-brand-pink/10 rounded-xl flex items-center justify-center mb-4 text-brand-pink">
                <CalendarClock size={20} />
              </div>
              <div className="text-2xl font-black leading-none">{statsData.upcomingCount}</div>
              <p className="text-[10px] font-bold text-zinc-500 mt-2">Upcoming</p>
           </div>
        </div>

        {/* Services & Tools Section */}
        <section>
          <h3 className="text-[11px] font-black text-zinc-400 mb-4 ml-1 tracking-widest">Services & tools</h3>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Chats', icon: MessageSquare, path: '/pro-messages', color: 'text-blue-400', bg: 'bg-blue-400/10' },
              { label: 'Bookings', icon: CalendarClock, path: '/pro-bookings', color: 'text-brand-pink', bg: 'bg-brand-pink/10' },
              { label: 'Wallet', icon: Wallet, path: '/wallet', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
              { label: 'Edit', icon: Settings, path: '/pro-profile-edit', color: 'text-brand-purple', bg: 'bg-brand-purple/10' }
            ].map((item, i) => (
              <button 
                key={i} 
                onClick={() => navigate(item.path)} 
                className="flex flex-col items-center gap-2 group"
              >
                <div className={`h-14 w-14 rounded-2xl ${item.bg} border border-white/5 flex items-center justify-center ${item.color} transition-all active:scale-90`}>
                  <item.icon size={22} />
                </div>
                <span className={`text-[10px] font-bold transition-colors text-zinc-500 group-hover:${item.color} capitalize`}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Pending Bookings Section */}
        <section className="pb-10">
          <h3 className="text-[11px] font-black text-brand-pink mb-4 ml-1 flex items-center gap-2 tracking-widest">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-pink animate-pulse" /> 
            New bookings
          </h3>
          
          <div className="space-y-4">
            {pendingBookings.length > 0 ? (
              <AnimatePresence mode="popLayout">
                {pendingBookings.map((booking) => (
                  <motion.div 
                    key={booking.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: -20 }}
                    className="p-5 bg-white/[0.02] border border-white/5 rounded-[2rem] flex flex-col gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <img 
                        src={booking.user_profiles?.avatar_url || 'https://placehold.co/150/111/fff?text=User'} 
                        className="w-14 h-14 rounded-[1rem] object-cover border border-white/10" 
                        alt="Client" 
                      />
                      <div className="flex-1">
                        <h4 className="font-black text-base text-white leading-tight capitalize">
                          {booking.user_profiles?.full_name || 'Client'}
                        </h4>
                        <p className="text-[10px] text-zinc-500 font-bold mt-1 flex items-center gap-1.5">
                          <CalendarClock size={11} className="text-brand-purple" />
                          {booking.meeting_date} • {booking.start_time} - {booking.end_time}
                        </p>
                        {booking.services && (
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {booking.services.map((service: string, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black text-zinc-400 capitalize">
                                {service}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-3 mt-1">
                      <button 
                        onClick={() => handleBookingAction(booking.id, 'scheduled')}
                        className="flex-1 py-3 bg-emerald-500/10 text-emerald-400 rounded-xl font-black text-[11px] border border-emerald-500/20 active:scale-95 transition-all"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => handleBookingAction(booking.id, 'cancelled')}
                        className="flex-1 py-3 bg-red-500/10 text-red-400 rounded-xl font-black text-[11px] border border-red-500/20 active:scale-95 transition-all"
                      >
                        Reject
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <div className="p-8 text-center border border-dashed border-white/10 rounded-[2rem] bg-white/[0.01]">
                <p className="text-zinc-600 font-bold text-[10px] tracking-tight">No pending bookings right now</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}