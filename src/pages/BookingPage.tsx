import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { ArrowLeft, Calendar as CalIcon, Clock, MapPin, CheckCircle, ChevronDown, Check, Briefcase, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pro, setPro] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [place, setPlace] = useState('Physical Meeting'); 
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  
  // Dropdown States
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);

  const locations = ['Online Session', 'Physical Meeting'];

  useEffect(() => {
    const fetchPro = async () => {
      const { data } = await supabase.from('pro_profiles').select('*').eq('id', id).single();
      if (data) setPro(data);
    };
    fetchPro();
  }, [id]);

  const handleBooking = () => {
    if (!date || !startTime || !endTime || selectedServices.length === 0) return;
    
    navigate(`/checkout/${pro.id}`, {
      state: {
        date,
        startTime,
        endTime,
        place,
        services: selectedServices,
        price: pro.price_per_hour
      }
    });
  };

  const toggleService = (service: string) => {
    setSelectedServices(prev => 
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    );
    setIsServicesOpen(false); // Auto close dropdown on selection (optional)
  };

  const removeService = (serviceToRemove: string) => {
    setSelectedServices(prev => prev.filter(s => s !== serviceToRemove));
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-background text-white p-6 pt-14 pb-10 antialiased">
      {/* Header */}
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2.5 bg-white/5 rounded-2xl border border-white/10 active:scale-90 transition-all">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-black  tracking-tighter">
          Confirm <span className="text-primary-gradient">Booking</span>
        </h1>
      </header>

      <div className="space-y-6">
        {/* Pro Quick Info */}
        <div className="flex items-center gap-4 p-4 bg-white/[0.03] rounded-[2rem] border border-white/5">
          <img src={pro?.avatar_url} className="w-16 h-16 rounded-[1.2rem] object-cover border border-white/10" alt="" />
          <div>
            <h3 className="font-black text-[18px] leading-tight">{pro?.full_name}</h3>
            <p className="text-primary-gradient text-[14px] font-black tracking-wide mt-1 uppercase">
              {pro?.profession}
            </p>
          </div>
        </div>

        {/* Date Selection */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">Select Date</label>
          <div className="relative">
            <CalIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
            <input 
              type="date" 
              min={today}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-primary/50 text-sm font-bold text-white transition-all [color-scheme:dark]" 
            />
          </div>
        </div>

        {/* Time Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">Start Time</label>
            <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={16} />
                <input 
                type="time" 
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-11 pr-4 outline-none focus:border-primary/50 text-sm font-bold text-white [color-scheme:dark]" 
                />
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">End Time</label>
            <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={16} />
                <input 
                type="time" 
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-11 pr-4 outline-none focus:border-primary/50 text-sm font-bold text-white [color-scheme:dark]" 
                />
            </div>
          </div>
        </div>

        {/* Location Selection */}
        <div className="space-y-3 relative z-20">
          <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">Meeting Place</label>
          <button 
            type="button"
            onClick={() => { setIsLocationOpen(!isLocationOpen); setIsServicesOpen(false); }}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 flex items-center justify-between outline-none focus:border-primary/50 transition-all active:bg-white/[0.08]"
          >
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-primary" />
              <span className="text-sm font-bold text-white">{place}</span>
            </div>
            <motion.div animate={{ rotate: isLocationOpen ? 180 : 0 }}>
               <ChevronDown size={18} className="text-zinc-500" />
            </motion.div>
          </button>

          <AnimatePresence>
            {isLocationOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 5 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 bg-[#151515] backdrop-blur-xl border border-white/10 rounded-[2rem] p-2 shadow-2xl overflow-hidden"
              >
                {locations.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => {
                      setPlace(loc);
                      setIsLocationOpen(false);
                    }}
                    className={`w-full text-left px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                      place === loc ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-zinc-500 hover:bg-white/5'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Services Selection */}
        <div className="space-y-3 relative z-10">
          <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">Select Services</label>
          <button 
            type="button"
            onClick={() => { setIsServicesOpen(!isServicesOpen); setIsLocationOpen(false); }}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 flex items-center justify-between outline-none focus:border-primary/50 transition-all active:bg-white/[0.08]"
          >
            <div className="flex items-center gap-3">
              <Briefcase size={18} className="text-primary" />
              <span className="text-sm font-bold text-white">
                {selectedServices.length === 0 ? 'Choose Services...' : `${selectedServices.length} Selected`}
              </span>
            </div>
            <motion.div animate={{ rotate: isServicesOpen ? 180 : 0 }}>
               <ChevronDown size={18} className="text-zinc-500" />
            </motion.div>
          </button>

          <AnimatePresence>
            {isServicesOpen && pro?.services && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 5 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 bg-[#151515] backdrop-blur-xl border border-white/10 rounded-[2rem] p-2 shadow-2xl overflow-hidden"
              >
                {pro.services.map((service: string) => {
                  const isSelected = selectedServices.includes(service);
                  return (
                    <button
                      key={service}
                      onClick={() => toggleService(service)}
                      className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                        isSelected ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-zinc-500 hover:bg-white/5'
                      }`}
                    >
                      <span>{service}</span>
                      {isSelected && <Check size={14} />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Selected Services Tags */}
          <div className="flex flex-wrap gap-2 pt-2">
            <AnimatePresence>
              {selectedServices.map(service => (
                <motion.div
                  key={service}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-xl"
                >
                  <span className="text-[10px] font-black text-white  tracking-wide">{service}</span>
                  <button 
                    onClick={() => removeService(service)}
                    className="p-1 hover:bg-primary/20 rounded-full transition-colors"
                  >
                    <X size={12} className="text-primary" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Summary Card */}
        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem] mt-8">
            <div className="flex justify-between items-center">
                <span className="text-primary-gradient font-bold text-[18px]  tracking-wide">Booking Total</span>
                <span className="text-2xl font-black text-primary-gradient  tracking-tighter">₹{pro?.price_per_hour}</span>
            </div>
            <p className="text-[12px] text-zinc-300 mt-2 font-medium ">*Review details on next page.</p>
        </div>

        {/* Confirm Button */}
        <button 
          onClick={handleBooking}
          disabled={!date || !startTime || !endTime || selectedServices.length === 0 || loading}
          className="w-full bg-primary-gradient py-5 rounded-[2rem] font-black text-lg tracking-wide shadow-xl shadow-primary/20 active:scale-95 transition-all text-white disabled:bg-zinc-800 disabled:opacity-40 disabled:grayscale disabled:shadow-none"
        >
          {loading ? "Processing..." : "Continue to Checkout"}
        </button>
      </div>
    </div>
  );
}