import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PhoneCall, History, Play, Trash2, PhoneMissed, CheckCheck, X, Radar
} from "lucide-react";
import FakeCall, { type CallLog } from "./components/FakeCall";
import FakeGmail from "./components/FakeGmail";
import NumberChecker from "./components/NumberChecker";

type Tab = "call" | "gmail" | "scanner";

export default function App() {
  const [tab, setTab] = useState<Tab>("call");
  const [scannerNumber, setScannerNumber] = useState("");
  const [callLogs, setCallLogs] = useState<CallLog[]>(() => {
    try { return JSON.parse(localStorage.getItem("prankx_calls") || "[]"); } catch { return []; }
  });
  const [mailCount, setMailCount] = useState(() => Number(localStorage.getItem("prankx_mails") || 0));
  const [showHistory, setShowHistory] = useState(false);
  const [showSafety, setShowSafety] = useState(false);

  const checkNumber = (num: string) => {
    setScannerNumber(num);
    setTab("scanner");
    setTimeout(() => document.getElementById("lab")?.scrollIntoView({ behavior: "smooth" }), 60);
  };

  useEffect(() => {
    localStorage.setItem("prankx_calls", JSON.stringify(callLogs));
  }, [callLogs]);
  useEffect(() => {
    localStorage.setItem("prankx_mails", String(mailCount));
  }, [mailCount]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      if (e.key.toLowerCase() === "c") setTab("call");
      if (e.key.toLowerCase() === "g") setTab("gmail");
      if (e.key.toLowerCase() === "s") setTab("scanner");
      if (e.key === "Escape") { setShowHistory(false); setShowSafety(false); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const pushLog = (l: CallLog) => setCallLogs(prev => [l, ...prev].slice(0, 50));

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-[60] bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-slate-900 grid place-items-center">
              <PhoneCall size={17} className="text-white" />
            </div>
            <div className="leading-tight">
              <div className="font-bold text-[16px]">PrankX Pro</div>
              <div className="text-[11px] text-slate-500">Call • Gmail • Number Check</div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-1 ml-6 bg-slate-100 rounded-full p-1">
            <button onClick={() => setTab("call")} className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition ${tab === "call" ? "bg-white shadow text-slate-900" : "text-slate-500"}`}>
              Fake Call
            </button>
            <button onClick={() => setTab("gmail")} className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition ${tab === "gmail" ? "bg-white shadow text-slate-900" : "text-slate-500"}`}>
              Fake Gmail
            </button>
            <button onClick={() => setTab("scanner")} className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition ${tab === "scanner" ? "bg-slate-900 shadow text-white" : "text-slate-500"}`}>
              Number Check
            </button>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setShowHistory(true)} className="flex items-center gap-1.5 text-[13px] font-semibold px-3.5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 transition">
              <History size={14} /> History
            </button>
          </div>
        </div>
        <div className="md:hidden px-4 pb-3 flex gap-2">
          <button onClick={() => setTab("call")} className={`flex-1 py-2 rounded-lg text-[13px] font-semibold ${tab === "call" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}>Call</button>
          <button onClick={() => setTab("gmail")} className={`flex-1 py-2 rounded-lg text-[13px] font-semibold ${tab === "gmail" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}>Gmail</button>
          <button onClick={() => setTab("scanner")} className={`flex-1 py-2 rounded-lg text-[13px] font-semibold ${tab === "scanner" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}>Check</button>
        </div>
      </header>

      {/* Simple title */}
      <section className="max-w-6xl mx-auto px-4 pt-8 pb-4">
        <h1 className="text-[28px] sm:text-[36px] font-bold tracking-tight">
          {tab === "call" && "Fake Call Studio"}
          {tab === "gmail" && "Fake Gmail Studio"}
          {tab === "scanner" && "Number Safety Check"}
        </h1>
        <p className="text-slate-500 text-[14px] mt-1">
          {tab === "call" && "Create a realistic incoming call for fun and videos."}
          {tab === "gmail" && "Create a realistic demo email for videos."}
          {tab === "scanner" && "Enter any number to check if it looks safe, spam or fake."}
        </p>
        {tab === "call" && (
          <button onClick={() => setTab("scanner")} className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-full transition">
            <Radar size={14} /> Check if a number is spam first
          </button>
        )}
      </section>

      {/* Lab */}
      <main id="lab" className="max-w-6xl mx-auto px-4 pb-10 scroll-mt-24">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {tab === "call" ? (
              <FakeCall onLog={pushLog} onCheckNumber={checkNumber} />
            ) : tab === "gmail" ? (
              <FakeGmail onNewMail={() => setMailCount(c => c + 1)} />
            ) : (
              <NumberChecker initialNumber={scannerNumber} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col sm:flex-row gap-2 items-center justify-between text-[12px] text-slate-500">
          <p>PrankX Pro — for fun and demos only. No real calls or emails are sent.</p>
          <button onClick={() => setShowSafety(true)} className="underline hover:text-slate-800">Safety rules</button>
        </div>
      </footer>

      {/* SOS */}
      <button onClick={() => { setTab("call"); document.getElementById("lab")?.scrollIntoView({ behavior: "smooth" }); }}
        className="fixed bottom-5 right-5 z-[70] bg-slate-900 text-white text-[13px] font-semibold px-4 py-3 rounded-2xl shadow-lg flex items-center gap-2 hover:bg-slate-700">
        <Play size={14} /> Quick Call
      </button>

      {/* History */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowHistory(false)} className="fixed inset-0 bg-black/40 z-[80]" />
            <motion.aside initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }} transition={{ type: "spring", damping: 30, stiffness: 280 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-[360px] bg-white border-l border-slate-200 z-[81] flex flex-col">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-[16px]">History</h3>
                  <p className="text-[12px] text-slate-500">{callLogs.length} calls • {mailCount} emails</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setCallLogs([]); setMailCount(0); }} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200" title="Clear"><Trash2 size={15} /></button>
                  <button onClick={() => setShowHistory(false)} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200"><X size={15} /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {callLogs.length === 0 && (
                  <p className="text-center text-slate-400 text-[13px] py-10">No calls yet.</p>
                )}
                {callLogs.map((l, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 grid place-items-center">
                      {l.type === "missed" ? <PhoneMissed size={16} className="text-red-500" /> : <CheckCheck size={16} className="text-green-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold truncate">{l.name}</div>
                      <div className="text-[11px] text-slate-500">{l.number} • {l.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Safety */}
      <AnimatePresence>
        {showSafety && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSafety(false)} className="fixed inset-0 bg-black/40 z-[82] grid place-items-center p-4" />
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              className="fixed z-[83] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[94%] max-w-[440px] rounded-2xl bg-white border border-slate-200 p-6 shadow-xl">
              <h3 className="font-bold text-[18px]">Simple safety rules</h3>
              <ul className="mt-3 space-y-2 text-[13px] text-slate-600 leading-relaxed list-disc pl-5">
                <li>Only for fun with friends and family, with their permission.</li>
                <li>Never use bank, police or OTP tricks to take money or data.</li>
                <li>Everything stays in your browser. Nothing is really sent.</li>
              </ul>
              <button onClick={() => setShowSafety(false)} className="mt-5 w-full py-3 rounded-xl bg-slate-900 text-white font-semibold text-sm">Got it</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
