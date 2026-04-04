import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Star, DollarSign, Settings, AlertCircle, LogIn,
  CheckCircle2, CalendarClock, TrendingUp, Zap, 
  Share2, Wallet, MessageSquare, Bell, LogOut, Check, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient'; 

export default function ProDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [statsData, setStatsData] = useState({ totalEarnings: 0, completedCount: 0, upcomingCount: 0, profileCompletion: 85 });
  const [pendingBookings, setPendingBookings] = useState<any[]>([]); 
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; type: 'auth' | 'db' | null }>({ message: '', type: null });

  // 1. Android Back-Button Handling
  useEffect(() => {
    window.history.pushState(null, '', window.location.pathname);
    const handleBackButton = (e: PopStateEvent) => {
      window.history.pushState(null, '', window.location.pathname);
    };
    window.addEventListener('popstate', handleBackButton);
    return () => window.removeEventListener('popstate', handleBackButton);
  }, []);

  // 2. Data Fetching & Realtime Subscription
  useEffect(() => {
    let meetingsChannel: any;

    // Helper function to fetch just the meetings/stats so we can reuse it on realtime updates
    async function fetchMeetingsData(proId: string) {
      // Fetch Stats
      const { data: meetings, error: mError } = await supabase
        .from('meetings')
        .select('meeting_status, total_price')
        .eq('pro_id', proId);

      if (!mError && meetings) {
        const stats = meetings.reduce((acc, curr) => {
          if (curr.meeting_status === 'completed') {
            acc.totalEarnings += (curr.total_price || 0);
            acc.completedCount += 1;
          } else if (curr.meeting_status === 'scheduled') {
            acc.upcomingCount += 1;
          }
          return acc;
        }, { totalEarnings: 0, completedCount: 0, upcomingCount: 0, profileCompletion: 92 });
        setStatsData(stats);
      }

      // Fetch Pending Bookings (ADDED 'services' TO SELECT QUERY)
      const { data: pendingData } = await supabase
        .from('meetings')
        .select(`
          id,
          meeting_date,
          start_time,
          end_time,
          meeting_status,
          services,
          user_profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('pro_id', proId)
        .eq('meeting_status', 'pending');

      if (pendingData) setPendingBookings(pendingData);
    }

    async function fetchFullDashboard() {
      setLoading(true);
      try {
        const savedPhone = localStorage.getItem('sb_user_phone');
        if (!savedPhone) throw { message: "No login session found.", type: 'auth' };

        const { data: profileData, error: profileError } = await supabase
          .from('pro_profiles')
          .select('*')
          .eq('phone', savedPhone)
          .single();

        if (profileError) throw { message: profileError.message, type: 'db' };
        
        setProfile(profileData);
        setIsOnline(profileData.is_online);

        // Fetch initial meetings data
        await fetchMeetingsData(profileData.id);

        // REALTIME FIX: Make the channel name completely unique to avoid React Strict Mode collisions
        meetingsChannel = supabase
          .channel(`pro-meetings-${profileData.id}-${Date.now()}`) 
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'meetings', filter: `pro_id=eq.${profileData.id}` },
            (payload) => {
              console.log("🔔 REALTIME UPDATE TRIGGERED:", payload);
              fetchMeetingsData(profileData.id);
            }
          )
          .subscribe((status, err) => {
            console.log("Supabase Realtime Status:", status); 
            if (err) console.error("🔴 REALTIME ERROR DETAILS:", err);
          });

      } catch (err: any) {
        setError({ message: err.message || "Error", type: err.type || 'db' });
      } finally {
        setLoading(false);
      }
    }
    
    fetchFullDashboard();

    // Cleanup subscription on unmount
    return () => {
      if (meetingsChannel) supabase.removeChannel(meetingsChannel);
    };
  }, []);

  // 3. Real-Time Status Toggle
  const toggleOnlineStatus = async () => {
    if (!profile || !profile.id) return;
    const newStatus = !isOnline;
    setIsOnline(newStatus); 
    try {
      const { error } = await supabase
        .from('pro_profiles')
        .update({ is_online: newStatus })
        .eq('id', profile.id);
      if (error) throw error;
    } catch (err) {
      console.error("Failed to update status:", err);
      setIsOnline(!newStatus); 
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

  // Handle Accept/Reject Booking
  const handleBookingAction = async (bookingId: string, action: 'scheduled' | 'cancelled') => {
    // 1. Find booking details for the greeting before removing from UI
    const booking = pendingBookings.find(b => b.id === bookingId);
    
    // 2. Optimistically remove it from the UI
    setPendingBookings(prev => prev.filter(b => b.id !== bookingId));

    // 3. Update the database meeting status
    await supabase
      .from('meetings')
      .update({ meeting_status: action })
      .eq('id', bookingId);
      
    // 4. If Accepted or Rejected, update stats AND send auto-greeting!
    if (action === 'scheduled' && booking) {
      setStatsData(prev => ({ ...prev, upcomingCount: prev.upcomingCount + 1 }));
      
      const userName = booking.user_profiles?.full_name?.split(' ')[0] || 'there';
      
      await supabase.from('messages').insert({
        meeting_id: bookingId,
        sender_id: profile.id, // The Pro's ID
        sender_type: 'pro',
        text: `Hi ${userName}! Thank you for giving me the opportunity. I have accepted your booking and look forward to our session together!`
      });
    } else if (action === 'cancelled' && booking) {
      await supabase.from('messages').insert({
        meeting_id: bookingId,
        sender_id: profile.id,
        sender_type: 'pro',
        text: 'Automated Message: Booking has been rejected.'
      });
    }
  };

  if (error.type) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-8 text-white text-center">
        <div className="p-10 bg-white/[0.02] border border-white/10 rounded-[2.5rem] max-w-md">
          <AlertCircle className="text-brand-pink mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-black mb-2 uppercase italic text-brand-pink tracking-tighter">BE SOCIAL</h2>
          <p className="text-zinc-500 mb-8 leading-relaxed">{error.message}</p>
          <button onClick={() => navigate('/')} className="w-full py-4 bg-brand-pink text-white rounded-2xl font-bold">Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 pt-14 pb-12 font-sans selection:bg-brand-pink/30">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        
        {/* --- TOP BAR --- */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-extrabold text-[30px] bg-gradient-to-r from-[#8a2be2] to-[#ff1493] bg-clip-text text-transparent tracking-tighter">Be Social</h1>
            <p className="text-zinc-400 text-[12px] font-bold tracking-wide mt-0 flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
              {profile?.full_name || 'Professional'}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleOnlineStatus}
              disabled={loading || !profile}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 flex items-center p-1 ${loading ? 'opacity-50' : 'cursor-pointer'} ${isOnline ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-zinc-800 border border-zinc-700'}`}
            >
              <motion.div 
                animate={{ x: isOnline ? 24 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={`h-4 w-4 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-zinc-500'}`}
              />
            </button>

            <button 
              onClick={handleLogout} 
              className="h-10 w-10 rounded-xl bg-red-500/5 border border-red-500/10 flex items-center justify-center text-red-500/70 hover:text-red-500 hover:bg-red-500/10 transition-all"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* --- MAIN BALANCE CARD --- */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          <div className="rounded-[2.5rem] bg-gradient-to-br from-[#ff1493] to-[#8a2be2] p-8 shadow-xl shadow-brand-pink/20 relative overflow-hidden group">
             <TrendingUp size={120} className="absolute -right-4 -bottom-4 text-white/10 group-hover:scale-110 transition-transform duration-500" />
             <p className="text-xs font-bold text-white/70 uppercase tracking-widest italic">Available Balance</p>
             <div className="text-5xl font-black text-white mt-1 leading-none tracking-tighter">${statsData.totalEarnings}</div>
             <button className="mt-6 px-6 py-2 bg-black/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase text-white border border-white/10 active:scale-95 transition-transform">
               Withdraw Funds
             </button>
          </div>
        </div>

        {/* --- ACTIVITY GRID --- */}
        <div className="grid grid-cols-2 gap-4 mb-8">
           <div className="bg-white/[0.03] border border-white/5 rounded-[2rem] p-6">
              <div className="w-10 h-10 bg-blue-400/10 rounded-xl flex items-center justify-center mb-4">
                <CheckCircle2 className="text-blue-400" size={20} />
              </div>
              <div className="text-2xl font-black leading-none">{statsData.completedCount}</div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2">Completed</p>
           </div>
           <div className="bg-white/[0.03] border border-white/5 rounded-[2rem] p-6">
              <div className="w-10 h-10 bg-[#ff1493]/10 rounded-xl flex items-center justify-center mb-4">
                <CalendarClock className="text-[#ff1493]" size={20} />
              </div>
              <div className="text-2xl font-black leading-none">{statsData.upcomingCount}</div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2">Upcoming</p>
           </div>
        </div>

        {/* --- QUICK NAVIGATION --- */}
        <div className="mb-8">
          <h3 className="text-[12px] font-black text-zinc-100 uppercase tracking-widest mb-4 ml-2">Services & Tools</h3>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Chats', icon: MessageSquare, path: '/pro-messages', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'group-hover:border-blue-400/50' },
              { label: 'Bookings', icon: CalendarClock, path: '/pro-bookings', color: 'text-[#ff1493]', bg: 'bg-[#ff1493]/10', border: 'group-hover:border-[#ff1493]/50' },
              { label: 'Wallet', icon: Wallet, path: '/wallet', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'group-hover:border-emerald-400/50' },
              { label: 'Edit', icon: Settings, path: '/profile-edit', color: 'text-[#8a2be2]', bg: 'bg-[#8a2be2]/10', border: 'group-hover:border-[#8a2be2]/50' }
            ].map((item, i) => (
              <button 
                key={i} 
                onClick={() => navigate(item.path)} 
                className="flex flex-col items-center gap-2 group"
              >
                <div className={`h-14 w-14 rounded-2xl ${item.bg} border border-white/5 flex items-center justify-center ${item.color} ${item.border} transition-all duration-300 group-active:scale-90`}>
                  <item.icon size={22} />
                </div>
                <span className={`text-[11px] font-bold uppercase transition-colors text-zinc-400 group-hover:${item.color}`}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* --- NEW BOOKINGS SECTION --- */}
        <div className="mb-8 overflow-hidden">
          <h3 className="text-[12px] font-black text-brand-pink uppercase tracking-widest mb-4 ml-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-brand-pink animate-pulse" /> 
            New Bookings
          </h3>
          
          <div className="space-y-4">
            {pendingBookings.length > 0 ? (
              <AnimatePresence>
                {pendingBookings.map((booking) => (
                  <motion.div 
                    key={booking.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="p-5 bg-white/[0.02] border border-white/5 rounded-[2rem] flex flex-col gap-4"
                  >
                    {/* User Info & Time */}
                    <div className="flex items-center gap-4">
                      <img 
                        src={booking.user_profiles?.avatar_url || 'https://via.placeholder.com/150'} 
                        className="w-14 h-14 rounded-[1rem] object-cover border border-white/10" 
                        alt="User" 
                      />
                      <div className="flex-1">
                        <h4 className="font-black text-lg text-white leading-tight">
                          {booking.user_profiles?.full_name || 'Client'}
                        </h4>
                        <p className="text-xs text-zinc-400 font-medium mt-1 flex items-center gap-1.5">
                          <CalendarClock size={12} className="text-brand-purple" />
                          {booking.meeting_date} • {booking.start_time} - {booking.end_time}
                        </p>
                        {/* --- ADDED SERVICES TAGS --- */}
                        {booking.services && booking.services.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {booking.services.map((service: string, idx: number) => (
                              <span key={idx} className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-bold text-zinc-300 uppercase tracking-widest">
                                {service}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleBookingAction(booking.id, 'scheduled')}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500/10 text-emerald-400 rounded-2xl font-bold text-xs border border-emerald-500/20 active:scale-95 transition-all hover:bg-emerald-500/20"
                      >
                        <Check size={16} /> Accept
                      </button>
                      <button 
                        onClick={() => handleBookingAction(booking.id, 'cancelled')}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500/10 text-red-400 rounded-2xl font-bold text-xs border border-red-500/20 active:scale-95 transition-all hover:bg-red-500/20"
                      >
                        <X size={16} /> Reject
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              // SHOW THIS IF NO BOOKINGS
              <div className="p-8 text-center border border-dashed border-white/10 rounded-[2rem] bg-white/[0.01]">
                <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">No pending bookings right now</p>
              </div>
            )}
          </div>
        </div>

      </motion.div>
    </div>
  );
}