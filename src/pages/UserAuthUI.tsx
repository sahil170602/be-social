import { useState } from 'react';
import { Mail, User, Calendar, Users, Camera, Phone, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import { supabase } from '../lib/supabaseClient';

export default function UserAuthUI({ accentColor, accentBg, shadowGlow }: any) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [phone, setPhone] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    gender: 'Male'
  });
  const [image, setImage] = useState<File | null>(null);

  // STEP 1: Handle Login/Check User
  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const cleanPhone = phone.trim();

      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .eq('phone', cleanPhone) 
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // CRITICAL: Save phone so ProtectedRoute allows entry
        localStorage.setItem('sb_user_phone', cleanPhone); 
        navigate('/home');
      } else {
        setStep(2);
      }
    } catch (err: any) {
      console.error("Auth Error:", err.message);
      alert("Error checking account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Upload Image & Create Profile
  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let avatarUrl = "";
      const cleanPhone = phone.trim();

      // 1. Upload Image to Storage Bucket
      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, image);

        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        avatarUrl = urlData.publicUrl;
      }

      // 2. Insert User Data
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert([{ 
          phone: cleanPhone,
          full_name: formData.name,
          email: formData.email,
          age: parseInt(formData.age),
          gender: formData.gender,
          avatar_url: avatarUrl
        }]);

      if (insertError) throw insertError;

      // 3. Save to LocalStorage and Redirect
      localStorage.setItem('sb_user_phone', cleanPhone);
      navigate('/home');

    } catch (err: any) {
      console.error("Profile Error:", err.message);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="z-10 w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black tracking-wide mb-2 ">
          {step === 1 ? 'Get Started' : 'Final Touch'}
        </h1>
        <p className="text-zinc-500 text-sm tracking-wide">
          {step === 1 ? 'Enter your mobile to continue' : 'Complete your profile'}
        </p>
      </div>

      <GlassCard className={`border-white/5 p-8 ${shadowGlow} transition-all duration-500`}>
        {step === 1 ? (
          <form onSubmit={handleStep1} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Mobile Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="+91 79725 00000" 
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-brand-purple/50 text-sm text-white" 
                />
              </div>
            </div>
            <button disabled={loading} className={`w-full ${accentBg} py-4 rounded-2xl font-black flex items-center justify-center gap-2 text-white shadow-lg`}>
              {loading ? 'Checking...' : 'Continue'} <ArrowRight size={18} />
            </button>
            
            <div className="flex items-center gap-4 my-4 opacity-30">
                <div className="h-[1px] flex-1 bg-white" />
                <span className="text-[10px] font-bold uppercase text-white">Or</span>
                <div className="h-[1px] flex-1 bg-white" />
            </div>

            <div className="grid grid-cols-3 gap-3">
               <button type="button" className="bg-white/5 p-3 rounded-xl flex justify-center hover:bg-white/10 transition-all"><img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" /></button>
               <button type="button" className="bg-white/5 p-3 rounded-xl flex justify-center hover:bg-white/10 transition-all"><img src="https://www.svgrepo.com/show/475633/apple-color.svg" className="w-5 h-5" alt="Apple" /></button>
               <button type="button" className="bg-white/5 p-3 rounded-xl flex justify-center hover:bg-white/10 transition-all"><img src="https://www.svgrepo.com/show/475647/facebook-color.svg" className="w-5 h-5" alt="Facebook" /></button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCompleteProfile} className="space-y-4">
            {/* Profile Upload */}
            <div className="flex flex-col items-center mb-6">
                <label className="relative cursor-pointer group">
                    <div className="w-24 h-24 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden group-hover:border-brand-purple transition-all">
                        {image ? <img src={URL.createObjectURL(image)} className="w-full h-full object-cover" alt="Preview" /> : <Camera className="text-zinc-600" />}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setImage(e.target.files?.[0] || null)} />
                    <div className="absolute bottom-0 right-0 bg-brand-purple p-1.5 rounded-full border-2 border-[#0a0a0a]">
                        <CheckCircle2 size={12} className="text-white" />
                    </div>
                </label>
                <span className="text-[9px] font-bold text-zinc-500 uppercase mt-2 tracking-widest">Upload Photo</span>
            </div>

            <div className="space-y-3">
                <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                    <input required type="text" placeholder="Full Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-white/30" />
                </div>
                <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                    <input required type="email" placeholder="Email Address" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-white/30" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                        <input required type="number" placeholder="Age" value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-white/30" />
                    </div>
                    <div className="relative">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                        <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm appearance-none text-white outline-none">
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>
            </div>

            <button type="submit" disabled={loading} className={`w-full ${accentBg} py-4 rounded-2xl font-black tracking-wide mt-4 text-white shadow-xl hover:brightness-110 active:scale-[0.98] transition-all`}>
                {loading ? 'Creating Account...' : 'Complete Profile'}
            </button>
          </form>
        )}
      </GlassCard>
    </div>
  );
}