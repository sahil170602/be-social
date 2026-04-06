import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { 
  ArrowLeft, Calendar as CalIcon, Clock, MapPin, 
  ChevronDown, Check, Briefcase, X, Info 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { App as CapApp } from '@capacitor/app';

type TimeState = { h: string; m: string; p: string };

export default function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pro, setPro] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // --- 1. Draft System: Initialize From Storage ---
  const [date, setDate] = useState(() => localStorage.getItem(`draft_date_${id}`) || '');
  const [startTime, setStartTime] = useState<TimeState>(() => {
    const saved = localStorage.getItem(`draft_start_obj_${id}`);
    return saved ? JSON.parse(saved) : { h: '09', m: '00', p: 'Am' };
  });
  const [endTime, setEndTime] = useState<TimeState>(() => {
    const saved = localStorage.getItem(`draft_end_obj_${id}`);
    return saved ? JSON.parse(saved) : { h: '10', m: '00', p: 'Am' };
  });
  const [place, setPlace] = useState(() => localStorage.getItem(`draft_place_${id}`) || 'Physical meeting'); 
  const [selectedServices, setSelectedServices] = useState<string[]>(() => {
    const saved = localStorage.getItem(`draft_services_${id}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [totalPrice, setTotalPrice] = useState(0);
  const [showWholeDayPopup, setShowWholeDayPopup] = useState(false);
  
  // Dropdown States
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);

  const locations = ['Online session', 'Physical meeting'];
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  // --- 2. Navigation & Back Button ---
  useEffect(() => {
    const backListener = CapApp.addListener('backButton', () => navigate(-1));
    return () => { backListener.then(l => l.remove()); };
  }, [navigate]);

  // --- 3. Persist Draft ---
  useEffect(() => {
    localStorage.setItem(`draft_date_${id}`, date);
    localStorage.setItem(`draft_start_obj_${id}`, JSON.stringify(startTime));
    localStorage.setItem(`draft_end_obj_${id}`, JSON.stringify(endTime));
    localStorage.setItem(`draft_place_${id}`, place);
    localStorage.setItem(`draft_services_${id}`, JSON.stringify(selectedServices));
  }, [date, startTime, endTime, place, selectedServices, id]);

  useEffect(() => {
    const fetchPro = async () => {
      const { data } = await supabase.from('pro_profiles').select('*').eq('id', id).single();
      if (data) setPro(data);
      setLoading(false);
    };
    fetchPro();
  }, [id]);

  // --- 4. Pricing & Cross-Day Logic ---
  useEffect(() => {
    const to24 = (t: TimeState) => {
      let h = parseInt(t.h);
      if (t.p === 'Pm' && h !== 12) h += 12;
      if (t.p === 'Am' && h === 12) h = 0;
      return h * 60 + parseInt(t.m);
    };

    const startTotal = to24(startTime);
    const endTotal = to24(endTime);

    if (endTotal < startTotal && endTotal !== 0) {
      setShowWholeDayPopup(true);
      setTotalPrice(0);
    } else if (pro?.price_per_hour) {
      const diff = endTotal - startTotal;
      if (diff > 0) {
        setTotalPrice(Math.round((diff / 60) * pro.price_per_hour));
      } else {
        setTotalPrice(0);
      }
    }
  }, [startTime, endTime, pro]);

  const handleBooking = () => {
    if (!date || selectedServices.length === 0 || totalPrice <= 0) return;
    navigate(`/checkout/${pro.id}`, {
      state: { 
        date, 
        startTime: `${startTime.h}:${startTime.m} ${startTime.p}`, 
        endTime: `${endTime.h}:${endTime.m} ${endTime.p}`, 
        place, services: selectedServices, totalPrice, basePrice: pro.price_per_hour 
      }
    });
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 pt-4 pb-4 font-sans selection:bg-brand-purple/20">
      
      {/* Header */}
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2.5 bg-white/5 rounded-2xl border border-white/10 active:scale-90 transition-all">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-black tracking-tight">Confirm <span className="text-primary-gradient">booking</span></h1>
      </header>

      <div className="space-y-6">
        {/* Pro Card */}
        <div className="flex items-center gap-4 p-4 bg-white/[0.03] rounded-[2rem] border border-white/5 shadow-xl">
          <img src={pro?.avatar_url || 'https://placehold.co/150/111/fff?text=Pro'} className="w-16 h-16 rounded-[1.2rem] object-cover border border-white/10" alt="" />
          <div>
            <h3 className="font-black text-[18px] leading-tight capitalize">{pro?.full_name}</h3>
            <p className="text-primary-gradient text-[14px] font-bold mt-1 capitalize">{pro?.profession}</p>
          </div>
        </div>

        {/* Date */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-zinc-600 ml-1 capitalize">Select date</label>
          <div className="relative">
            <CalIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-purple" size={18} />
            <input type="date" min={new Date().toISOString().split('T')[0]} value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-brand-purple/50 text-sm font-bold [color-scheme:dark]" />
          </div>
        </div>

        {/* Custom Time Pickers */}
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-600 ml-1 capitalize">Start time</label>
            <div className="flex gap-2">
              <TimeSelect value={startTime.h} options={hours} onChange={(v) => setStartTime({...startTime, h: v})} label="Hr" />
              <TimeSelect value={startTime.m} options={minutes} onChange={(v) => setStartTime({...startTime, m: v})} label="Min" />
              <PeriodToggle value={startTime.p} onChange={(v) => setStartTime({...startTime, p: v})} />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-600 ml-1 capitalize">End time</label>
            <div className="flex gap-2">
              <TimeSelect value={endTime.h} options={hours} onChange={(v) => setEndTime({...endTime, h: v})} label="Hr" />
              <TimeSelect value={endTime.m} options={minutes} onChange={(v) => setEndTime({...endTime, m: v})} label="Min" />
              <PeriodToggle value={endTime.p} onChange={(v) => setEndTime({...endTime, p: v})} />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="space-y-3 relative z-20">
          <label className="text-[10px] font-black text-zinc-600 ml-1 capitalize">Meeting place</label>
          <button type="button" onClick={() => { setIsLocationOpen(!isLocationOpen); setIsServicesOpen(false); }}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 flex items-center justify-between transition-all active:bg-white/[0.08]"
          >
            <div className="flex items-center gap-3"><MapPin size={18} className="text-brand-purple" /><span className="text-sm font-bold capitalize">{place}</span></div>
            <motion.div animate={{ rotate: isLocationOpen ? 180 : 0 }}><ChevronDown size={18} className="text-zinc-500" /></motion.div>
          </button>
          <AnimatePresence>
            {isLocationOpen && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 5 }} exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 bg-[#151515] border border-white/10 rounded-[2rem] p-2 shadow-2xl z-[30]"
              >
                {locations.map((loc) => (
                  <button key={loc} onClick={() => { setPlace(loc); setIsLocationOpen(false); }}
                    className={`w-full text-left px-5 py-4 rounded-2xl text-[11px] font-black capitalize transition-all ${place === loc ? 'bg-primary-gradient text-white shadow-lg shadow-brand-purple/20' : 'text-zinc-500 hover:bg-white/5'}`}
                  >
                    {loc}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Services */}
        <div className="space-y-3 relative z-10">
          <label className="text-[10px] font-black text-zinc-600 ml-1 capitalize">Select services</label>
          <button type="button" onClick={() => { setIsServicesOpen(!isServicesOpen); setIsLocationOpen(false); }}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 flex items-center justify-between active:bg-white/[0.08]"
          >
            <div className="flex items-center gap-3"><Briefcase size={18} className="text-brand-purple" /><span className="text-sm font-bold capitalize">{selectedServices.length === 0 ? 'Choose services...' : `${selectedServices.length} Selected`}</span></div>
            <motion.div animate={{ rotate: isServicesOpen ? 180 : 0 }}><ChevronDown size={18} className="text-zinc-500" /></motion.div>
          </button>
          <AnimatePresence>
            {isServicesOpen && pro?.services && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 5 }} exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 bg-[#151515] border border-white/10 rounded-[2rem] p-2 shadow-2xl z-[30] max-h-60 overflow-y-auto"
              >
                {pro.services.map((service: string) => (
                  <button key={service} onClick={() => setSelectedServices(prev => prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service])}
                    className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-[11px] font-black capitalize transition-all ${selectedServices.includes(service) ? 'bg-primary-gradient text-white' : 'text-zinc-500 hover:bg-white/5'}`}
                  >
                    <span>{service}</span>
                    {selectedServices.includes(service) && <Check size={14} />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Total */}
        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem] mt-8 shadow-inner">
            <div className="flex justify-between items-center">
                <span className="text-primary-gradient font-bold text-[18px] capitalize">Booking total</span>
                <span className="text-2xl font-black text-primary-gradient">₹{totalPrice}</span>
            </div>
            <p className="text-[12px] text-zinc-500 mt-1 font-medium capitalize">Calculation based on session duration.</p>
        </div>

        <button onClick={handleBooking} disabled={!date || selectedServices.length === 0 || totalPrice <= 0}
          className="w-full bg-primary-gradient py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-brand-purple/20 active:scale-95 transition-all text-white disabled:bg-zinc-800 disabled:opacity-40"
        >
          Continue to checkout
        </button>
      </div>

      {/* Popup: Whole Day */}
      <AnimatePresence>
        {showWholeDayPopup && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center px-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowWholeDayPopup(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#111] border border-white/10 p-8 rounded-[3rem] w-full max-w-sm relative z-10 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-brand-purple/20 text-brand-purple"><Info size={32} /></div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black capitalize">Next day booking</h3>
                <p className="text-zinc-500 text-[11px] font-bold leading-relaxed capitalize">It looks like your session goes into the next day. Whole day offer is coming soon!</p>
              </div>
              <button onClick={() => setShowWholeDayPopup(false)} className="w-full py-4 bg-white/5 rounded-2xl font-black text-[10px] text-zinc-500 capitalize">Close</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Sub-Components For Clock ---

function TimeSelect({ value, options, onChange, label }: { value: string; options: string[]; onChange: (v: string) => void; label: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="flex-1 relative" ref={ref}>
      <button onClick={() => setIsOpen(!isOpen)} className="w-full bg-white/5 border border-white/10 py-4 rounded-2xl text-sm font-bold text-center capitalize">
        {value} <span className="text-[9px] text-zinc-500 ml-1">{label}</span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-full mb-2 left-0 right-0 bg-[#151515] border border-white/10 rounded-2xl max-h-48 overflow-y-auto p-1 z-[100] hide-scrollbar"
          >
            {options.map(opt => (
              <button key={opt} onClick={() => { onChange(opt); setIsOpen(false); }}
                className={`w-full py-3 rounded-xl text-xs font-bold ${value === opt ? 'bg-primary-gradient text-white' : 'hover:bg-white/5'}`}
              >
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PeriodToggle({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 gap-1">
      {['Am', 'Pm'].map(p => (
        <button key={p} onClick={() => onChange(p)}
          className={`px-4 py-3 rounded-xl text-[10px] font-black transition-all ${value === p ? 'bg-primary-gradient text-white shadow-lg' : 'text-zinc-500'}`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}