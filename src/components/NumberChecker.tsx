import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Search, Radar, Phone, MapPin, Building2, Signal,
  AlertTriangle, CheckCircle2, Ban, Flag, History, Trash2, ChevronRight,
  Siren, Fingerprint, Globe, FileWarning, BadgeCheck, Sparkles, X, Copy, Share2
} from "lucide-react";
import { analyzeNumber, loadCommunity, saveReport, VERDICT_META, SEED_SCAM_DB, type CommunityEntry } from "../lib/numberIntel";
import { playTap, playMailPop } from "../lib/audio";

const QUICK_NUMBERS = [
  { n: "+91 98200 12345", l: "Sample mobile" },
  { n: "1401234567", l: "Promo header" },
  { n: "1800 266 00", l: "Toll-free" },
  { n: "+1 (404) 555-0132", l: "US lottery" },
  { n: "+234 801 234 5678", l: "419 scam" },
  { n: "1930", l: "Cyber helpline" },
];

export default function NumberChecker({ initialNumber }: { initialNumber?: string }) {
  const [input, setInput] = useState(initialNumber || "+91 ");
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [hasResult, setHasResult] = useState(false);
  const [community, setCommunity] = useState<CommunityEntry[]>(() => loadCommunity());
  const [history, setHistory] = useState<{ n: string; v: string; s: number; t: string }[]>(() => {
    try { return JSON.parse(localStorage.getItem("prankx_checks") || "[]"); } catch { return []; }
  });
  const [blocked, setBlocked] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("prankx_blocked") || "[]"); } catch { return []; }
  });
  const [reportMsg, setReportMsg] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (initialNumber && initialNumber.trim().length > 3) {
      setInput(initialNumber);
      runScan(initialNumber);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialNumber]);

  useEffect(() => { localStorage.setItem("prankx_checks", JSON.stringify(history.slice(0, 30))); }, [history]);
  useEffect(() => { localStorage.setItem("prankx_blocked", JSON.stringify(blocked)); }, [blocked]);
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const result = useMemo(() => analyzeNumber(input, community), [input, community]);
  const meta = VERDICT_META[result.verdict];
  const isBlocked = blocked.some(b => b.replace(/\D/g, "") === input.replace(/\D/g, ""));

  const runScan = (val?: string) => {
    const v = (val ?? input).trim();
    if (!v || v.replace(/\D/g, "").length < 5) return;
    playTap();
    setHasResult(false); setScanning(true); setScanStep(0);
    const steps = [0, 1, 2, 3];
    let i = 0;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      i += 1;
      if (i >= steps.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        setScanning(false); setHasResult(true); playMailPop();
        setHistory(h => [{ n: v, v: analyzeNumber(v, loadCommunity()).verdict, s: analyzeNumber(v, loadCommunity()).score, t: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }, ...h].slice(0, 30));
      } else setScanStep(i);
    }, 550);
  };

  const doReport = (tag: string) => {
    playTap();
    saveReport(input, tag);
    setCommunity(loadCommunity());
    setReportMsg(`Thanks! Your "${tag}" report was added to the on-device community database.`);
    setTimeout(() => setReportMsg(null), 4000);
  };

  const toggleBlock = () => {
    playTap();
    const norm = input.trim();
    setBlocked(b => isBlocked ? b.filter(x => x.replace(/\D/g, "") !== norm.replace(/\D/g, "")) : [norm, ...b].slice(0, 50));
  };

  const steps = ["Validating format", "Checking series & operator", "Searching community reports", "Scoring risk patterns"];

  return (
    <div className="grid lg:grid-cols-[420px_1fr] gap-6">
      {/* LEFT: INPUT */}
      <div className="rounded-3xl glass p-6 space-y-5 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/15 blur-[80px] rounded-full pointer-events-none" />
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-emerald-300 uppercase"><Radar size={13} /> Number Check</div>
            <h3 className="font-display text-xl font-bold mt-1">Check any number</h3>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-300 to-cyan-600 grid place-items-center shadow-lg"><ShieldCheck size={18} className="text-black" /></div>
        </div>

        <div className="bg-slate-100 border border-slate-200 rounded-2xl p-1.5 flex items-center gap-2 focus-within:border-emerald-300/60 transition">
          <div className="w-10 h-11 rounded-xl bg-slate-100 grid place-items-center shrink-0"><Phone size={17} className="text-emerald-300" /></div>
          <input value={input} onChange={e => { setInput(e.target.value); setHasResult(false); }} onKeyDown={e => e.key === "Enter" && runScan()}
            placeholder="+91 98200 12345" inputMode="tel"
            className="flex-1 bg-transparent outline-none font-mono font-bold text-[17px] tracking-wide placeholder:text-white/25 placeholder:font-sans placeholder:font-medium placeholder:text-[14px]" />
          {input && <button onClick={() => setInput("")} className="p-2 text-slate-400 hover:text-white"><X size={15} /></button>}
        </div>

        <motion.button whileTap={{ scale: 0.97 }} onClick={() => runScan()}
          className="w-full py-4 rounded-2xl font-display font-semibold text-white bg-slate-900 hover:bg-slate-700 text-[15px] flex items-center justify-center gap-2">
          <Search size={18} strokeWidth={2.6} /> {scanning ? "Checking..." : "Check Number"}
        </motion.button>

        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Try one-tap samples</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_NUMBERS.map(q => (
              <button key={q.n} onClick={() => { setInput(q.n); runScan(q.n); }}
                className="px-2.5 py-1.5 rounded-full text-[11px] font-bold bg-slate-100 border border-slate-200 hover:bg-slate-100 transition">{q.l} • <span className="font-mono opacity-70">{q.n}</span></button>
            ))}
          </div>
        </div>

        {/* scanning animation */}
        <AnimatePresence>
          {scanning && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl bg-slate-100 border border-emerald-300/25 p-4 overflow-hidden relative">
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 shrink-0">
                  <div className="absolute inset-0 rounded-full border-2 border-emerald-300/30" />
                  <div className="absolute inset-0 rounded-full border-t-2 border-emerald-300 animate-spin" />
                  <Radar size={20} className="absolute inset-0 m-auto text-emerald-300" />
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-extrabold text-emerald-200">{steps[scanStep]}…</div>
                  <div className="h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                    <motion.div className="h-full bg-gradient-to-r from-emerald-300 to-cyan-300" animate={{ width: `${((scanStep + 1) / 4) * 100}%` }} />
                  </div>
                </div>
                <span className="font-display font-black text-emerald-300 text-xl">{scanStep + 1}/4</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {reportMsg && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-emerald-400/15 border border-emerald-300/30 text-emerald-200 text-[12px] font-bold p-3 flex gap-2">
            <CheckCircle2 size={15} className="shrink-0 mt-0.5" /> {reportMsg}
          </motion.div>
        )}

        {/* history */}
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><History size={12} /> Recent checks ({history.length})</p>
          <div className="space-y-1.5 max-h-[170px] overflow-y-auto pr-1">
            {history.length === 0 && <p className="text-[12px] text-slate-400 bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">No checks yet. Scan your first number above.</p>}
            {history.map((h, i) => {
              const m = VERDICT_META[h.v as keyof typeof VERDICT_META];
              return (
                <button key={i} onClick={() => { setInput(h.n); runScan(h.n); }} className="w-full flex items-center gap-2.5 bg-slate-50 hover:bg-white/[0.08] border border-slate-200 rounded-xl px-3 py-2 text-left transition">
                  <span class="w-7 h-7 rounded-full bg-slate-900 text-white grid place-items-center text-[11px] font-bold shrink-0">{h.s}</span>
                  <span className="flex-1 min-w-0"><span className="block text-[12.5px] font-bold font-mono truncate">{h.n}</span><span className="text-[10.5px] text-slate-500">{h.t} • Risk {h.s}/100</span></span>
                  <ChevronRight size={14} className="text-white/30" />
                </button>
              );
            })}
          </div>
          {history.length > 0 && <button onClick={() => { setHistory([]); localStorage.removeItem("prankx_checks"); }} className="mt-2 text-[11px] font-bold text-slate-400 hover:text-white flex items-center gap-1"><Trash2 size={11} /> Clear history</button>}
        </div>
      </div>

      {/* RIGHT: RESULT */}
      <div className="rounded-3xl glass p-6 relative overflow-hidden min-h-[600px]">
        <div className="absolute -top-28 right-0 w-96 h-96 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />
        {!hasResult && !scanning ? (
          <div className="h-full min-h-[480px] grid place-items-center text-center relative">
            <div>
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-emerald-400/20 to-cyan-500/10 border border-emerald-300/25 grid place-items-center mb-4 animate-float"><Fingerprint size={34} className="text-emerald-300" /></div>
              <h4 className="font-display font-bold text-xl">Paste a number to reveal the truth</h4>
              <p className="text-[13px] text-slate-500 max-w-[420px] mt-2 leading-relaxed">The lab checks format, operator series, community reports and 10+ scam patterns — then gives a clear verdict: <b className="text-white">Safe, Suspicious, Spam, Scam or Fake.</b></p>
              <div className="grid sm:grid-cols-3 gap-2.5 mt-5 max-w-[560px] mx-auto text-left">
                {[
                  { icon: Fingerprint, t: "Format + series", d: "Country, circle, operator and line type in 1 second." },
                  { icon: Siren, t: "Scam patterns", d: "Lottery, OTP, KYC, Wangiri callback traps detected." },
                  { icon: Globe, t: "Community DB", d: "Seeded scam database plus your own on-device reports." },
                ].map((f, i) => (
                  <div key={i} className="rounded-2xl bg-slate-100 border border-slate-200 p-3.5"><f.icon size={17} className="text-emerald-300 mb-1.5" /><div className="text-[12.5px] font-bold">{f.t}</div><div className="text-[11.5px] text-slate-500 mt-0.5 leading-relaxed">{f.d}</div></div>
                ))}
              </div>
              <p className="text-[11px] text-white/30 mt-5 max-w-[480px] mx-auto">Educational detector — it finds suspicious patterns offline. It is not a live Truecaller lookup. When money is involved, always verify through official apps.</p>
            </div>
          </div>
        ) : scanning ? (
          <div className="h-full min-h-[480px] grid place-items-center"><p className="text-slate-400 text-sm font-bold animate-pulse">Analyzing digits, series and reports…</p></div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative">
            {/* verdict hero */}
            <div className={`rounded-3xl bg-gradient-to-br ${meta.bg} p-[1.5px]`}>
              <div className="rounded-3xl bg-[#0a0f1e] p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${meta.bg} grid place-items-center shadow-xl shrink-0`}><ShieldCheck size={28} className="text-white" /></div>
                  <div className="flex-1 min-w-[180px]">
                    <div className="text-[11px] font-extrabold tracking-[0.2em] text-slate-500 uppercase">Verdict • {result.confidence}% confidence</div>
                    <div className={`font-display font-black text-[30px] leading-none ${meta.color}`}>{meta.label}</div>
                    <div className="text-[12.5px] text-slate-500 mt-1">{meta.desc}</div>
                  </div>
                  <div className="text-center shrink-0">
                    <div className="relative w-[92px] h-[92px]">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
                        <motion.circle cx="50" cy="50" r="42" fill="none" strokeWidth="10" strokeLinecap="round"
                          stroke={result.score >= 70 ? "#f87171" : result.score >= 40 ? "#fbbf24" : "#34d399"}
                          initial={{ strokeDashoffset: 264 }} animate={{ strokeDashoffset: 264 - (264 * result.score) / 100 }} transition={{ duration: 1, ease: "easeOut" }}
                          strokeDasharray="264" />
                      </svg>
                      <div className="absolute inset-0 grid place-items-center"><div><div className="font-display font-black text-[22px] leading-none">{result.score}</div><div className="text-[9px] font-bold text-slate-500">RISK / 100</div></div></div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 font-mono font-bold text-[15px] bg-white/5 border border-slate-200 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2 flex-wrap">
                  <span>{result.formatted}</span>
                  <span className="flex gap-1.5">
                    <button onClick={() => { navigator.clipboard?.writeText(result.formatted); playTap(); }} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200" title="Copy"><Copy size={13} /></button>
                    <button onClick={toggleBlock} className={`flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg transition ${isBlocked ? "bg-red-500 text-white" : "bg-slate-100 hover:bg-slate-200"}`}><Ban size={12} /> {isBlocked ? "Blocked" : "Block"}</button>
                  </span>
                </div>
                {isBlocked && <p className="text-[11px] font-bold text-red-300 mt-2 flex items-center gap-1"><Ban size={11} /> This number is on your on-device blocklist.</p>}
              </div>
            </div>

            {/* details grid */}
            <div className="grid sm:grid-cols-4 gap-2.5 mt-4">
              {[
                { icon: Globe, l: "Country", v: result.country },
                { icon: MapPin, l: "Circle / Region", v: result.circle },
                { icon: Building2, l: "Operator guess", v: result.operator },
                { icon: Signal, l: "Line type", v: result.lineType },
              ].map((d, i) => (
                <div key={i} className="rounded-2xl bg-slate-100 border border-slate-200 p-3.5"><d.icon size={15} className="text-cyan-300 mb-1.5" /><div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{d.l}</div><div className="text-[12.5px] font-bold mt-0.5 leading-snug">{d.v}</div></div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-3 mt-3">
              <div className="rounded-2xl bg-slate-100 border border-slate-200 p-4">
                <p className="text-[11px] font-extrabold tracking-widest text-slate-500 uppercase mb-2.5 flex items-center gap-1.5"><Sparkles size={12} /> Why this verdict</p>
                <div className="space-y-1.5">
                  {result.reasons.map((r, i) => (
                    <div key={i} className={`flex gap-2 text-[12.5px] leading-snug rounded-xl px-2.5 py-2 border ${r.good ? "bg-emerald-400/8 border-emerald-300/20 text-emerald-100/90" : "bg-red-400/8 border-red-300/20 text-red-100/90"}`}>
                      {r.good ? <CheckCircle2 size={14} className="text-emerald-300 shrink-0 mt-0.5" /> : <AlertTriangle size={14} className="text-amber-300 shrink-0 mt-0.5" />}
                      {r.label}
                    </div>
                  ))}
                </div>
                {result.patterns.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {result.patterns.map((p, i) => <span key={i} className="text-[10.5px] font-bold bg-fuchsia-400/10 border border-fuchsia-300/25 text-fuchsia-200 px-2 py-1 rounded-full">{p}</span>)}
                  </div>
                )}
              </div>
              <div className="rounded-2xl bg-gradient-to-b from-emerald-400/10 to-transparent border border-emerald-300/20 p-4">
                <p className="text-[11px] font-extrabold tracking-widest text-emerald-300 uppercase mb-2.5 flex items-center gap-1.5"><BadgeCheck size={12} /> What to do now</p>
                <div className="space-y-1.5">
                  {result.advice.map((a, i) => (
                    <div key={i} className="flex gap-2 text-[12.5px] text-white/75 leading-snug bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-2"><span className="w-5 h-5 rounded-md bg-emerald-400 text-black grid place-items-center text-[11px] font-black shrink-0">{i + 1}</span>{a}</div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <span className="text-[11px] font-bold text-slate-500 w-full">Report this number (saved on this device):</span>
                  {["Spam", "Scam", "Telemarketing", "Safe"].map(t => (
                    <button key={t} onClick={() => doReport(t)} className="px-2.5 py-1.5 rounded-full text-[11px] font-extrabold border border-slate-200 hover:bg-slate-100 transition flex items-center gap-1"><Flag size={11} /> {t}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* community */}
            <div className="rounded-2xl bg-slate-100 border border-slate-200 p-4 mt-3">
              <p className="text-[11px] font-extrabold tracking-widest text-slate-500 uppercase mb-2 flex items-center gap-1.5"><FileWarning size={12} /> Known risky numbers (demo database)</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {SEED_SCAM_DB.slice(0, 6).map((c, i) => (
                  <button key={i} onClick={() => { setInput(c.number); runScan(c.number); }} className="shrink-0 min-w-[190px] text-left rounded-xl bg-slate-50 hover:bg-white/[0.09] border border-slate-200 p-3 transition">
                    <div className="font-mono font-bold text-[12px]">{c.number}</div>
                    <div className="text-[10.5px] text-red-300 font-bold mt-0.5">{c.reports.toLocaleString()} reports</div>
                    <div className="text-[10.5px] text-slate-500 truncate">{c.tags.join(" • ")}</div>
                  </button>
                ))}
              </div>
              {blocked.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1"><Share2 size={11} /> Your blocklist ({blocked.length}):</span>
                  {blocked.map((b, i) => (
                    <span key={i} className="text-[11px] font-mono font-bold bg-red-500/15 border border-red-400/30 text-red-200 px-2 py-1 rounded-full flex items-center gap-1">{b}
                      <button onClick={() => setBlocked(bb => bb.filter((_, j) => j !== i))}><X size={11} /></button></span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
