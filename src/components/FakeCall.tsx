import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
 Phone, PhoneOff, Mic, MicOff, Volume2, Video, VideoOff, Grip,
 MessageSquare, Clock, ChevronDown, Bell, BellOff, User, Hash,
 Zap, ShieldCheck, Timer, Sparkles, PhoneIncoming, PhoneMissed, CheckCheck,
 Upload, Camera, Save, Trash2, Plus, X, Play, Pause, SkipForward, RotateCcw,
 Lock, Flashlight, BatteryMedium, Wifi, Star, Eye, EyeOff, History,
 Contact, Siren, BadgeCheck, Car, Building2, Plane, CloudRain, Users, PartyPopper,
 Subtitles, MonitorUp, Settings2, ListVideo, PhoneCall
} from "lucide-react";
import { CALL_PRESETS, GRADIENTS } from "../lib/data";
import {
 RINGTONES, AMBIENCES, startRingtone, stopRingtone, playTap,
 speakAsCaller, stopSpeak, startAmbience, stopAmbience, setRingVolume,
 type RingtoneId, type AmbienceId
} from "../lib/audio";

export type CallLog = { name: string; number: string; time: string; duration: string; type: "incoming" | "missed" | "outgoing" };
type ThemeId = "iphone" | "pixel" | "samsung" | "whatsapp" | "truecaller";
type ScreenMode = "app" | "lock";
type TCState = "none" | "verified" | "spam" | "scam";

function fmtTime(s: number) {
 const m = Math.floor(s / 60).toString().padStart(2, "0");
 const sec = (s % 60).toString().padStart(2, "0");
 return `${m}:${sec}`;
}

const EXCUSES: Record<string, string[]> = {
 Family: ["Yes Mom! I just left, I will reach in 10 minutes.", "Yes Dad, I am in a meeting — I will call you back from home.", "Yes, I took my medicine — I am sending you a photo!"],
 Boss: ["Yes sir! My laptop is on, joining the Meet in 2 minutes.", "Sir, the client deck is almost ready, sharing my screen now.", "Sorry sir, my network dropped, I am back online now!"],
 Friend: ["Bro, I am stuck in traffic, please order — I am almost there!", "Bro, there is an exam issue, come to the library fast!", "Yes bro, I can hear you, you are on speaker — go ahead!"],
 Emergency: ["What?! Hold on, I am leaving right now, send me the location!", "Okay okay, do not panic, I will be there in 5 minutes.", "Yes, I spoke to the doctor, I am bringing the reports."],
};

const AMBI_ICON: Record<AmbienceId, any> = { traffic: Car, office: Building2, airport: Plane, rain: CloudRain, crowd: Users, club: PartyPopper };

function LiveWave({ active }: { active: boolean }) {
 const ref = useRef<HTMLCanvasElement>(null);
 useEffect(() => {
  let raf: number; let t = 0;
  const draw = () => {
   const c = ref.current; if (!c) { raf = requestAnimationFrame(draw); return; }
   const x = c.getContext("2d"); if (!x) return;
   const W = c.width, H = c.height;
   x.clearRect(0, 0, W, H);
   const bars = 42;
   for (let i = 0; i < bars; i++) {
    const v = active ? (Math.sin(t * 0.18 + i * 0.55) * 0.5 + 0.5) * (0.35 + Math.random() * 0.65) : 0.08;
    const h = Math.max(3, v * H * 0.9);
    const g = x.createLinearGradient(0, H - h, 0, H);
    g.addColorStop(0, "#22d3ee"); g.addColorStop(1, "#e879f9");
    x.fillStyle = g;
    const bw = W / bars;
    x.beginPath();
    x.roundRect(i * bw + 1.5, (H - h) / 2, bw - 3, h, 3);
    x.fill();
   }
   t += 1;
   raf = requestAnimationFrame(draw);
  };
  raf = requestAnimationFrame(draw);
  return () => cancelAnimationFrame(raf);
 }, [active]);
 return <canvas ref={ref} width={320} height={44} className="w-full h-[44px]" />;
}

