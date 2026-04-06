import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Check, Loader2, Upload, Briefcase } from 'lucide-react';
import { App as CapApp } from '@capacitor/app';

export default function ProProfileEdit() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>({
    full_name: '', profession: '', bio: '', price_per_hour: '', services: '', avatar_url: ''
  });

  useEffect(() => {
    const handleBack = () => navigate(-1);
    const capListener = CapApp.addListener('backButton', handleBack);
    window.addEventListener('popstate', handleBack);
    return () => { capListener.then(l => l.remove()); window.removeEventListener('popstate', handleBack); };
  }, [navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      const phone = localStorage.getItem('sb_user_phone');
      const { data } = await supabase.from('pro_profiles').select('*').eq('phone', phone).single();
      if (data) {
        setProfile({
          ...data,
          services: Array.isArray(data.services) ? data.services.join(', ') : ''
        });
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;
      setSaving(true);
      const fileName = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setProfile((prev: any) => ({ ...prev, avatar_url: publicUrl }));
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    const servicesArray = profile.services.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '');
    const { error } = await supabase.from('pro_profiles').update({
      full_name: profile.full_name,
      profession: profile.profession,
      bio: profile.bio,
      price_per_hour: parseInt(profile.price_per_hour),
      services: servicesArray,
      avatar_url: profile.avatar_url
    }).eq('id', profile.id);

    if (!error) navigate(-1);
    setSaving(false);
  };

  if (loading) return <div className="h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="animate-spin text-brand-purple" /></div>;

  return (
    <div className="h-screen bg-[#0a0a0a] text-white font-sans flex flex-col overflow-hidden">
      <nav className="shrink-0 z-[100] bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 px-6 pb-4 pt-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-xl border border-white/5 active:scale-90 transition-all"><ArrowLeft size={20} /></button>
        <h1 className="text-2xl font-black tracking-tight">Edit <span className="text-primary-gradient">profile</span></h1>
      </nav>

      <main className="flex-1 overflow-y-auto p-6 space-y-8 hide-scrollbar pb-4">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-28 h-28 rounded-[2.5rem] overflow-hidden border-2 border-brand-purple/30 bg-white/5 shadow-2xl">
              <img src={profile.avatar_url || 'https://placehold.co/150/111/fff?text=Pro'} className="w-full h-full object-cover" alt="" />
            </div>
            <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 p-3 bg-brand-purple rounded-2xl shadow-lg active:scale-90 transition-transform"><Camera size={18} /></button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
          </div>
          <p className="text-[10px] font-black text-zinc-600 tracking-widest uppercase">Tap camera to change photo</p>
        </div>

        <div className="space-y-5">
          <InputField label="Full name" value={profile.full_name} onChange={(v) => setProfile({...profile, full_name: v})} />
          <InputField label="Profession title" value={profile.profession} onChange={(v) => setProfile({...profile, profession: v})} />
          <InputField label="Hourly rate (₹)" value={profile.price_per_hour} onChange={(v) => setProfile({...profile, price_per_hour: v})} />
          <div className="space-y-2">
            <label className="text-[9px] font-black text-zinc-600 ml-4 tracking-widest uppercase">About me</label>
            <textarea value={profile.bio} onChange={(e) => setProfile({...profile, bio: e.target.value})} 
              className="w-full bg-white/5 border border-white/10 rounded-[1.8rem] p-5 text-sm font-bold outline-none focus:border-brand-purple/50 min-h-[120px] resize-none"
            />
          </div>
          <InputField label="Services (Separate with commas)" value={profile.services} onChange={(v) => setProfile({...profile, services: v})} />
        </div>

        <button onClick={handleSave} disabled={saving} className="w-full py-5 bg-primary-gradient rounded-[1.8rem] font-black text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />} Save changes
        </button>
      </main>
    </div>
  );
}

function InputField({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-[9px] font-black text-zinc-600 ml-4 tracking-widest uppercase">{label}</label>
      <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
        <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent text-sm font-bold outline-none" />
      </div>
    </div>
  );
}