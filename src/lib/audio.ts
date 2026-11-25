// PrankX Pro Ultra — ringtone + ambience + voice engine (100% WebAudio, no files)
let audioCtx: AudioContext | null = null;
let ringNodes: { osc: OscillatorNode; gain: GainNode }[] = [];
let ringTimer: number | null = null;
let vibrateTimer: number | null = null;
let ringVolume = 0.9;

function ctx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

export function setRingVolume(v: number) { ringVolume = v; }

export type RingtoneId = "iphone" | "classic" | "android" | "whatsapp" | "samsung" | "silent";

export const RINGTONES: { id: RingtoneId; name: string; desc: string }[] = [
  { id: "iphone", name: "iPhone Reflection", desc: "Soft marimba loop" },
  { id: "classic", name: "Classic Bell", desc: "Old school tring-tring" },
  { id: "android", name: "Pixel Chime", desc: "Modern digital" },
  { id: "whatsapp", name: "WhatsApp Call", desc: "WA style beeps" },
  { id: "samsung", name: "Samsung Over Horizon", desc: "Signature melody" },
  { id: "silent", name: "Silent + Vibrate", desc: "Vibration only" },
];

function playTone(freq: number, start: number, dur: number, type: OscillatorType = "sine", vol = 0.22) {
  const ac = ctx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const v = vol * ringVolume;
  gain.gain.setValueAtTime(0.0001, ac.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(Math.max(v, 0.0002), ac.currentTime + start + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + dur + 0.05);
  ringNodes.push({ osc, gain });
}

export function startRingtone(id: RingtoneId, vibrate = true) {
  stopRingtone();
  if (id === "silent") {
    if (vibrate && navigator.vibrate) {
      const pattern = [400, 300, 400, 300, 400];
      navigator.vibrate(pattern);
      vibrateTimer = window.setInterval(() => navigator.vibrate?.(pattern), 2200);
    }
    return;
  }
  const loop = () => {
    ringNodes = [];
    if (id === "iphone") {
      const seq = [659.25, 783.99, 987.77, 783.99];
      seq.forEach((f, i) => {
        playTone(f, i * 0.28, 0.55, "sine", 0.2);
        playTone(f * 2, i * 0.28, 0.3, "sine", 0.05);
      });
    } else if (id === "classic") {
      for (let i = 0; i < 6; i++) playTone(i % 2 === 0 ? 1450 : 1850, i * 0.22, 0.2, "square", 0.07);
    } else if (id === "android") {
      playTone(880, 0, 0.18, "triangle", 0.22);
      playTone(1174.66, 0.2, 0.18, "triangle", 0.22);
      playTone(1567.98, 0.4, 0.35, "triangle", 0.24);
      playTone(1567.98, 0.9, 0.35, "sine", 0.16);
    } else if (id === "whatsapp") {
      for (let i = 0; i < 3; i++) {
        playTone(1100, i * 0.55, 0.22, "sine", 0.22);
        playTone(900, i * 0.55 + 0.25, 0.22, "sine", 0.2);
      }
    } else if (id === "samsung") {
      const seq = [523.25, 587.33, 659.25, 783.99, 880, 783.99, 659.25];
      seq.forEach((f, i) => playTone(f, i * 0.22, 0.32, "triangle", 0.18));
    }
    if (vibrate && navigator.vibrate) {
      try { navigator.vibrate([300, 200, 300]); } catch {}
    }
  };
  loop();
  ringTimer = window.setInterval(loop, 2100);
}

export function stopRingtone() {
  if (ringTimer) { clearInterval(ringTimer); ringTimer = null; }
  if (vibrateTimer) { clearInterval(vibrateTimer); vibrateTimer = null; }
  try { navigator.vibrate?.(0); } catch {}
  ringNodes.forEach(({ osc, gain }) => {
    try { gain.gain.setTargetAtTime(0.0001, ctx().currentTime, 0.02); osc.stop(ctx().currentTime + 0.1); } catch {}
  });
  ringNodes = [];
}

// ---------- AMBIENCE SOUNDBOARD (fake background during call) ----------
export type AmbienceId = "traffic" | "office" | "airport" | "rain" | "crowd" | "club";

let ambCtx: { src: AudioBufferSourceNode; filter: BiquadFilterNode; gain: GainNode; extraTimer?: number } | null = null;

function noiseBuffer(ac: AudioContext, seconds = 2) {
  const buf = ac.createBuffer(1, ac.sampleRate * seconds, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

export const AMBIENCES: { id: AmbienceId; name: string; desc: string }[] = [
  { id: "traffic", name: "Traffic Jam", desc: "Horn + road noise" },
  { id: "office", name: "Busy Office", desc: "AC + chatter" },
  { id: "airport", name: "Airport", desc: "Announcements" },
  { id: "rain", name: "Heavy Rain", desc: "Rain + thunder" },
  { id: "crowd", name: "Market Crowd", desc: "Bazaar hustle" },
  { id: "club", name: "Club / Party", desc: "Bass + crowd" },
];

export function startAmbience(id: AmbienceId) {
  stopAmbience();
  try {
    const ac = ctx();
    const src = ac.createBufferSource();
    src.buffer = noiseBuffer(ac);
    src.loop = true;
    const filter = ac.createBiquadFilter();
    const gain = ac.createGain();
    const cfg: Record<AmbienceId, { type: BiquadFilterType; freq: number; vol: number }> = {
      traffic: { type: "lowpass", freq: 900, vol: 0.06 },
      office: { type: "bandpass", freq: 1200, vol: 0.035 },
      airport: { type: "lowpass", freq: 600, vol: 0.05 },
      rain: { type: "highpass", freq: 1800, vol: 0.07 },
      crowd: { type: "bandpass", freq: 800, vol: 0.08 },
      club: { type: "lowpass", freq: 220, vol: 0.11 },
    };
    const c = cfg[id];
    filter.type = c.type; filter.frequency.value = c.freq;
    gain.gain.value = c.vol;
    src.connect(filter).connect(gain).connect(ac.destination);
    src.start();
    // extra life: occasional beep/honk
    let extraTimer: number | undefined;
    if (id === "traffic" || id === "airport" || id === "club") {
      extraTimer = window.setInterval(() => {
        try {
          const o = ac.createOscillator(); const g = ac.createGain();
          o.type = id === "club" ? "sine" : "square";
          o.frequency.value = id === "traffic" ? (Math.random() > 0.5 ? 400 : 520) : id === "airport" ? 880 : 110;
          g.gain.setValueAtTime(0.03, ac.currentTime);
          g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + (id === "club" ? 0.4 : 0.25));
          o.connect(g).connect(ac.destination);
          o.start(); o.stop(ac.currentTime + 0.5);
        } catch {}
      }, id === "club" ? 600 : 2800);
    }
    ambCtx = { src, filter, gain, extraTimer };
  } catch {}
}

export function stopAmbience() {
  if (!ambCtx) return;
  try {
    if (ambCtx.extraTimer) clearInterval(ambCtx.extraTimer);
    ambCtx.gain.gain.setTargetAtTime(0.0001, ctx().currentTime, 0.15);
    const s = ambCtx.src;
    setTimeout(() => { try { s.stop(); } catch {} }, 400);
  } catch {}
  ambCtx = null;
}

// ---------- misc ----------
export function playMailPop() {
  const ac = ctx();
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(880, t);
  osc.frequency.setValueAtTime(1318.5, t + 0.08);
  g.gain.setValueAtTime(0.15, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
  osc.connect(g).connect(ac.destination);
  osc.start(t); osc.stop(t + 0.4);
}

export function playTap() {
  try {
    const ac = ctx();
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = "sine"; o.frequency.value = 700;
    g.gain.setValueAtTime(0.08, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.08);
    o.connect(g).connect(ac.destination);
    o.start(); o.stop(ac.currentTime + 0.1);
  } catch {}
}

export function speakAsCaller(text: string, isFemale = false, rate = 0.98) {
  try {
    window.speechSynthesis?.cancel();
    if (!text?.trim()) return;
    const u = new SpeechSynthesisUtterance(text.slice(0, 320));
    u.rate = rate; u.pitch = isFemale ? 1.25 : 0.82;
    const voices = window.speechSynthesis.getVoices();
    const en = voices.filter(v => v.lang.toLowerCase().startsWith("en"));
    const pick = en.find(v => v.name.toLowerCase().includes(isFemale ? "female" : "male")) || en.find(v => v.name.toLowerCase().includes("google")) || en[0] || voices[0];
    if (pick) u.voice = pick;
    window.speechSynthesis.speak(u);
  } catch {}
}

export function stopSpeak() {
  try { window.speechSynthesis?.cancel(); } catch {}
}
