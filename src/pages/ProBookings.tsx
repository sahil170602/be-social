import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User, MapPin, CheckCircle, Clock, CalendarCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProBookings() {
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    const fetchProBookings = async () => {
      const phone = localStorage.getItem('sb_user_phone');
      const { data: pro } = await supabase.from('pro_profiles').select('id').eq('phone', phone).single();

      if (pro) {
        const { data } = await supabase
          .from('meetings')
          .select(`*, user_profiles(full_name, avatar_url)`)
          .eq('pro_id', pro.id)
          .order('meeting_date', { ascending: true });
        if (data) setBookings(data);
      }
    };
    fetchProBookings();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 pt-14 font-sans">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic">Client <span className="text-brand-pink">Roster</span></h1>
          <p className="text-zinc-500 text-[10px] font-black tracking-[0.3em] uppercase">Incoming Appointments</p>
        </div>
        <CalendarCheck className="text-brand-pink" size={32} />
      </header>

      <div className="space-y-4">
        {bookings.map((b) => (
          <div key={b.id} className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 hover:border-brand-pink/20 transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-pink/10 flex items-center justify-center text-brand-pink font-black border border-brand-pink/20 uppercase">
                  {b.user_profiles.full_name[0]}
                </div>
                <div>
                  <h4 className="font-black text-sm uppercase tracking-tight">{b.user_profiles.full_name}</h4>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Booked at: {b.booking_time}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-brand-pink font-black text-sm leading-none">₹{b.total_price}</p>
                <p className="text-[8px] text-zinc-600 font-bold uppercase mt-1 italic">{b.payment_status}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {b.services_requested?.map((s: string, i: number) => (
                <span key={i} className="px-3 py-1 bg-white/5 rounded-lg text-[8px] font-black text-zinc-400 uppercase border border-white/5">{s}</span>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div className="p-3 bg-black/40 rounded-2xl flex items-center gap-3 border border-white/5">
                  <Clock size={16} className="text-brand-pink" />
                  <span className="text-[10px] font-bold text-zinc-300">{b.start_time} - {b.end_time}</span>
               </div>
               <div className="p-3 bg-black rounded-2xl flex items-center gap-3 border border-white/5">
                  <MapPin size={16} className="text-brand-pink" />
                  <span className="text-[10px] font-bold text-black truncate">{b.place}</span>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}