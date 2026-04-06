import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Calendar, Clock, MapPin, CreditCard, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UserMeetings() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserMeetings = async () => {
      const phone = localStorage.getItem('sb_user_phone');
      const { data: user } = await supabase.from('user_profiles').select('id').eq('phone', phone).single();

      if (user) {
        const { data } = await supabase
          .from('meetings')
          .select(`*, pro_profiles(full_name, avatar_url, profession)`)
          .eq('user_id', user.id)
          .order('meeting_date', { ascending: true });
        if (data) setMeetings(data);
      }
      setLoading(false);
    };
    fetchUserMeetings();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 pt-4 pb-24">
      <header className="mb-8">
        <h1 className="text-3xl font-black tracking-tighter">MY <span className="text-primary-gradient">SESSIONS</span></h1>
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Manage your bookings</p>
      </header>

      <div className="space-y-4">
        {meetings.map((m) => (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={m.id} 
            className="bg-white/[0.03] border border-white/5 rounded-[2rem] p-5 relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-3">
                <img src={m.pro_profiles.avatar_url} className="w-12 h-12 rounded-2xl object-cover border border-white/10" />
                <div>
                  <h3 className="font-black text-sm">{m.pro_profiles.full_name}</h3>
                  <p className="text-brand-purple text-[10px] font-bold uppercase">{m.pro_profiles.profession}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${m.payment_status === 'paid' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
                {m.payment_status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-black/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-zinc-400">
                <Calendar size={14} className="text-brand-purple" />
                <span className="text-[10px] font-bold uppercase">{m.meeting_date}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <Clock size={14} className="text-brand-purple" />
                <span className="text-[10px] font-bold uppercase">{m.start_time} - {m.end_time}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <MapPin size={14} className="text-brand-purple" />
                <span className="text-[10px] font-bold uppercase truncate">{m.place}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <CreditCard size={14} className="text-brand-purple" />
                <span className="text-[10px] font-bold uppercase">₹{m.total_price}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}