export default function FakeCall({ onLog, onCheckNumber }: { onLog: (l: CallLog) => void; onCheckNumber?: (num: string) => void }) {
 // identity
 const [name, setName] = useState("Mom");
 const [number, setNumber] = useState("+91 98200 12345");
 const [initial, setInitial] = useState("M");
 const [gradient, setGradient] = useState("from-rose-500 to-orange-400");
 const [photo, setPhoto] = useState<string | null>(null);
 const [privateNum, setPrivateNum] = useState(false);
 const fileRef = useRef<HTMLInputElement>(null);

 // device spoof
 const [theme, setTheme] = useState<ThemeId>("iphone");
 const [screenMode, setScreenMode] = useState<ScreenMode>("app");
 const [carrier, setCarrier] = useState("Jio 5G");
 const [battery, setBattery] = useState(82);
 const [signal, setSignal] = useState(4);
 const [showWifi, setShowWifi] = useState(true);
 const [tc, setTc] = useState<TCState>("none");
 const [simLabel, setSimLabel] = useState("SIM 1");

 // sound
 const [ringtone, setRingtone] = useState<RingtoneId>("iphone");
 const [volume, setVolume] = useState(0.9);
 const [vibrate, setVibrate] = useState(true);
 const [flashAlert, setFlashAlert] = useState(false);
 const [flashOn, setFlashOn] = useState(false);

 // schedule
 const [delay, setDelay] = useState(5);

 // voice script (multi-line)
 const [voiceText, setVoiceText] = useState("Hi sweetheart, have you eaten?\nWhen are you coming home?\nDad wants to talk to you!");
 const [femaleVoice, setFemaleVoice] = useState(true);
 const [autoScript, setAutoScript] = useState(true);
 const [scriptIdx, setScriptIdx] = useState(0);
 const [showSubs, setShowSubs] = useState(true);
 const lines = voiceText.split("\n").map(s => s.trim()).filter(Boolean);

 // call state
 const [phase, setPhase] = useState<"idle" | "scheduled" | "incoming" | "active" | "ended">("idle");
 const [countdown, setCountdown] = useState(0);
 const [callSecs, setCallSecs] = useState(0);
 const [muted, setMuted] = useState(false);
 const [speaker, setSpeaker] = useState(true);
 const [videoOn, setVideoOn] = useState(false);
 const [useCamera, setUseCamera] = useState(false);
 const [showKeypad, setShowKeypad] = useState(false);
 const [keypadVal, setKeypadVal] = useState("");
 const [ambience, setAmbience] = useState<AmbienceId | null>(null);
 const [showPrompter, setShowPrompter] = useState(false);
 const [prompterCat, setPrompterCat] = useState("Boss");
 const [lastResult, setLastResult] = useState<CallLog | null>(null);
 const [isFullscreen, setIsFullscreen] = useState(true);
 const [showAvatarPicker, setShowAvatarPicker] = useState(false);
 const [rightTab, setRightTab] = useState<"preview" | "recents" | "contacts" | "director">("preview");

 // contacts + queue + recents
 const [contacts, setContacts] = useState<any[]>(() => {
  try { return JSON.parse(localStorage.getItem("prankx_contacts_v2") || "[]"); } catch { return []; }
 });
 const [queue, setQueue] = useState<any[]>([]);
 const [fakeRecents, setFakeRecents] = useState<CallLog[]>([
  { name: "Aarohi", number: "+91 90041 77823", time: "Yesterday", duration: "12:44", type: "incoming" },
  { name: "Swiggy Delivery", number: "+91 86520 99110", time: "Tuesday", duration: "01:02", type: "missed" },
  { name: "Mr. Sharma (Boss)", number: "+91 99870 44521", time: "Monday", duration: "04:19", type: "incoming" },
 ]);

 const countRef = useRef<number | null>(null);
 const callRef = useRef<number | null>(null);
 const flashRef = useRef<number | null>(null);
 const videoRef = useRef<HTMLVideoElement>(null);
 const streamRef = useRef<MediaStream | null>(null);
 const wakeRef = useRef<any>(null);

 const nowTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
 const nowDate = () => new Date().toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" });
 const displayNumber = privateNum ? "Private Number" : number;

 useEffect(() => { setRingVolume(volume); }, [volume]);
 useEffect(() => { localStorage.setItem("prankx_contacts_v2", JSON.stringify(contacts)); }, [contacts]);
 useEffect(() => () => { clearAll(); stopRingtone(); stopSpeak(); stopAmbience(); }, []);

 const clearAll = () => {
  if (countRef.current) clearInterval(countRef.current);
  if (callRef.current) clearInterval(callRef.current);
  if (flashRef.current) clearInterval(flashRef.current);
  countRef.current = callRef.current = flashRef.current = null;
  try { wakeRef.current?.release?.(); } catch {}
  stopCamera();
 };

 const stopCamera = () => {
  try { streamRef.current?.getTracks().forEach(t => t.stop()); } catch {}
  streamRef.current = null;
 };

 const startCamera = async () => {
  try {
   const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
   streamRef.current = s;
   if (videoRef.current) videoRef.current.srcObject = s;
  } catch { setUseCamera(false); }
 };

 useEffect(() => { if (useCamera && phase !== "idle") startCamera(); else if (!useCamera) stopCamera(); }, [useCamera, phase]);

 const applyPreset = (id: string) => {
  const p = CALL_PRESETS.find(x => x.id === id);
  if (!p) return;
  playTap();
  setName(p.name); setNumber(p.number); setInitial(p.initial); setGradient(p.gradient);
  setPhoto(null); setVoiceText(p.voice); setFemaleVoice(!!p.female); setPrivateNum(false);
 };

 const onPhoto = (f: File | undefined) => {
  if (!f) return;
  const r = new FileReader();
  r.onload = () => setPhoto(String(r.result));
  r.readAsDataURL(f);
 };

 // ---- call flow ----
 const scheduleCall = (secs: number) => {
  playTap(); clearAll(); stopRingtone(); stopSpeak(); stopAmbience();
  setCallSecs(0); setScriptIdx(0); setKeypadVal(""); setMuted(false); setAmbience(null);
  setShowKeypad(false); setShowPrompter(false); setLastResult(null); setFlashOn(false);
  if (secs <= 0) { startIncoming(); return; }
  setPhase("scheduled"); setCountdown(secs);
  countRef.current = window.setInterval(() => {
   setCountdown(c => {
    if (c <= 1) { if (countRef.current) clearInterval(countRef.current); startIncoming(); return 0; }
    return c - 1;
   });
  }, 1000);
 };

 const startIncoming = async () => {
  setPhase("incoming");
  startRingtone(ringtone, vibrate);
  try { (navigator as any).wakeLock?.request("screen").then((w: any) => wakeRef.current = w).catch(() => {}); } catch {}
  if (flashAlert) {
   flashRef.current = window.setInterval(() => setFlashOn(f => !f), 420);
  }
 };

 const speakLine = (idx: number) => {
  if (!lines[idx]) return;
  setScriptIdx(idx);
  speakAsCaller(lines[idx], femaleVoice);
 };

 const answer = () => {
  playTap(); stopRingtone();
  if (flashRef.current) clearInterval(flashRef.current);
  setFlashOn(false);
  setPhase("active"); setCallSecs(0);
  callRef.current = window.setInterval(() => setCallSecs(s => s + 1), 1000);
  if (autoScript && lines.length) setTimeout(() => speakLine(0), 700);
  else if (lines.length && !autoScript) setTimeout(() => speakLine(0), 700);
 };

 // auto-advance script
 useEffect(() => {
  if (phase !== "active" || !autoScript || lines.length <= 1) return;
  if (scriptIdx >= lines.length - 1) return;
  const est = Math.max(3200, lines[scriptIdx].length * 75 + 1800);
  const t = setTimeout(() => speakLine(scriptIdx + 1), est);
  return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [phase, scriptIdx, autoScript]);

 const decline = (missed = true) => {
  playTap(); stopRingtone(); stopSpeak(); stopAmbience(); clearAll();
  const log: CallLog = { name, number: displayNumber, time: nowTime(), duration: "00:00", type: missed ? "missed" : "incoming" };
  setLastResult(log); onLog(log); setFakeRecents(p => [log, ...p].slice(0, 20));
  setPhase("ended");
 };

 const endActive = () => {
  playTap(); stopSpeak(); stopAmbience(); clearAll();
  const log: CallLog = { name, number: displayNumber, time: nowTime(), duration: fmtTime(callSecs), type: "incoming" };
  setLastResult(log); onLog(log); setFakeRecents(p => [log, ...p].slice(0, 20));
  setPhase("ended");
 };

 // director queue
 const addToQueue = () => {
  playTap();
  setQueue(q => [...q, { id: Date.now(), name, number: displayNumber, initial, gradient, photo, voice: voiceText, female: femaleVoice, gap: 8 }]);
 };
 const playQueue = () => {
  if (!queue.length) return;
  playTap();
  const [first, ...rest] = queue;
  const runItem = (item: any, remaining: any[]) => {
   setName(item.name); setNumber(item.number === "Private Number" ? "+91 90000 00000" : item.number);
   setInitial(item.initial); setGradient(item.gradient); setPhoto(item.photo || null);
   setVoiceText(item.voice); setFemaleVoice(item.female);
   setPhase("scheduled"); setCountdown(3);
   countRef.current = window.setInterval(() => {
    setCountdown(c => {
     if (c <= 1) { if (countRef.current) clearInterval(countRef.current); startIncoming(); return 0; }
     return c - 1;
    });
   }, 1000);
   // after this call ends, auto continue? we hook via phase ended listener below using queueRef
   (window as any).__prankx_rest = remaining;
  };
  runItem(first, rest);
 };
 // continue queue when a call ends
 useEffect(() => {
  if (phase === "ended") {
   const rest = (window as any).__prankx_rest as any[] | undefined;
   if (rest && rest.length) {
    const t = setTimeout(() => {
     const [nxt, ...left] = rest;
     (window as any).__prankx_rest = left;
     setName(nxt.name); setNumber(nxt.number); setInitial(nxt.initial); setGradient(nxt.gradient);
     setPhoto(nxt.photo || null); setVoiceText(nxt.voice); setFemaleVoice(nxt.female);
     scheduleCall(nxt.gap || 8);
    }, 2500);
    return () => clearTimeout(t);
   } else {
    (window as any).__prankx_rest = undefined;
   }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [phase]);

 const avatarNode = (size = "w-16 h-16 text-3xl") => (
  photo ? <img src={photo} className={`${size} rounded-2xl object-cover shadow-lg`} alt="" />
   : <div className={`${size} rounded-2xl bg-gradient-to-br ${gradient} grid place-items-center shadow-lg text-white font-bold`}>{initial}</div>
 );

 const tcBanner = tc !== "none" && (
  <div className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 ${tc === "verified" ? "bg-blue-500/20 text-blue-300 border border-blue-400/30" : tc === "spam" ? "bg-amber-500/20 text-amber-300 border border-amber-400/30" : "bg-red-500/20 text-red-300 border border-red-400/40"}`}>
   {tc === "verified" ? <><BadgeCheck size={11} /> Verified Business</> : tc === "spam" ? "Spam Likely" : "Scam Suspected"}
  </div>
 );

 return (
  <div className="grid lg:grid-cols-[440px_1fr] gap-6">
   {/* ============ LEFT: ULTRA CONTROL DECK ============ */}
   <div className="rounded-3xl glass p-5 sm:p-6 space-y-5 relative overflow-hidden max-h-none">
    <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-600/20 blur-[80px] rounded-full pointer-events-none" />
    <div className="flex items-center justify-between">
     <div>
      <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-cyan-300 uppercase">
       <Zap size={13} /> Call Settings
      </div>
      <h3 className="font-display text-xl font-bold mt-1">Design your caller</h3>
     </div>
     <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-600 grid place-items-center shadow-lg"><PhoneIncoming size={18} className="text-white" /></div>
    </div>

    {/* presets */}
    <div>
     <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Quick Contacts</p>
     <div className="flex flex-wrap gap-1.5">
      {CALL_PRESETS.map(p => (
       <button key={p.id} onClick={() => applyPreset(p.id)} className="px-2.5 py-1.5 rounded-full text-[11px] font-bold bg-slate-100 hover:bg-slate-100 border border-slate-200 transition flex items-center gap-1">
        <span class="w-5 h-5 rounded-full bg-slate-900 text-white grid place-items-center text-[10px] font-bold">{p.initial}</span> {p.name.split(" ").slice(0, 2).join(" ")}
       </button>
      ))}
     </div>
    </div>

    {/* identity + photo */}
    <div className="flex gap-3 items-start bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
     <div className="flex flex-col items-center gap-1.5 shrink-0">
      <button onClick={() => setShowAvatarPicker(!showAvatarPicker)} className="relative hover:scale-105 transition">
       {avatarNode()}
       <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-black border border-slate-200 grid place-items-center text-[10px]">+</span>
      </button>
      <button onClick={() => fileRef.current?.click()} className="text-[10px] font-extrabold bg-slate-100 hover:bg-slate-200 rounded-full px-2.5 py-1 flex items-center gap-1 transition"><Upload size={10} /> PHOTO</button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => onPhoto(e.target.files?.[0])} />
      {photo && <button onClick={() => setPhoto(null)} className="text-[10px] text-red-300 font-bold">remove</button>}
     </div>
     <div className="flex-1 space-y-2 min-w-0">
      <div className="relative">
       <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
       <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-8 pr-2 py-2 text-[13px] font-bold outline-none focus:border-cyan-400/60" />
      </div>
      <div className="relative">
       <Hash size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
       <input value={number} disabled={privateNum} onChange={e => setNumber(e.target.value)} className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-8 pr-2 py-2 text-[13px] outline-none focus:border-cyan-400/60 font-mono disabled:opacity-40" />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
       <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 cursor-pointer"><input type="checkbox" checked={privateNum} onChange={e => setPrivateNum(e.target.checked)} className="accent-cyan-400" /> Private</label>
       <button onClick={() => { playTap(); setContacts(c => [{ name, number: displayNumber, initial, gradient, photo }, ...c].slice(0, 12)); }} className="text-[10px] font-extrabold bg-cyan-400/15 border border-cyan-300/30 text-cyan-200 rounded-full px-2.5 py-1 flex items-center gap-1 hover:bg-cyan-400/25"><Save size={10} /> SAVE CONTACT</button>
       <button onClick={() => { playTap(); onCheckNumber?.(displayNumber); }} className="text-[10px] font-extrabold bg-emerald-400/15 border border-emerald-300/30 text-emerald-200 rounded-full px-2.5 py-1 flex items-center gap-1 hover:bg-emerald-400/25"><ShieldCheck size={10} /> SCAN SAFETY</button>
      </div>
     </div>
    </div>

    {showAvatarPicker && (
     <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-100 border border-slate-200 rounded-2xl p-3 space-y-3">
      <div>
       <p className="text-[10px] text-slate-500 font-bold mb-1.5 tracking-widest">AVATAR LETTER</p>
       <div className="flex flex-wrap gap-1.5">
        {["A", "B", "M", "P", "R", "S", "V", "K"].map(e => (
         <button key={e} onClick={() => { setInitial(e); setPhoto(null); }} className={`w-9 h-9 rounded-xl text-base font-bold grid place-items-center transition ${initial === e && !photo ? "bg-slate-900 text-white" : "bg-white border border-slate-200 hover:bg-slate-100"}`}>{e}</button>
        ))}
       </div>
      </div>
      <div>
       <p className="text-[10px] text-slate-500 font-bold mb-1.5 tracking-widest">COLOR</p>
       <div className="flex flex-wrap gap-2">
        {GRADIENTS.map(g => (
         <button key={g} onClick={() => setGradient(g)} className={`w-10 h-8 rounded-lg bg-gradient-to-br ${g} ${gradient === g ? "ring-2 ring-slate-900" : "opacity-70 hover:opacity-100"}`} />
        ))}
       </div>
      </div>
     </motion.div>
    )}

    {/* theme 5 */}
    <div>
     <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Phone Style</p>
     <div className="grid grid-cols-5 gap-1.5">
      {([
       { id: "iphone", e: "", l: "iPhone" },
       { id: "pixel", e: "", l: "Pixel" },
       { id: "samsung", e: "", l: "Samsung" },
       { id: "whatsapp", e: "", l: "WA" },
       { id: "truecaller", e: "", l: "Truecaller" },
      ] as { id: ThemeId; e: string; l: string }[]).map(t => (
       <button key={t.id} onClick={() => { playTap(); setTheme(t.id); }} className={`rounded-xl border py-2 text-center text-[10px] font-extrabold transition ${theme === t.id ? "bg-gradient-to-br from-cyan-500/25 to-violet-500/25 border-cyan-400/60 text-white" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"}`}>
        <div className="text-base">{t.e}</div>{t.l}
       </button>
      ))}
     </div>
     <div className="grid grid-cols-2 gap-2 mt-2">
      <div className={`rounded-xl border p-2.5 flex items-center gap-2 cursor-pointer transition ${screenMode === "app" ? "border-cyan-400/50 bg-cyan-400/10" : "border-slate-200 bg-slate-50"}`} onClick={() => setScreenMode("app")}>
       <PhoneCall size={15} className="text-cyan-300" /><div><div className="text-[12px] font-bold">In-App Call</div><div className="text-[10px] text-slate-500">Phone unlocked</div></div>
      </div>
      <div className={`rounded-xl border p-2.5 flex items-center gap-2 cursor-pointer transition ${screenMode === "lock" ? "border-fuchsia-400/50 bg-fuchsia-400/10" : "border-slate-200 bg-slate-50"}`} onClick={() => setScreenMode("lock")}>
       <Lock size={15} className="text-fuchsia-300" /><div><div className="text-[12px] font-bold">Lock Screen</div><div className="text-[10px] text-slate-500">Swipe to answer</div></div>
      </div>
     </div>
    </div>

    {/* device spoof */}
    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5 space-y-2.5">
     <p className="text-[11px] font-extrabold tracking-widest text-slate-500 uppercase flex items-center gap-1.5"><Settings2 size={12} /> Phone Details</p>
     <div className="grid grid-cols-2 gap-2">
      <div>
       <label className="text-[10px] font-bold text-slate-500">CARRIER</label>
       <input value={carrier} onChange={e => setCarrier(e.target.value)} className="mt-1 w-full bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[12px] font-bold outline-none focus:border-cyan-400/50" />
      </div>
      <div>
       <label className="text-[10px] font-bold text-slate-500">SIM SLOT</label>
       <div className="flex gap-1 mt-1">
        {["SIM 1", "SIM 2", "eSIM"].map(s => (
         <button key={s} onClick={() => setSimLabel(s)} className={`flex-1 text-[10px] font-extrabold py-1.5 rounded-lg border ${simLabel === s ? "bg-slate-900 text-white border-white" : "border-slate-200 text-slate-500"}`}>{s}</button>
        ))}
       </div>
      </div>
     </div>
     <div className="flex items-center gap-2">
      <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1"><BatteryMedium size={13} /> {battery}%</span>
      <input type="range" min={5} max={100} value={battery} onChange={e => setBattery(Number(e.target.value))} className="flex-1" />
      <span className="text-[11px] font-bold text-slate-500">Signal {signal}/4</span>
      <input type="range" min={1} max={4} value={signal} onChange={e => setSignal(Number(e.target.value))} className="w-16" />
      <button onClick={() => setShowWifi(!showWifi)} className={`p-1.5 rounded-lg ${showWifi ? "text-cyan-300 bg-cyan-400/10" : "text-white/30 bg-white/5"}`}><Wifi size={14} /></button>
     </div>
     <div>
      <label className="text-[10px] font-bold text-slate-500">TRUST BADGE (Truecaller ID)</label>
      <div className="flex flex-wrap gap-1.5 mt-1.5">
       {([["none", "No badge"], ["verified", "Verified"], ["spam", "Spam"], ["scam", "Scam"]] as [TCState, string][]).map(([v, l]) => (
        <button key={v} onClick={() => setTc(v)} className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${tc === v ? "bg-slate-900 text-white border-white" : "border-slate-200 text-slate-500 hover:bg-slate-100"}`}>{l}</button>
       ))}
      </div>
     </div>
    </div>

    {/* ringtone + fx */}
    <div>
     <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Bell size={12} /> Ringtone + Alert FX</p>
     <div className="grid grid-cols-1 gap-1.5 max-h-[150px] overflow-y-auto pr-1">
      {RINGTONES.map(r => (
       <button key={r.id} onClick={() => { setRingtone(r.id); playTap(); startRingtone(r.id, false); setTimeout(() => stopRingtone(), 1600); }}
        className={`flex items-center justify-between px-3 py-2 rounded-xl border text-left transition ${ringtone === r.id ? "border-cyan-400/60 bg-cyan-400/10" : "border-slate-200 bg-slate-50 hover:bg-white/[0.07]"}`}>
        <div><div className="text-[12.5px] font-bold flex items-center gap-2">{r.name} {ringtone === r.id && <span className="text-[9px] bg-cyan-400 text-black px-1.5 py-0.5 rounded-full font-extrabold">ACTIVE</span>}</div>
         <div className="text-[10.5px] text-slate-500">{r.desc}</div></div>
        <Volume2 size={15} className={ringtone === r.id ? "text-cyan-300" : "text-white/30"} />
       </button>
      ))}
     </div>
     <div className="grid grid-cols-2 gap-2 mt-2.5">
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
       <div className="text-[10px] font-bold text-slate-500">VOLUME {Math.round(volume * 100)}%</div>
       <input type="range" min={0.1} max={1} step={0.05} value={volume} onChange={e => setVolume(Number(e.target.value))} className="w-full" />
      </div>
      <div className="space-y-1.5">
       <label className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-[7px] text-[11px] font-bold cursor-pointer">
        <span className="flex items-center gap-1.5">{vibrate ? <Bell size={12} className="text-cyan-300" /> : <BellOff size={12} className="text-slate-400" />} Vibrate</span>
        <button onClick={() => setVibrate(!vibrate)} className={`w-9 h-5 rounded-full p-0.5 transition ${vibrate ? "bg-cyan-400" : "bg-slate-100"}`}><div className={`w-4 h-4 rounded-full bg-white transition-all ${vibrate ? "translate-x-4" : ""}`} /></button>
       </label>
       <label className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-[7px] text-[11px] font-bold cursor-pointer">
        <span className="flex items-center gap-1.5"><Flashlight size={12} className={flashAlert ? "text-amber-300" : "text-slate-400"} /> Flash alert</span>
        <button onClick={() => setFlashAlert(!flashAlert)} className={`w-9 h-5 rounded-full p-0.5 transition ${flashAlert ? "bg-amber-300" : "bg-slate-100"}`}><div className={`w-4 h-4 rounded-full bg-white transition-all ${flashAlert ? "translate-x-4" : ""}`} /></button>
       </label>
      </div>
     </div>
     <div className="flex items-center gap-2 mt-2 text-[11px] font-bold">
      <label className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 cursor-pointer flex-1">
       <input type="checkbox" checked={isFullscreen} onChange={e => setIsFullscreen(e.target.checked)} className="accent-cyan-400" /> Fullscreen takeover
      </label>
      <label className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 cursor-pointer flex-1">
       <input type="checkbox" checked={useCamera} onChange={e => setUseCamera(e.target.checked)} className="accent-fuchsia-400" /> <Camera size={12} /> My cam as video
      </label>
     </div>
    </div>

    {/* timer */}
    <div>
     <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Timer size={12} /> Call Timer</p>
     <div className="flex flex-wrap gap-1.5 mb-2.5">
      {[0, 5, 15, 30, 60, 120].map(s => (
       <button key={s} onClick={() => setDelay(s)} className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold border transition ${delay === s ? "bg-slate-900 text-white border-white" : "border-slate-200 text-slate-600 hover:bg-slate-100"}`}>
        {s === 0 ? "NOW" : `${s}s`}
       </button>
      ))}
     </div>
     <div className="flex items-center gap-2.5 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2">
      <Clock size={13} className="text-slate-400 shrink-0" />
      <input type="range" min={0} max={120} value={delay} onChange={e => setDelay(Number(e.target.value))} className="flex-1" />
      <span className="text-[13px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded-lg min-w-[52px] text-center">{delay}s</span>
     </div>
    </div>

    {/* voice script */}
    <div className="bg-gradient-to-br from-fuchsia-500/10 to-violet-500/10 border border-fuchsia-400/20 rounded-2xl p-3.5">
     <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
      <p className="text-[11px] font-extrabold tracking-widest text-fuchsia-300 uppercase flex items-center gap-1.5"><Sparkles size={12} /> What the caller says</p>
      <div className="flex gap-1 bg-slate-100 rounded-full p-1 text-[10px] font-bold">
       <button onClick={() => setFemaleVoice(true)} className={`px-2 py-0.5 rounded-full ${femaleVoice ? "bg-pink-500 text-white" : "text-slate-500"}`}>Female</button>
       <button onClick={() => setFemaleVoice(false)} className={`px-2 py-0.5 rounded-full ${!femaleVoice ? "bg-blue-500 text-white" : "text-slate-500"}`}>Male</button>
      </div>
     </div>
     <textarea value={voiceText} onChange={e => setVoiceText(e.target.value)} rows={3} className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-[12.5px] outline-none focus:border-fuchsia-400/60 resize-none leading-relaxed" placeholder={"Line 1\nLine 2\nLine 3 — each line will be spoken separately"} />
     <div className="flex items-center justify-between mt-2 text-[11px] font-bold">
      <label className="flex items-center gap-1.5 text-slate-500 cursor-pointer"><input type="checkbox" checked={autoScript} onChange={e => setAutoScript(e.target.checked)} className="accent-fuchsia-400" /> Auto-play lines</label>
      <label className="flex items-center gap-1.5 text-slate-500 cursor-pointer"><input type="checkbox" checked={showSubs} onChange={e => setShowSubs(e.target.checked)} className="accent-fuchsia-400" /> <Subtitles size={12} /> Subtitles</label>
      <span className="text-fuchsia-300">{lines.length} lines</span>
     </div>
     {lines.length > 0 && (
      <div className="mt-2 space-y-1 max-h-[92px] overflow-y-auto">
       {lines.map((l, i) => (
        <div key={i} className="flex items-center gap-2 text-[11px] bg-slate-100 border border-slate-200 rounded-lg px-2 py-1.5">
         <span className="w-5 h-5 rounded-md bg-fuchsia-500/20 text-fuchsia-200 grid place-items-center font-black text-[10px] shrink-0">{i + 1}</span>
         <span className="flex-1 truncate text-white/75">{l}</span>
        </div>
       ))}
      </div>
     )}
    </div>

    {/* TRIGGER */}
    {phase === "idle" || phase === "ended" ? (
     <div className="space-y-2">
      <motion.button whileTap={{ scale: 0.97 }} onClick={() => scheduleCall(delay)}
       className="w-full py-4 rounded-2xl font-display font-semibold text-[14.5px] text-white bg-slate-900 hover:bg-slate-700 flex items-center justify-center gap-2">
       <Phone size={18} strokeWidth={2.6} /> {delay === 0 ? "Call Now" : `Call in ${delay}s`}
      </motion.button>
      <div className="flex gap-2">
       <button onClick={addToQueue} className="flex-1 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-[12px] font-extrabold hover:bg-slate-100 transition flex items-center justify-center gap-1.5"><Plus size={13} /> QUEUE {queue.length > 0 && `(${queue.length})`}</button>
       <button onClick={playQueue} disabled={!queue.length} className="flex-1 py-2.5 rounded-xl bg-slate-900 text-[12px] font-extrabold hover:brightness-110 transition disabled:opacity-40 flex items-center justify-center gap-1.5"><ListVideo size={13} /> PLAY SEQUENCE</button>
      </div>
      {queue.length > 0 && (
       <div className="bg-slate-100 border border-slate-200 rounded-xl p-2 space-y-1">
        {queue.map((q, i) => (
         <div key={q.id} className="flex items-center gap-2 text-[11px] font-bold">
          <span className="w-5 h-5 rounded-md bg-slate-100 grid place-items-center text-[10px]">{i + 1}</span>
          <span className="flex-1 truncate">{q.initial} {q.name}</span>
          <button onClick={() => setQueue(qq => qq.filter(x => x.id !== q.id))} className="text-red-300 hover:text-red-200"><X size={12} /></button>
         </div>
        ))}
        <button onClick={() => setQueue([])} className="text-[10px] text-slate-400 font-bold hover:text-white">clear sequence</button>
       </div>
      )}
     </div>
    ) : phase === "scheduled" ? (
     <div className="bg-amber-400/10 border border-amber-300/30 rounded-2xl p-4 text-center">
      <div className="font-display text-5xl font-black text-amber-300 tabular-nums">{countdown}s</div>
      <p className="text-[11px] text-amber-200/80 font-bold mt-1">Incoming call armed… keep this tab open {(window as any).__prankx_rest?.length ? `• +${(window as any).__prankx_rest.length} queued` : ""}</p>
      <div className="flex gap-2 mt-3">
       <button onClick={() => startIncoming()} className="flex-1 py-2.5 rounded-xl bg-amber-300 text-black text-[13px] font-extrabold">RING NOW</button>
       <button onClick={() => { playTap(); clearAll(); setPhase("idle"); }} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-[13px] font-bold hover:bg-slate-200">CANCEL</button>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
       <div className="h-full bg-amber-300 transition-all" style={{ width: `${(countdown / (delay || 3)) * 100}%` }} />
      </div>
     </div>
    ) : null}

    {lastResult && phase === "ended" && (
     <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-3">
      <div className={`w-10 h-10 rounded-xl grid place-items-center ${lastResult.type === "missed" ? "bg-red-500/20 text-red-300" : "bg-emerald-500/20 text-emerald-300"}`}>
       {lastResult.type === "missed" ? <PhoneMissed size={18} /> : <CheckCheck size={18} />}
      </div>
      <div className="flex-1 min-w-0">
       <div className="text-[13px] font-bold truncate">{lastResult.type === "missed" ? "Missed call" : "Call ended"} • {lastResult.duration}</div>
       <div className="text-[11px] text-slate-500">{lastResult.name} • {lastResult.time}</div>
      </div>
      <button onClick={() => scheduleCall(0)} className="text-[11px] font-extrabold bg-slate-900 text-white px-3 py-1.5 rounded-full">RE-RING</button>
     </motion.div>
    )}
    <p className="text-[11px] text-slate-400 flex items-start gap-1.5 leading-relaxed"><ShieldCheck size={13} className="mt-0.5 shrink-0" /> 100% offline simulation. No real call placed. Fun / skits / awareness only.</p>
   </div>

   {/* ============ RIGHT: STUDIO ============ */}
   <div className="rounded-3xl glass p-5 sm:p-6 relative overflow-hidden flex flex-col min-h-[700px]">
    <div className="absolute -top-32 left-1/3 w-96 h-96 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />
    <div className="flex items-center justify-between mb-4 flex-wrap gap-2.5 relative">
     <div>
      <div className="text-[11px] font-bold tracking-[0.2em] text-fuchsia-300 uppercase">Studio • {theme} • {screenMode} mode</div>
      <h3 className="font-display text-xl font-bold">Preview</h3>
     </div>
     <div className="flex gap-1.5 bg-slate-100 border border-slate-200 rounded-full p-1 text-[11px] font-extrabold">
      {([["preview", "Preview"], ["recents", "Recents"], ["contacts", "Contacts"], ["director", "Director"]] as const).map(([v, l]) => (
       <button key={v} onClick={() => setRightTab(v)} className={`px-3 py-1.5 rounded-full transition ${rightTab === v ? "bg-slate-900 text-white" : "text-slate-500 hover:text-white"}`}>{l}</button>
      ))}
     </div>
    </div>

    {rightTab === "preview" && (
     <div className="grid md:grid-cols-[290px_1fr] gap-6 items-start relative">
      {/* mini phone */}
      <div className="mx-auto w-[272px] shrink-0">
       <div className="rounded-[2.2rem] border-[6px] border-zinc-800 overflow-hidden relative aspect-[9/19] shadow-2xl shadow-black/60 bg-black">
        <div className="flex justify-between items-center px-5 pt-3 text-[9px] font-bold text-white/90 relative z-10">
         <span className="truncate max-w-[70px]">{carrier}</span>
         {theme === "iphone" && <div className="w-16 h-[18px] bg-black rounded-full border border-slate-200 absolute left-1/2 -translate-x-1/2 top-2" />}
         <span className="flex gap-1 items-center">
          {showWifi && <Wifi size={9} />}
          <span className="flex items-end gap-[1.5px]">{[4, 7, 10, 13].map((h, i) => <i key={i} className={`w-[2.5px] rounded-sm block ${i < signal ? "bg-white" : "bg-white/25"}`} style={{ height: h }} />)}</span>
          <span className="flex items-center gap-0.5"><span className="w-5 h-2.5 rounded-[3px] border border-white/60 p-[1px] flex"><i className="flex-1 bg-emerald-400 rounded-[1px] block" style={{ width: `${battery}%` }} /></span></span>
         </span>
        </div>
        <div className="flex flex-col items-center pt-6 px-4 h-full relative z-10">
         <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
          {simLabel} • {theme === "whatsapp" ? "WhatsApp" : theme === "truecaller" ? "Truecaller" : "mobile"} <ChevronDown size={10} />
         </div>
         {tcBanner}
         <div className="mt-3 relative">
          {photo ? <img src={photo} className="w-[72px] h-[72px] rounded-full object-cover shadow-xl border-2 border-slate-200" alt="" />
           : <div className={`w-[72px] h-[72px] rounded-full bg-gradient-to-br ${gradient} grid place-items-center text-2xl font-bold text-white shadow-xl relative`}>{initial}<span className="absolute inset-0 rounded-full border-2 border-slate-200 animate-pulse-ring" /></div>}
         </div>
         <div className="mt-2.5 font-bold text-white text-[16px] text-center leading-tight px-2">{name || "Unknown"}</div>
         <div className="text-[11px] text-slate-500 font-mono">{displayNumber}</div>
         <div className="mt-4 w-full"><LiveWave active={false} /></div>
         <div className="mt-auto pb-7 w-full">
          <div className="flex justify-between px-2">
           <div className="flex flex-col items-center gap-1"><div className="w-11 h-11 rounded-full bg-red-500 grid place-items-center animate-shake"><PhoneOff size={16} className="text-white" /></div><span className="text-[9px] text-slate-600">Decline</span></div>
           <div className="flex flex-col items-center gap-1"><div className="w-11 h-11 rounded-full bg-emerald-500 grid place-items-center animate-shake"><Phone size={16} className="text-white" /></div><span className="text-[9px] text-slate-600">Accept</span></div>
          </div>
          <div className="mt-3 text-center text-[9px] text-slate-400 font-bold">{screenMode === "lock" ? "Lockscreen • slide to answer" : "Tap RING to test fullscreen"}</div>
         </div>
        </div>
       </div>
       <p className="text-center text-[11px] text-slate-400 mt-2.5 font-semibold">↑ Live replica — fullscreen on trigger</p>
      </div>

      <div className="space-y-3.5">
       {/* soundboard */}
       <div className="rounded-2xl bg-slate-100 border border-slate-200 p-4">
        <p className="text-[11px] font-extrabold tracking-widest text-slate-500 uppercase mb-1 flex items-center gap-1.5"><Volume2 size={12} /> Background Sounds <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded-full">DURING CALL</span></p>
        <p className="text-[11px] text-slate-500 mb-2.5">Make your excuse sound real — “I am stuck in traffic!” with actual traffic noise </p>
        <div className="grid grid-cols-3 gap-1.5">
         {AMBIENCES.map(a => {
          const Icon = AMBI_ICON[a.id];
          return (
           <button key={a.id} onClick={() => { playTap(); if (phase === "active") { if (ambience === a.id) { setAmbience(null); stopAmbience(); } else { setAmbience(a.id); startAmbience(a.id); } } else { setAmbience(a.id); } }}
            className={`rounded-xl border p-2 text-center transition ${ambience === a.id ? "border-amber-300/60 bg-amber-300/10" : "border-slate-200 bg-slate-50 hover:bg-slate-100"}`}>
            <Icon size={16} className="mx-auto mb-1" />
            <div className="text-[10.5px] font-extrabold">{a.name}</div>
           </button>
          );
         })}
        </div>
        {phase !== "active" && ambience && <p className="text-[10.5px] text-amber-200/70 font-bold mt-2">Ready: {ambience} will auto-start when you answer</p>}
       </div>

       {/* pro shortcuts */}
       <div className="rounded-2xl bg-slate-100 border border-slate-200 p-4">
        <p className="text-[11px] font-extrabold tracking-widest text-slate-500 uppercase mb-2.5">Quick Actions</p>
        <div className="flex flex-wrap gap-2">
         <button onClick={() => { applyPreset("boss"); setScreenMode("lock"); scheduleCall(15); }} className="px-3 py-2 rounded-xl bg-slate-900 text-white text-[11px] font-extrabold hover:bg-cyan-200 transition">ESCAPE 15s + LOCK</button>
         <button onClick={() => { applyPreset("mom"); scheduleCall(5); }} className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-[11px] font-bold hover:bg-slate-200 transition">MOM 5s</button>
         <button onClick={() => { applyPreset("crush"); setTheme("whatsapp"); scheduleCall(0); }} className="px-3 py-2 rounded-xl bg-slate-900 text-[11px] font-extrabold hover:brightness-110">CRUSH WA NOW</button>
         <button onClick={() => { applyPreset("police"); setTc("verified"); setTheme("truecaller"); scheduleCall(10); }} className="px-3 py-2 rounded-xl bg-blue-500/20 border border-blue-400/40 text-[11px] font-bold hover:bg-blue-500/30 transition">VERIFIED 10s</button>
        </div>
       </div>

       {/* script preview */}
       <div className="rounded-2xl border border-fuchsia-300/20 bg-gradient-to-br from-fuchsia-500/10 to-transparent p-4">
        <p className="text-[11px] font-extrabold tracking-widest text-fuchsia-300 uppercase mb-2">Script ({lines.length})</p>
        <div className="space-y-1.5 max-h-[130px] overflow-y-auto">
         {lines.map((l, i) => (
          <div key={i} className="flex gap-2 items-start text-[12px] bg-slate-100 rounded-lg px-2.5 py-1.5 border border-slate-200">
           <button onClick={() => speakAsCaller(l, femaleVoice)} className="w-6 h-6 rounded-full bg-slate-100 grid place-items-center shrink-0 hover:bg-white/25"><Play size={10} /></button>
           <span className="text-white/75 leading-snug">{l}</span>
          </div>
         ))}
         {!lines.length && <p className="text-[12px] text-slate-400">Write your script on the left — the caller will speak it!</p>}
        </div>
       </div>
      </div>
     </div>
    )}

    {rightTab === "recents" && (
     <div className="rounded-[1.6rem] overflow-hidden border border-slate-200 bg-black max-w-[360px] mx-auto w-full relative">
      <div className="bg-zinc-900 px-4 pt-3 pb-2">
       <div className="flex gap-1 justify-center mb-2"><span className="w-8 h-1 rounded-full bg-slate-200" /></div>
       <div className="flex items-center justify-between text-white">
        <span className="text-[13px] text-blue-400 font-medium">Edit</span>
        <span className="font-bold text-[15px]">Recents</span>
        <PhoneCall size={16} className="text-blue-400" />
       </div>
       <div className="grid grid-cols-2 bg-slate-100 rounded-lg p-0.5 mt-2 text-[12px] font-semibold text-center">
        <span className="bg-slate-100 rounded-md py-1">All</span><span className="py-1 text-slate-500">Missed</span>
       </div>
      </div>
      <div className="bg-black divide-y divide-white/10 max-h-[420px] overflow-y-auto">
       {fakeRecents.map((r, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-2.5">
         <div className="flex-1 min-w-0">
          <div className={`text-[14px] font-semibold truncate ${r.type === "missed" ? "text-red-400" : "text-white"}`}>{r.name}</div>
          <div className="text-[11px] text-slate-500">{r.number} • {simLabel}</div>
         </div>
         <div className="text-right">
          <div className="text-[11px] text-slate-500">{r.time}</div>
          <div className="text-[10px] text-slate-400">{r.duration}</div>
         </div>
         <Phone size={14} className="text-blue-400" />
        </div>
       ))}
      </div>
      <div className="bg-zinc-900 px-4 py-3 flex justify-around text-[10px] text-slate-500 font-medium">
       <span className="flex flex-col items-center gap-0.5 text-blue-400"><History size={16} /> Recents</span>
       <span className="flex flex-col items-center gap-0.5"><Contact size={16} /> Contacts</span>
       <span className="flex flex-col items-center gap-0.5"><Grip size={16} /> Keypad</span>
       <span className="flex flex-col items-center gap-0.5"><MessageSquare size={16} /> Voicemail</span>
      </div>
     </div>
    )}

    {rightTab === "contacts" && (
     <div className="space-y-2.5 max-w-[520px]">
      <p className="text-[12px] text-slate-500 font-semibold">Saved on this device ({contacts.length}/12) — load in 1 tap</p>
      {contacts.length === 0 && <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-[13px]">No saved contacts yet. Design a caller on the left and press <b>SAVE CONTACT</b>.</div>}
      {contacts.map((c, i) => (
       <div key={i} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-3">
        {c.photo ? <img src={c.photo} className="w-11 h-11 rounded-xl object-cover" alt="" /> : <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.gradient} grid place-items-center text-sm font-bold text-white`}>{c.initial}</div>}
        <div className="flex-1 min-w-0"><div className="text-[13px] font-bold truncate">{c.name}</div><div className="text-[11px] text-slate-500 font-mono">{c.number}</div></div>
        <button onClick={() => { setName(c.name); setNumber(c.number); setInitial(c.initial); setGradient(c.gradient); setPhoto(c.photo || null); playTap(); setRightTab("preview"); }} className="text-[11px] font-extrabold bg-slate-900 text-white px-3 py-1.5 rounded-full">LOAD</button>
        <button onClick={() => setContacts(cc => cc.filter((_, j) => j !== i))} className="p-1.5 text-slate-400 hover:text-red-300"><Trash2 size={14} /></button>
       </div>
      ))}
     </div>
    )}

    {rightTab === "director" && (
     <div className="space-y-3 max-w-[560px]">
      <div className="rounded-2xl bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10 border border-violet-300/20 p-4">
       <h4 className="font-display font-bold flex items-center gap-2"><MonitorUp size={17} /> Call Queue</h4>
       <p className="text-[12.5px] text-slate-500 mt-1 leading-relaxed">Line up multiple callers like a movie scene. <b className="text-white">Example:</b> Boss (10s) → Mom (gap 8s) → Crush (gap 15s). Everything rings automatically, you just act! 🎬</p>
       <div className="flex gap-2 mt-3">
        <button onClick={addToQueue} className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-[12px] font-extrabold">+ ADD CURRENT CALLER</button>
        <button onClick={playQueue} disabled={!queue.length} className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-[12px] font-semibold disabled:opacity-40">Play {queue.length ? `(${queue.length})` : ""}</button>
       </div>
      </div>
      {queue.map((q, i) => (
       <div key={q.id} className="flex items-center gap-3 bg-slate-100 border border-slate-200 rounded-2xl p-3">
        <span className="font-display font-black text-white/20 text-2xl w-8 text-center">{String(i + 1).padStart(2, "0")}</span>
        {q.photo ? <img src={q.photo} className="w-10 h-10 rounded-xl object-cover" alt="" /> : <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${q.gradient} grid place-items-center text-sm font-bold text-white`}>{q.initial}</div>}
        <div className="flex-1 min-w-0"><div className="text-[13px] font-bold truncate">{q.name}</div><div className="text-[11px] text-slate-500">+{i === 0 ? 3 : q.gap}s gap • {q.voice.split("\n")[0]?.slice(0, 40)}</div></div>
        <button onClick={() => setQueue(qq => qq.filter(x => x.id !== q.id))} className="p-1.5 text-slate-400 hover:text-red-300"><X size={14} /></button>
       </div>
      ))}
      {!queue.length && <p className="text-[12px] text-slate-400 text-center py-6">Queue empty — create a caller in the left panel and press ADD</p>}
     </div>
    )}
   </div>

   {/* ============ FULLSCREEN TAKEOVER ============ */}
   <AnimatePresence>
    {(phase === "incoming" || phase === "active") && (
     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className={`fixed inset-0 z-[90] ${isFullscreen ? "" : "p-5 grid place-items-center bg-black/70 backdrop-blur-sm"}`}>
      {flashOn && <div className="absolute inset-0 bg-white z-[5] pointer-events-none" style={{ opacity: 0.85 }} />}
      <motion.div initial={{ scale: isFullscreen ? 1.02 : 0.92, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.97, opacity: 0 }}
       className={`${isFullscreen ? "w-full h-full" : "w-full max-w-[380px] aspect-[9/17] rounded-[2rem] overflow-hidden border-4 border-zinc-800 shadow-2xl"} relative overflow-hidden flex flex-col ${theme === "whatsapp" ? "bg-[#0b141a]" : "bg-black"}`}>

       {/* video bg */}
       {useCamera && phase === "active" ? (
        <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover opacity-90" />
       ) : photo && phase !== "incoming" ? (
        <img src={photo} className="absolute inset-0 w-full h-full object-cover opacity-40 blur-[2px]" alt="" />
       ) : (
        <div className={`absolute inset-0 opacity-40 blur-[70px] bg-gradient-to-br ${gradient}`} />
       )}
       <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/80" />
       {videoOn && phase === "active" && !useCamera && (
        <div className="absolute inset-0 grid place-items-center z-[6]">
         <div className="text-center"><div className="text-4xl font-bold text-white mb-2 w-20 h-20 rounded-full bg-slate-700 grid place-items-center mx-auto">{initial}</div><div className="text-[10px] font-bold tracking-widest text-slate-600 uppercase bg-slate-100 px-3 py-1 rounded-full">Video paused - poor connection</div></div>
        </div>
       )}

       {/* status */}
       <div className="relative z-10 flex justify-between items-center px-6 pt-4 text-white/90 text-[11px] font-bold">
        <span className="truncate max-w-[90px]">{carrier}</span>
        {theme === "iphone" && isFullscreen && <div className="w-24 h-[22px] bg-black rounded-full border border-slate-200 absolute left-1/2 -translate-x-1/2 top-3" />}
        <span className="flex items-center gap-1.5">
         {showWifi && <Wifi size={11} />}
         <span className="flex items-end gap-[2px]">{[5, 8, 11, 14].map((h, i) => <i key={i} className={`w-[3px] rounded-sm block ${i < signal ? "bg-white" : "bg-white/25"}`} style={{ height: h }} />)}</span>
         <span className="flex items-center gap-1"><BatteryMedium size={13} /> {battery}%</span>
        </span>
       </div>

       {phase === "incoming" ? (
        screenMode === "lock" ? (
         /* LOCKSCREEN */
         <div className="relative z-10 flex-1 flex flex-col items-center px-6 text-center">
          <Lock size={15} className="text-slate-500 mt-3" />
          <div className="font-display font-black text-[54px] leading-none mt-1 tabular-nums">{nowTime()}</div>
          <div className="text-[13px] text-slate-600 font-medium">{nowDate()}</div>
          <div className="mt-5 bg-slate-100 backdrop-blur-xl border border-slate-200 rounded-3xl px-5 py-4 w-full flex items-center gap-3.5 text-left">
           {photo ? <img src={photo} className="w-12 h-12 rounded-2xl object-cover" alt="" /> : <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} grid place-items-center text-sm font-bold text-white shrink-0`}>{initial}</div>}
           <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{simLabel} • {theme === "whatsapp" ? "WhatsApp" : "mobile"} • now</div>
            <div className="font-bold text-[15px] truncate">{name}</div>
            <div className="text-[12px] text-slate-500 font-mono">{displayNumber}</div>
           </div>
           <Phone size={18} className="text-emerald-300 animate-shake shrink-0" />
          </div>
          {tc !== "none" && <div className="mt-2">{tcBanner}</div>}
          <div className="mt-auto pb-8 w-full space-y-3">
           <p className="text-[11px] text-slate-500 font-bold tracking-widest uppercase animate-pulse">slide to answer →</p>
           <div className="relative h-[62px] rounded-full bg-slate-100 border border-slate-200 overflow-hidden backdrop-blur">
            <motion.div drag="x" dragConstraints={{ left: 0, right: 210 }} dragElastic={0.05}
             onDragEnd={(_, info) => { if (info.offset.x > 130 || info.velocity.x > 500) answer(); }}
             className="absolute left-1 top-1 w-[54px] h-[54px] rounded-full bg-emerald-500 grid place-items-center cursor-grab active:cursor-grabbing shadow-[0_0_25px_rgba(16,185,129,0.7)] z-10">
             <Phone size={22} className="text-white" />
            </motion.div>
            <div className="absolute inset-0 flex items-center justify-center pl-10 text-[13px] font-bold text-slate-500">Slide to Answer</div>
           </div>
           <div className="flex justify-center gap-3">
            <button onClick={() => decline(true)} className="flex items-center gap-1.5 text-[12px] font-bold bg-red-500/90 px-5 py-2.5 rounded-full"><PhoneOff size={14} /> Decline</button>
            <button onClick={answer} className="text-[12px] font-bold bg-slate-100 border border-slate-200 px-5 py-2.5 rounded-full">Tap to Answer</button>
           </div>
          </div>
         </div>
        ) : (
         /* APP INCOMING per theme */
         <div className="relative z-10 flex-1 flex flex-col items-center pt-8 px-6 text-center">
          <p className="text-[11px] font-bold tracking-[0.25em] uppercase text-slate-500">
           {theme === "whatsapp" ? "WHATSAPP AUDIO • incoming" : theme === "truecaller" ? "TRUECALLER • incoming" : theme === "samsung" ? "Incoming call" : theme === "pixel" ? "Incoming call" : "mobile"}
          </p>
          {theme === "truecaller" && (
           <div className={`mt-2 px-4 py-2 rounded-2xl text-[12px] font-bold border ${tc === "scam" ? "bg-red-600 text-white border-red-400" : tc === "spam" ? "bg-amber-400 text-black" : "bg-blue-600 text-white border-blue-400"}`}>
            {tc === "scam" ? " SCAM SUSPECTED — Be careful!" : tc === "spam" ? " 342 people reported SPAM" : tc === "verified" ? " Verified Business Account" : "Unknown • no reports yet"}
           </div>
          )}
          <div className="relative mt-5">
           <div className="absolute inset-0 rounded-full bg-slate-200 animate-pulse-ring" />
           <div className="absolute inset-0 rounded-full bg-slate-100 animate-pulse-ring-delay" />
           {photo ? <img src={photo} className="relative w-28 h-28 rounded-full object-cover shadow-2xl border-4 border-slate-200" alt="" />
            : <div className={`relative w-28 h-28 rounded-full bg-gradient-to-br ${gradient} grid place-items-center text-3xl font-bold text-white shadow-2xl`}>{initial}</div>}
          </div>
          <h2 className="mt-5 font-display text-[28px] font-extrabold text-white leading-tight px-4">{name}</h2>
          <p className="text-slate-500 font-mono text-[14px]">{displayNumber}</p>
          <div className="mt-1.5 text-[10px] font-bold text-slate-500">{simLabel} • {carrier}</div>
          <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold bg-slate-100 border border-slate-200 rounded-full px-3 py-1">
           <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" /> SIMULATION • PRANKX PRO V2
          </div>
          <div className="mt-auto pb-9 w-full">
           <div className="flex justify-center gap-8 text-[11px] text-slate-500 font-semibold mb-5">
            <button className="flex flex-col items-center gap-1 hover:text-white"><MessageSquare size={19} />Message</button>
            <button className="flex flex-col items-center gap-1 hover:text-white"><Clock size={19} />Remind</button>
            {theme === "whatsapp" && <button className="flex flex-col items-center gap-1 hover:text-white"><Video size={19} />Video</button>}
           </div>
           {theme === "samsung" ? (
            <div className="flex justify-between items-center px-8">
             <button onClick={() => decline(true)} className="flex flex-col items-center gap-1.5"><span className="w-[62px] h-[62px] rounded-full bg-red-500 grid place-items-center active:scale-90 transition"><PhoneOff size={24} className="text-white" /></span><span className="text-[11px] text-slate-600">Decline</span></button>
             <button onClick={answer} className="flex flex-col items-center gap-1.5"><span className="w-[62px] h-[62px] rounded-full bg-emerald-500 grid place-items-center active:scale-90 transition animate-shake"><Phone size={24} className="text-white" /></span><span className="text-[11px] text-slate-600">Accept</span></button>
            </div>
           ) : theme === "whatsapp" ? (
            <div className="bg-[#1f2c34]/90 backdrop-blur rounded-3xl p-4 flex items-center justify-between border border-slate-200">
             <button onClick={() => decline(true)} className="w-12 h-12 rounded-full bg-red-500 grid place-items-center active:scale-90 transition"><PhoneOff size={19} className="text-white" /></button>
             <div className="text-center"><div className="text-[12px] font-bold">Swipe up to answer</div><div className="text-[10px] text-slate-500">WhatsApp • End-to-end encrypted</div></div>
             <button onClick={answer} className="w-12 h-12 rounded-full bg-[#00a884] grid place-items-center active:scale-90 transition animate-shake"><Phone size={19} className="text-white" /></button>
            </div>
           ) : (
            <div className="flex justify-between px-4">
             <button onClick={() => decline(true)} className="flex flex-col items-center gap-2 group"><span className="w-[66px] h-[66px] rounded-full bg-red-500 grid place-items-center shadow-[0_0_30px_rgba(239,68,68,0.6)] group-active:scale-90 transition"><PhoneOff size={25} className="text-white" /></span><span className="text-[11px] text-slate-600 font-semibold">Decline</span></button>
             <button onClick={answer} className="flex flex-col items-center gap-2 group"><span className="w-[66px] h-[66px] rounded-full bg-emerald-500 grid place-items-center shadow-[0_0_30px_rgba(16,185,129,0.6)] animate-shake group-active:scale-90 transition"><Phone size={25} className="text-white" /></span><span className="text-[11px] text-slate-600 font-semibold">Accept</span></button>
            </div>
           )}
          </div>
         </div>
        )
       ) : (
        /* ACTIVE */
        <div className="relative z-10 flex-1 flex flex-col items-center pt-6 px-5">
         {photo ? <img src={photo} className="w-[68px] h-[68px] rounded-full object-cover shadow-xl border-2 border-white/25" alt="" />
          : <div className={`w-[68px] h-[68px] rounded-full bg-gradient-to-br ${gradient} grid place-items-center text-xl font-bold text-white shadow-xl`}>{initial}</div>}
         <h2 className="mt-2.5 font-display text-[22px] font-bold leading-none">{name}</h2>
         <p className="text-emerald-300 font-mono font-bold tabular-nums text-[15px] mt-0.5">{fmtTime(callSecs)}</p>
         <p className="text-[10px] text-slate-500 font-bold mt-0.5 flex items-center gap-1"><ShieldCheck size={10} /> Encrypted (spoof) • {speaker ? "Speaker" : "Earpiece"}{muted ? " • Muted" : ""}{ambience ? ` • ${ambience}` : ""}</p>

         <div className="mt-2.5 w-full max-w-[330px] bg-slate-100 backdrop-blur border border-slate-200 rounded-2xl px-3 py-2">
          <LiveWave active={!muted} />
          <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-widest px-0.5"><span> LIVE</span><span>{lines.length} script lines</span></div>
         </div>

         {showSubs && lines[scriptIdx] && (
          <motion.div key={scriptIdx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-2.5 w-full max-w-[330px] bg-slate-100 backdrop-blur border border-slate-200 rounded-2xl p-3 text-left">
           <div className="text-[9px] font-extrabold tracking-widest text-cyan-300 uppercase mb-0.5 flex items-center justify-between">
            <span>Caller says ({scriptIdx + 1}/{lines.length})</span>
            <span className="flex gap-1">
             <button onClick={() => speakLine(scriptIdx)} className="p-1 hover:bg-slate-100 rounded"><RotateCcw size={11} /></button>
             {scriptIdx < lines.length - 1 && <button onClick={() => speakLine(scriptIdx + 1)} className="p-1 hover:bg-slate-100 rounded"><SkipForward size={11} /></button>}
            </span>
           </div>
           <div className="text-[13px] text-white/95 leading-snug">“{lines[scriptIdx]}”</div>
           {!autoScript && scriptIdx < lines.length - 1 && <button onClick={() => speakLine(scriptIdx + 1)} className="mt-1.5 text-[11px] font-extrabold bg-slate-900 text-white px-3 py-1 rounded-full">Next line</button>}
          </motion.div>
         )}

         {/* ambience quick bar */}
         <div className="mt-2.5 flex gap-1.5 max-w-[330px] w-full overflow-x-auto pb-0.5">
          {AMBIENCES.map(a => {
           const Icon = AMBI_ICON[a.id];
           return (
            <button key={a.id} onClick={() => { if (ambience === a.id) { setAmbience(null); stopAmbience(); } else { setAmbience(a.id); startAmbience(a.id); } }}
             className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-extrabold border whitespace-nowrap ${ambience === a.id ? "bg-amber-300 text-black border-amber-300" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
             <Icon size={11} /> {a.name}
            </button>
           );
          })}
         </div>

         {showKeypad ? (
          <div className="mt-3 bg-slate-100 border border-slate-200 rounded-2xl p-3.5 w-full max-w-[250px]">
           <div className="h-7 text-center font-mono text-base tracking-[0.3em] text-white mb-1.5">{keypadVal || "—"}</div>
           <div className="grid grid-cols-3 gap-1.5">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map(k => (
             <button key={k} onClick={() => { playTap(); setKeypadVal(v => (v + k).slice(0, 12)); }} className="h-10 rounded-full bg-slate-100 hover:bg-slate-200 font-bold text-[14px]">{k}</button>
            ))}
           </div>
          </div>
         ) : (
          <div className="mt-3.5 grid grid-cols-4 gap-x-4 gap-y-3 w-full max-w-[300px]">
           {[
            { icon: muted ? MicOff : Mic, label: muted ? "Unmute" : "Mute", active: muted, fn: () => setMuted(!muted) },
            { icon: Grip, label: "Keypad", active: false, fn: () => setShowKeypad(true) },
            { icon: Volume2, label: "Speaker", active: speaker, fn: () => setSpeaker(!speaker) },
            { icon: showPrompter ? EyeOff : Eye, label: "Prompter", active: showPrompter, fn: () => setShowPrompter(!showPrompter) },
            { icon: videoOn ? VideoOff : Video, label: "Video", active: videoOn, fn: () => setVideoOn(!videoOn) },
            { icon: showSubs ? Subtitles : Subtitles, label: "Subs", active: showSubs, fn: () => setShowSubs(!showSubs) },
            { icon: autoScript ? Pause : Play, label: "Script", active: autoScript, fn: () => setAutoScript(!autoScript) },
            { icon: MessageSquare, label: "Chat", active: false, fn: () => playTap() },
           ].map((b, i) => (
            <button key={i} onClick={b.fn} className="flex flex-col items-center gap-1">
             <span className={`w-11 h-11 rounded-full grid place-items-center transition ${b.active ? "bg-slate-900 text-white" : "bg-slate-100 text-white hover:bg-slate-200 backdrop-blur"}`}><b.icon size={16} /></span>
             <span className="text-[9.5px] text-slate-600 font-bold">{b.label}</span>
            </button>
           ))}
          </div>
         )}

         {showPrompter && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-2.5 w-full max-w-[330px] bg-amber-300 text-black rounded-2xl p-3 text-left max-h-[132px] overflow-y-auto">
           <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-black tracking-widest uppercase">Notes for you</span>
            <div className="flex gap-1">
             {Object.keys(EXCUSES).map(c => (
              <button key={c} onClick={() => setPrompterCat(c)} className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${prompterCat === c ? "bg-black text-amber-300" : "bg-black/10"}`}>{c.slice(0, 4)}</button>
             ))}
            </div>
           </div>
           {EXCUSES[prompterCat].map((e, i) => (
            <div key={i} className="text-[12px] font-semibold leading-snug bg-black/8 border border-black/10 rounded-lg px-2 py-1.5 mb-1">• {e}</div>
           ))}
          </motion.div>
         )}

         <div className="mt-auto pb-7 flex flex-col items-center gap-1.5">
          {showKeypad && <button onClick={() => setShowKeypad(false)} className="text-[11px] font-bold text-slate-500 hover:text-white">Hide keypad</button>}
          <button onClick={endActive} className="w-[64px] h-[64px] rounded-full bg-red-500 grid place-items-center shadow-[0_0_40px_rgba(239,68,68,0.7)] active:scale-90 transition rotate-[135deg]"><Phone size={25} className="text-white" /></button>
          <span className="text-[11px] text-slate-500 font-bold">End • {fmtTime(callSecs)} • <button onClick={() => speakLine(scriptIdx)} className="underline">replay line</button></span>
         </div>
        </div>
       )}
      </motion.div>
     </motion.div>
    )}
   </AnimatePresence>
  </div>
 );
}

// re-export icons used in parent? (keeps tree-shake happy)
export { Star, Siren };
