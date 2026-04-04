import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  ArrowLeft, CreditCard, ShieldCheck, CheckCircle, 
  Calendar, Clock, MapPin, MessageSquare, Home 
} from 'lucide-react';
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
    // Safety redirect if accessed without booking state
    if (!state) {
      navigate('/explore');
      return;
    }

    const fetchPro = async () => {
      const { data } = await supabase
        .from('pro_profiles')
        .select('*')
        .eq('id', proId)
        .single();
      setPro(data);
    };
    fetchPro();
  }, [proId, state, navigate]);

  const processPaymentAndBook = async () => {
    setIsProcessing(true);
    try {
      const userPhone = localStorage.getItem('sb_user_phone');
      if (!userPhone) throw new Error("User not logged in");

      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('phone', userPhone)
        .single();

      if (userError || !userData) throw new Error("User not found");

      // 1. Create the Meeting Entry
      const { data: newMeeting, error: meetingError } = await supabase
        .from('meetings')
        .insert({
          pro_id: proId,
          user_id: userData.id,
          meeting_date: state.date,
          start_time: state.startTime,
          end_time: state.endTime,
          place: state.place,
          services: state.services,
          total_price: totalAmount, 
          payment_status: 'paid',
          meeting_status: 'pending'
        })
        .select()
        .single();

      if (meetingError) throw meetingError;

      // 2. Initialize the Chat with a system message
      await supabase.from('messages').insert({
        meeting_id: newMeeting.id,
        sender_id: userData.id,
        sender_type: 'user',
        text: `📅 Booking Request sent for ${state.date}. Waiting for confirmation.`
      });
      
      setShowSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Payment processing failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 pt-14 antialiased relative overflow-hidden">
      
      {/* Background Ambient Glow */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-brand-purple/10 blur-[120px] pointer-events-none" />

      <header className="flex items-center gap-4 mb-8 relative z-10">
        <button 
          onClick={() => navigate(-1)} 
          className="p-3 bg-white/5 rounded-2xl border border-white/10 active:scale-90 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-black tracking-tighter">
          SECURE <span className="text-primary-gradient">CHECKOUT</span>
        </h1>
      </header>

      <div className="max-w-md mx-auto space-y-6 relative z-10">
        
        {/* Booking Summary Card */}
        <div className="glass rounded-[2.5rem] p-6 shadow-2xl border-white/5">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Review Session</p>
          
          <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-5">
            <img 
              src={pro?.avatar_url || 'https://via.placeholder.com/150'} 
              className="w-14 h-14 rounded-2xl object-cover border border-white/10 shadow-lg" 
              alt="" 
            />
            <div>
              <h4 className="font-bold text-lg leading-tight">{pro?.full_name}</h4>
              <p className="text-brand-pink text-xs font-bold uppercase tracking-wider">
                {pro?.profession}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-zinc-300">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                <Calendar size={14} className="text-brand-purple" />
              </div>
              <span className="text-sm font-medium">{state?.date}</span>
            </div>
            <div className="flex items-center gap-3 text-zinc-300">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                <Clock size={14} className="text-brand-purple" />
              </div>
              <span className="text-sm font-medium">{state?.startTime} — {state?.endTime}</span>
            </div>
            <div className="flex items-center gap-3 text-zinc-300">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                <MapPin size={14} className="text-brand-purple" />
              </div>
              <span className="text-sm font-medium truncate">{state?.place}</span>
            </div>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-4">Payment Method</p>
          <div className="p-5 bg-brand-purple/5 border border-brand-purple/20 rounded-3xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-purple/10 rounded-2xl flex items-center justify-center text-brand-purple border border-brand-purple/10">
                <CreditCard size={24} />
              </div>
              <div>
                <p className="text-sm font-bold">Instant Wallet / UPI</p>
                <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-tight">Encrypted & Secure</p>
              </div>
            </div>
            <div className="w-6 h-6 rounded-full border-2 border-brand-purple flex items-center justify-center">
              <div className="w-3 h-3 bg-brand-purple rounded-full shadow-[0_0_12px_rgba(168,85,247,0.6)]" />
            </div>
          </div>
        </div>

        {/* Pricing Detail */}
        <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] space-y-4 shadow-inner">
          <div className="flex justify-between text-zinc-400 text-sm font-medium">
            <span>Consultation Fee</span>
            <span className="text-white">₹{subtotal}</span>
          </div>
          <div className="flex justify-between text-zinc-400 text-sm font-medium">
            <span>Service Fee (5%)</span>
            <span className="text-white">₹{serviceFee}</span>
          </div>
          <div className="h-px bg-white/5 w-full my-4" />
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold">Total Amount</span>
            <span className="text-3xl font-black text-primary-gradient tracking-tighter">₹{totalAmount}</span>
          </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={processPaymentAndBook}
          disabled={isProcessing}
          className="w-full bg-primary-gradient py-6 rounded-3xl font-bold text-sm uppercase tracking-[0.2em] shadow-2xl shadow-brand-purple/20 active:scale-95 transition-all flex items-center justify-center gap-3 text-white disabled:opacity-40"
        >
          {isProcessing ? (
            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>Pay & Confirm Booking <ShieldCheck size={20} /></>
          )}
        </button>
      </div>

      {/* Success Modal Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="fixed inset-0 z-[300] bg-[#0a0a0a]/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 50, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-sm"
            >
              <div className="w-24 h-24 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                <CheckCircle className="text-emerald-500" size={48} />
              </div>
              
              <h2 className="text-4xl font-black mb-3 tracking-tighter text-white uppercase">Confirmed!</h2>
              <p className="text-zinc-500 font-medium text-sm mb-12">
                Your appointment has been registered. You can now chat with your pro.
              </p>

              <div className="space-y-4">
                <button 
                  onClick={() => navigate('/messages')} 
                  className="w-full bg-primary-gradient py-5 rounded-3xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
                >
                  <MessageSquare size={20} /> Open Chat
                </button>

                <button 
                  onClick={() => navigate('/home')}
                  className="w-full bg-white/5 border border-white/10 py-5 rounded-3xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all text-zinc-400 hover:text-white"
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