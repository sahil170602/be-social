import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { motion } from 'framer-motion';
import { ArrowLeft, Wallet, TrendingUp, History, CheckCircle2 } from 'lucide-react';
import { App as CapApp } from '@capacitor/app';

export default function ProWallet() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleBack = () => navigate(-1);
    const capListener = CapApp.addListener('backButton', handleBack);
    window.addEventListener('popstate', handleBack);
    return () => { capListener.then(l => l.remove()); window.removeEventListener('popstate', handleBack); };
  }, [navigate]);

  useEffect(() => {
    const fetchWalletData = async () => {
      const phone = localStorage.getItem('sb_user_phone');
      const { data: pro } = await supabase.from('pro_profiles').select('id').eq('phone', phone).single();

      if (pro) {
        const { data: meetings } = await supabase
          .from('meetings')
          .select('total_price, meeting_status, meeting_date, user_profiles(full_name)')
          .eq('pro_id', pro.id)
          .eq('meeting_status', 'completed')
          .order('meeting_date', { ascending: false });

        if (meetings) {
          const total = meetings.reduce((acc, curr) => acc + (curr.total_price || 0), 0);
          setBalance(total);
          setTransactions(meetings);
        }
      }
      setLoading(false);
    };
    fetchWalletData();
  }, []);

  if (loading) return <div className="h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="h-screen bg-[#0a0a0a] text-white font-sans flex flex-col overflow-hidden">
      <nav className="shrink-0 z-[100] bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 px-6 pb-4 pt-14 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-xl border border-white/5 active:scale-90 transition-all">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-black tracking-tight">Pro <span className="text-primary-gradient">wallet</span></h1>
      </nav>

      <main className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar pb-10">
        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-brand-purple to-brand-pink shadow-xl relative overflow-hidden">
          <TrendingUp size={100} className="absolute -right-4 -bottom-4 text-white/10" />
          <p className="text-xs font-bold text-white/70 tracking-tight">Total earnings</p>
          <div className="text-5xl font-black text-white mt-1 tracking-tighter">₹{balance}</div>
          <button className="mt-6 w-full py-4 bg-black/20 backdrop-blur-md rounded-2xl text-xs font-black text-white border border-white/10 active:scale-95 transition-all">
            Withdraw to bank
          </button>
        </div>

        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <History size={16} className="text-zinc-500" />
            <h3 className="text-[10px] font-black text-zinc-500 tracking-[0.2em] uppercase">Income history</h3>
          </div>

          <div className="space-y-3">
            {transactions.length > 0 ? (
              transactions.map((t, i) => (
                <div key={i} className="p-5 bg-white/[0.02] border border-white/5 rounded-[1.8rem] flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black capitalize">{t.user_profiles?.full_name || 'Client'}</h4>
                      <p className="text-[10px] text-zinc-500 font-bold">{t.meeting_date}</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-emerald-400">+₹{t.total_price}</span>
                </div>
              ))
            ) : (
              <div className="p-10 text-center border border-dashed border-white/10 rounded-[2rem]">
                <p className="text-zinc-600 text-xs font-bold">No completed transactions yet</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}