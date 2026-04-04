import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ArrowLeft, CreditCard, ShieldCheck, CheckCircle, Calendar, Clock, MapPin, MessageSquare, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CheckoutPage() {
  const { state } = useLocation();
  const { proId } = useParams();
  const navigate = useNavigate();
  
  const [pro, setPro] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const subtotal = state?.price || 0;
  const serviceFee = Math.round(subtotal * 0.05);
  const totalAmount = subtotal + serviceFee;

  useEffect(() => {
    if (!state) navigate('/explore');
    const fetchPro = async () => {
      const { data } = await supabase.from('pro_profiles').select('*').eq('id', proId).single();
      setPro(data);
    };
    fetchPro();
  }, [proId, state, navigate]);

  const processPaymentAndBook = async () => {
    setIsProcessing(true);
    try {
      const userPhone = localStorage.getItem('sb_user_phone');
      const { data: userData } = await supabase.from('user_profiles').select('id').eq('phone', userPhone).single();

      // Insert meeting and get the ID back
      const { data: newMeeting, error } = await supabase.from('meetings').insert({
        pro_id: proId,
        user_id: userData.id,
        meeting_date: state.date,
        start_time: state.startTime,
        end_time: state.endTime,
        place: state.place,
        services: state.services, // <--- ADDED THIS LINE TO SAVE THE SERVICES!
        total_price: totalAmount, 
        payment_status: 'paid',
        meeting_status: 'pending'
      }).select().single();

      if (error) throw error;

      // Automatically insert the first message
      await supabase.from('messages').insert({
        meeting_id: newMeeting.id,
        sender_id: userData.id,
        sender_type: 'user',
        text: 'Booking sent, waiting for accept...'
      });
      
      setShowSuccess(true);
    } catch (err) {
      alert("Payment Failed. Try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white p-6 pt-14 antialiased">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2.5 bg-white/5 rounded-2xl border border-white/10 active:scale-90 transition-all">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-black uppercase tracking-tighter">
          Secure <span className="text-primary-gradient">Checkout</span>
        </h1>
      </header>

      <div className="space-y-6">
        <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 shadow-xl">
          <p className="text-[14px] font-black text-zinc-500  tracking-[0.2em] mb-4">Review</p>
          <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-5">
            <img src={pro?.avatar_url} className="w-14 h-14 rounded-2xl object-cover border border-white/10" alt="" />
            <div>
              <h4 className="font-black text-base leading-tight">{pro?.full_name}</h4>
              <p className="text-primary-gradient text-[14px] font-black  tracking-wide">
                {pro?.profession}
              </p>
            </div>
          </div>

          <div className="space-y-3.5">
            <div className="flex items-center gap-3 text-zinc-400">
              <Calendar size={16} className="text-secondary" />
              <span className="text-[14px] font-black  tracking-tight">{state?.date}</span>
            </div>
            <div className="flex items-center gap-3 text-zinc-400">
              <Clock size={16} className="text-secondary" />
              <span className="text-[14px] font-black  tracking-tight">{state?.startTime} - {state?.endTime}</span>
            </div>
            <div className="flex items-center gap-3 text-zinc-400">
              <MapPin size={16} className="text-secondary" />
              <span className="text-[14px] font-black  tracking-tight">{state?.place}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Payment Method</p>
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <CreditCard size={20} />
              </div>
              <span className="text-xs font-black uppercase tracking-tight">Instant Wallet / UPI</span>
            </div>
            <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-primary rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
            </div>
          </div>
        </div>

        <div className="p-7 bg-black/40 border border-white/5 rounded-[2.5rem] space-y-4">
          <div className="flex justify-between text-zinc-500 text-[12px] font-black  tracking-wide">
            <span>Consultation Fee</span>
            <span>₹{subtotal}</span>
          </div>
          <div className="flex justify-between text-zinc-500 text-[12px] font-black tracking-wide">
            <span>Service Fee (5%)</span>
            <span>₹{serviceFee}</span>
          </div>
          <div className="h-px bg-white/5 w-full my-2" />
          <div className="flex justify-between items-center">
            <span className="text-md font-black   tracking-wide">Payable Amount</span>
            <span className="text-2xl font-black text-primary-gradient  tracking-tighter">₹{totalAmount}</span>
          </div>
        </div>

        <button 
          onClick={processPaymentAndBook}
          disabled={isProcessing}
          className="w-full bg-primary-gradient py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.15em] shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-3 text-white disabled:opacity-40"
        >
          {isProcessing ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>Pay & Confirm <ShieldCheck size={20} /></>
          )}
        </button>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="fixed inset-0 z-[300] bg-background flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 50, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1 }}
              className="w-full max-w-md"
            >
              <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.1)]">
                <CheckCircle className="text-emerald-500" size={48} />
              </div>
              
              <h2 className="text-4xl font-black mb-2  tracking-tighter text-white">BOOKED!</h2>
              <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-12">
                Appointment Registered Successfully
              </p>

              <div className="space-y-4">
                <button 
                  onClick={() => navigate('/messages')} 
                  className="w-full bg-primary-gradient py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-primary/20 active:scale-95 transition-all"
                >
                  <MessageSquare size={20} /> Start Chat
                </button>

                <button 
                  onClick={() => navigate('/home')}
                  className="w-full bg-white/5 border border-white/10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  <Home size={20} /> Back to Home
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}