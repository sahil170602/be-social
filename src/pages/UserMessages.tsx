import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  ArrowLeft, Send, Clock, CheckCircle2, MapPin, X, 
  HelpCircle, Check, Navigation, Map as MapIcon, 
  Search, Coffee, Store, Utensils, Info, Navigation2
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// --- MAP IMPORTS ---
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet marker icons in Vite
const customMarker = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41]
});

// --- HELPERS ---
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Component to move map programmatically
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 17);
  }, [center, map]);
  return null;
}

// Component to handle map clicks
function MapEvents({ setMapCoords, setLocName }: { 
  setMapCoords: (coords: {lat: number, lng: number}) => void,
  setLocName: (name: string) => void 
}) {
  useMapEvents({
    click(e) {
      setMapCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
      setLocName("dropped pin location");
    },
  });
  return null;
}

export default function UserMessages() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const chatIdParam = searchParams.get('chat');

  const [userId, setUserId] = useState<string | null>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  // Location UI State
  const [showLocModal, setShowLocModal] = useState(false);
  const [locName, setLocName] = useState('');
  const [locUrl, setLocUrl] = useState('');
  const [isFetchingLoc, setIsFetchingLoc] = useState(false); 

  // MAP & SEARCH STATE
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);
  const [mapCoords, setMapCoords] = useState<{lat: number, lng: number} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- REAL-TIME SEARCH LOGIC ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length > 1) {
        performRealtimeSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const performRealtimeSearch = async (val: string) => {
    const biasLat = mapCoords?.lat || userLoc?.lat || 21.4624;
    const biasLng = mapCoords?.lng || userLoc?.lng || 80.2209;
    
    setIsSearching(true);
    try {
      const offset = 0.15;
      const bbox = `${biasLng - offset},${biasLat - offset},${biasLng + offset},${biasLat + offset}`;

      const response = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(val)}&lat=${biasLat}&lon=${biasLng}&bbox=${bbox}&limit=10`
      );
      const data = await response.json();

      const formatted = data.features.map((feat: any, index: number) => ({
        uniqueKey: `${feat.properties.osm_id || 'item'}-${index}`,
        name: feat.properties.name || feat.properties.street || "unnamed place",
        city: feat.properties.district || feat.properties.city || feat.properties.state || "",
        lat: feat.geometry.coordinates[1],
        lng: feat.geometry.coordinates[0],
        dist: getDistance(biasLat, biasLng, feat.geometry.coordinates[1], feat.geometry.coordinates[0])
      }))
      .sort((a: any, b: any) => a.dist - b.dist);

      setSearchResults(formatted);
    } catch (err) {
      console.error("search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (item: any) => {
    setMapCoords({ lat: item.lat, lng: item.lng });
    setLocName(item.name);
    setSearchResults([]);
    setSearchQuery(item.name);
  };

  // --- AUTH & CHAT LOGIC ---
  useEffect(() => {
    if (chatIdParam && chats.length > 0) {
      const chat = chats.find(c => c.id === chatIdParam);
      if (chat) setActiveChat(chat);
    } else { setActiveChat(null); }
  }, [chatIdParam, chats]);

  useEffect(() => {
    const fetchChats = async () => {
      const phone = localStorage.getItem('sb_user_phone');
      if (!phone) return navigate('/');
      const { data: user } = await supabase.from('user_profiles').select('id').eq('phone', phone).single();
      if (!user) return;
      setUserId(user.id);

      const { data: m } = await supabase.from('meetings').select(`*, pro_profiles(full_name, avatar_url)`).eq('user_id', user.id).order('created_at', { ascending: false });
      if (m) {
        const unique = [];
        const seen = new Set();
        for (const item of m) { if (!seen.has(item.pro_id)) { seen.add(item.pro_id); unique.push(item); } }
        setChats(unique);
      }

      supabase.channel(`user-meetings-${user.id}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'meetings', filter: `user_id=eq.${user.id}` }, 
        (payload) => {
          setChats(prev => prev.map(c => c.id === payload.new.id ? { ...c, ...payload.new } : c));
          setActiveChat((prev: any) => prev?.id === payload.new.id ? { ...prev, ...payload.new } : prev);
        }
      ).subscribe();
    };
    fetchChats();
  }, [navigate]);

  useEffect(() => {
    if (!activeChat) return;
    const fetchMessages = async () => {
      const { data } = await supabase.from('messages').select('*').eq('meeting_id', activeChat.id).order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();
    const msgChannel = supabase.channel(`msgs-${activeChat.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `meeting_id=eq.${activeChat.id}` }, 
      (payload) => setMessages(prev => [...prev, payload.new])
    ).subscribe();
    return () => { supabase.removeChannel(msgChannel); };
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChat?.location_status, activeChat?.user_reached]);

  // --- ACTIONS ---
  const openMapPicker = () => {
    setIsFetchingLoc(true);
    navigator.geolocation.getCurrentPosition((pos) => {
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setUserLoc(coords); setMapCoords(coords); setIsFetchingLoc(false); setShowMapPicker(true);
    }, () => { setIsFetchingLoc(false); setShowMapPicker(true); });
  };

  const confirmMapSelection = () => {
    if (!mapCoords) return;
    setLocUrl(`https://www.google.com/maps/search/?api=1&query=${mapCoords.lat},${mapCoords.lng}`);
    setShowMapPicker(false);
  };

  const proposeLocation = async () => {
    if (!locName || !locUrl) return;
    await supabase.from('meetings').update({ 
      location_name: locName, location_url: locUrl, location_status: 'proposed_by_user' 
    }).eq('id', activeChat.id);
    
    await supabase.from('messages').insert({ 
      meeting_id: activeChat.id, sender_id: userId!, sender_type: 'user', text: `📍 location proposed: ${locName}` 
    });
    setShowLocModal(false);
  };

  const handleReached = async () => {
    if (!activeChat) return;
    await supabase.from('meetings').update({ user_reached: true }).eq('id', activeChat.id);
    await supabase.from('messages').insert({
      meeting_id: activeChat.id, sender_id: userId!, sender_type: 'user', text: `✅ i have reached the location`
    });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId || !activeChat) return;
    const text = newMessage;
    setNewMessage(''); 
    await supabase.from('messages').insert({
      meeting_id: activeChat.id, sender_id: userId, sender_type: 'user', text: text
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans overflow-hidden">
      <header className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-[#0a0a0a] sticky top-0 z-50 pt-14">
        <div className="flex items-center gap-4">
          <button onClick={() => activeChat ? setSearchParams({}) : navigate(-1)} className="p-2 bg-white/5 rounded-xl"><ArrowLeft size={20} /></button>
          <h1 className="text-xl font-black">{activeChat ? activeChat.pro_profiles?.full_name : 'your inbox'}</h1>
        </div>
        {activeChat && activeChat.meeting_status === 'scheduled' && activeChat.chat_enabled && activeChat.location_status === 'not_set' && (
          <button onClick={() => { setShowLocModal(true); openMapPicker(); }} className="px-3 py-1.5 bg-brand-purple/20 border border-brand-purple/30 text-brand-purple rounded-xl text-xs font-bold flex items-center gap-2 animate-pulse">
            <MapPin size={14} /> decide location
          </button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto p-4 flex flex-col">
        {!activeChat ? (
          <div className="space-y-3">
            {chats.map(chat => (
              <div key={chat.id} onClick={() => setSearchParams({ chat: chat.id })} className="p-4 bg-white/[0.02] border border-white/5 rounded-3xl flex gap-4 cursor-pointer active:scale-95 transition-transform shadow-lg">
                <img src={chat.pro_profiles?.avatar_url} className="w-14 h-14 rounded-2xl object-cover border border-white/10" alt="" />
                <div className="flex-1 flex flex-col justify-center">
                   <h3 className="font-bold text-base leading-tight">{chat.pro_profiles?.full_name}</h3>
                   <p className="text-[10px] text-zinc-500 font-bold mt-1">{chat.meeting_status}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4 pb-32">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-3xl text-sm shadow-md ${msg.sender_type === 'user' ? 'bg-brand-purple text-white rounded-br-none' : 'bg-white/5 border border-white/5 text-white rounded-bl-none'}`}>{msg.text}</div>
              </div>
            ))}

            {/* --- LOCATION UI (DISABLES ONCE user_reached IS TRUE) --- */}
            {!activeChat.user_reached && (
              <>
                {activeChat.location_status === 'proposed_by_user' && (
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-brand-purple/10 p-5 rounded-[2rem] border border-brand-purple/20 text-white shadow-xl flex flex-col gap-3 mt-6 border-dashed">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-brand-purple/20 rounded-2xl flex items-center justify-center text-brand-purple">
                            <Clock size={20} className="animate-pulse"/>
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="text-[10px] font-black text-brand-purple">location proposed</p>
                            <p className="font-bold text-sm text-white truncate">{activeChat.location_name}</p>
                          </div>
                        </div>
                        <a href={activeChat.location_url} target="_blank" rel="noopener noreferrer" className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-center text-[11px] font-bold text-zinc-400">view on map</a>
                        <p className="text-[11px] text-zinc-500 italic text-center">waiting for professional to confirm...</p>
                    </motion.div>
                )}

                {activeChat.location_status === 'confirmed' && (
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-emerald-500/10 p-5 rounded-[2.5rem] border border-emerald-500/20 text-emerald-400 shadow-xl flex flex-col gap-3 mt-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] font-black flex items-center gap-2"><MapPin size={12}/> meeting point confirmed</p>
                            <p className="font-bold text-white text-sm mt-1">{activeChat.location_name}</p>
                          </div>
                          <div className="bg-emerald-500/20 p-2 rounded-full"><CheckCircle2 size={18} /></div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <a href={activeChat.location_url} target="_blank" rel="noopener noreferrer" className="w-full py-3 bg-emerald-500 text-white rounded-2xl text-center text-[11px] font-black shadow-lg active:scale-95 transition-all">get directions</a>
                          <button onClick={handleReached} className="w-full py-3 bg-white/5 border border-white/10 text-white rounded-2xl text-center text-[11px] font-black active:scale-95 transition-all">i've reached</button>
                        </div>
                    </motion.div>
                )}
              </>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {activeChat && (
        <div className="p-4 bg-[#0a0a0a]/80 backdrop-blur-md border-t border-white/5 fixed bottom-0 left-0 right-0 z-40 pb-8">
           {!activeChat.chat_enabled ? (
             <div className="grid grid-cols-2 gap-3">
               <button onClick={() => supabase.from('meetings').update({ chat_enabled: true }).eq('id', activeChat.id)} className="p-5 bg-brand-purple rounded-[1.5rem] font-black text-[12px] flex flex-col items-center gap-2">
                <HelpCircle size={22} /> ask a query
               </button>
               <button onClick={() => { setShowLocModal(true); openMapPicker(); }} className="p-5 bg-white/5 border border-white/10 rounded-[1.5rem] font-black text-[12px] flex flex-col items-center gap-2">
                <MapPin size={22} /> suggest location
               </button>
             </div>
           ) : (
             <form onSubmit={sendMessage} className="flex gap-2">
               <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="type message..." className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-brand-purple transition-all"/>
               <button type="submit" disabled={!newMessage.trim()} className="p-4 bg-brand-purple rounded-2xl disabled:opacity-30 shadow-lg shadow-brand-purple/20"><Send size={20} /></button>
             </form>
           )}
        </div>
      )}

      <AnimatePresence>
        {showMapPicker && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed inset-0 z-[600] bg-[#0a0a0a] flex flex-col">
            <div className="absolute top-14 left-4 right-4 z-[700] space-y-2">
               <div className="flex gap-2">
                  <button onClick={() => setShowMapPicker(false)} className="p-4 bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 text-white active:scale-90 transition-transform shadow-2xl"><ArrowLeft size={20} /></button>
                  <div className="flex-1 relative">
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="search nearby places..." className="w-full bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 pl-12 text-sm outline-none focus:border-brand-purple shadow-2xl"/>
                    <Search className="absolute left-4 top-4 text-zinc-500" size={20} />
                    {isSearching && <div className="absolute right-4 top-4 w-5 h-5 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />}
                  </div>
               </div>
               {searchResults.length > 0 && (
                 <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#111] border border-white/10 rounded-[2rem] max-h-[45vh] overflow-y-auto shadow-2xl overflow-hidden border-t-0">
                   {searchResults.map((item) => (
                     <button key={item.uniqueKey} onClick={() => selectSearchResult(item)} className="w-full p-5 border-b border-white/5 flex items-center gap-4 active:bg-white/5 text-left transition-colors">
                       <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-brand-purple flex-shrink-0 border border-white/5"><Coffee size={20}/></div>
                       <div className="flex-1 overflow-hidden">
                         <p className="font-bold text-sm truncate text-white leading-tight">{item.name}</p>
                         <p className="text-[10px] text-zinc-500 font-bold mt-1 flex items-center gap-1.5"><Navigation2 size={10} className="fill-brand-purple text-brand-purple"/> {item.dist.toFixed(2)} km • {item.city}</p>
                       </div>
                     </button>
                   ))}
                 </motion.div>
               )}
            </div>
            <div className="flex-1 relative z-0">
              <MapContainer center={[userLoc?.lat || 19.07, userLoc?.lng || 72.87]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                <TileLayer url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" maxZoom={20} attribution='© google maps' />
                <MapEvents setMapCoords={setMapCoords} setLocName={setLocName} />
                <MapController center={mapCoords ? [mapCoords.lat, mapCoords.lng] : [userLoc?.lat || 19.07, userLoc?.lng || 72.87]} />
                {mapCoords && <Marker position={[mapCoords.lat, mapCoords.lng]} icon={customMarker} />}
              </MapContainer>
            </div>
            {mapCoords && !searchResults.length && (
               <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="p-6 bg-[#111] border-t border-white/10 rounded-t-[2.5rem] pb-10 z-[800] shadow-[0_-20px_50px_rgba(0,0,0,0.8)]">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-brand-purple/10 rounded-[1.2rem] flex items-center justify-center text-brand-purple border border-brand-purple/20 shadow-inner"><MapPin size={24} /></div>
                    <div className="flex-1 overflow-hidden">
                       <h3 className="font-black text-xl leading-none text-white truncate">{locName || "point selected"}</h3>
                       <p className="text-[10px] text-zinc-500 font-bold mt-2 flex items-center gap-2"><span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse"/> ready to propose</p>
                    </div>
                  </div>
                  <button onClick={confirmMapSelection} className="w-full bg-brand-purple py-5 rounded-[1.5rem] font-bold text-base shadow-xl active:scale-95 transition-all">confirm & select</button>
               </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLocModal && !showMapPicker && (
          <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#111] border border-white/10 w-full rounded-[3rem] p-8 space-y-8 shadow-2xl">
              <div className="text-center space-y-2">
                 <div className="w-20 h-20 bg-brand-purple/10 rounded-[2rem] flex items-center justify-center text-brand-purple mx-auto border border-brand-purple/20 shadow-2xl"><MapPin size={40} /></div>
                 <h2 className="text-3xl font-black tracking-tighter">suggest place</h2>
                 <p className="text-zinc-500 text-sm font-bold">decide meeting point</p>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-bold text-zinc-600 ml-4 mb-2 block">meeting point name</label>
                  <input type="text" value={locName} onChange={e=>setLocName(e.target.value)} placeholder="e.g. starbucks bandra" className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-5 text-sm outline-none focus:border-brand-purple transition-all shadow-inner" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-600 ml-4 mb-2 block">map link</label>
                  <div className="flex gap-3">
                    <input type="text" value={locUrl} readOnly placeholder="select on map first" className="flex-1 bg-white/5 border border-white/10 rounded-[1.5rem] p-5 text-xs opacity-50 truncate" />
                    <button onClick={() => setShowMapPicker(true)} className="p-5 bg-brand-purple/10 border border-brand-purple/20 rounded-[1.5rem] text-brand-purple active:scale-90 transition-transform"><MapIcon size={24}/></button>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-4 pt-4">
                <button onClick={proposeLocation} disabled={!locName || !locUrl} className="w-32 bg-brand-purple py-4 rounded-[1.8rem] font-bold text-base shadow-2xl active:scale-95 transition-all disabled:opacity-20 mx-auto">send</button>
                <button onClick={()=>setShowLocModal(false)} className="w-full py-2 text-zinc-500 text-sm font-bold transition-colors text-center">go back</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}