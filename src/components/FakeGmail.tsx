import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Inbox, Star, Send, Trash2, Search, Menu, Plus, Paperclip,
  MoreVertical, Archive, Reply, Forward, ChevronLeft, AlertTriangle,
  BadgeCheck, Lock, Image as ImageIcon, X, BellRing, Sparkles, Zap, ShieldCheck, MailOpen
} from "lucide-react";
import { MAIL_TEMPLATES } from "../lib/data";
import { playMailPop, playTap } from "../lib/audio";

export type FakeMail = {
  id: string;
  from: string;
  email: string;
  subject: string;
  body: string;
  time: string;
  color: string;
  tag: string;
  unread: boolean;
  starred: boolean;
  important: boolean;
  attachment?: { name: string; size: string };
};

const seedMails: FakeMail[] = [
  {
    id: "seed1", from: "LinkedIn", email: "jobs@linkedin.com", subject: "You appeared in 14 searches this week",
    body: "Hi,\n\nRecruiters from Flipkart, Zomato and 12 others viewed your profile.\n\nSee who’s hiring for React developers in Mumbai — salaries up to ₹32 LPA.\n\n— LinkedIn (demo)",
    time: "9:41 AM", color: "bg-blue-700", tag: "Social", unread: true, starred: false, important: true,
  },
  {
    id: "seed2", from: "Swiggy", email: "noreply@swiggy.in", subject: "50% OFF ends tonight - your code: HUNGRY50",
    body: "Craving biryani?\n\nGet 50% OFF up to ₹120 on orders above ₹199. Code HUNGRY50. Valid till midnight.\n\nOrder now! (demo)",
    time: "8:15 AM", color: "bg-orange-600", tag: "Promotions", unread: true, starred: false, important: false,
  },
];

let uid = 100;
const nid = () => `m${Date.now()}${uid++}`;

export default function FakeGmail({ onNewMail }: { onNewMail: () => void }) {
  const [mails, setMails] = useState<FakeMail[]>(seedMails);
  const [tab, setTab] = useState<"inbox" | "starred" | "sent" | "trash">("inbox");
  const [trash, setTrash] = useState<FakeMail[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [toast, setToast] = useState<FakeMail | null>(null);

  // compose fields
  const [from, setFrom] = useState("Google Careers");
  const [email, setEmail] = useState("careers@google.com");
  const [subject, setSubject] = useState("Congratulations! You're shortlisted ");
  const [body, setBody] = useState("Hi there,\n\nGreat news! Your profile has been shortlisted...\n\nBest,\nHR Team");
  const [tag, setTag] = useState("Work");
  const [color, setColor] = useState("bg-blue-600");
  const [hasAttach, setHasAttach] = useState(true);
  const [attachName, setAttachName] = useState("Offer_Letter.pdf");
  const [starred, setStarred] = useState(false);
  const [delaySec, setDelaySec] = useState(3);

  const filtered = useMemo(() => {
    let list = tab === "trash" ? trash : mails;
    if (tab === "starred") list = mails.filter(m => m.starred);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(m => (m.from + m.subject + m.body + m.email).toLowerCase().includes(q));
    }
    return [...list].reverse();
  }, [mails, trash, tab, search]);

  const opened = mails.find(m => m.id === openId) || trash.find(m => m.id === openId) || null;
  const unreadCount = mails.filter(m => m.unread).length;

  const applyTemplate = (id: string) => {
    const t = MAIL_TEMPLATES.find(x => x.id === id);
    if (!t) return;
    playTap();
    setFrom(t.from); setEmail(t.email); setSubject(t.subject); setBody(t.body); setTag(t.tag); setColor(t.color);
    setShowCompose(true);
  };

  const deliver = (mail: FakeMail) => {
    setMails(prev => [...prev, mail]);
    onNewMail();
    playMailPop();
    setToast(mail);
    setTimeout(() => setToast(null), 5000);
  };

  const sendNow = () => {
    playTap();
    const mail: FakeMail = {
      id: nid(),
      from: from || "Unknown", email: email || "unknown@mail.com",
      subject: subject || "(no subject)", body: body || "",
      time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      color, tag, unread: true, starred, important: Math.random() > 0.5,
      attachment: hasAttach ? { name: attachName || "Document.pdf", size: `${(Math.random() * 4 + 0.4).toFixed(1)} MB` } : undefined,
    };
    if (delaySec <= 0) {
      deliver(mail);
    } else {
      setShowCompose(false);
      setTimeout(() => deliver(mail), delaySec * 1000);
    }
    setShowCompose(false);
  };

  const markRead = (id: string, v: boolean) =>
    setMails(prev => prev.map(m => m.id === id ? { ...m, unread: !v ? true : false } : m));

  const toggleStar = (id: string) =>
    setMails(prev => prev.map(m => m.id === id ? { ...m, starred: !m.starred } : m));

  const toTrash = (id: string) => {
    const m = mails.find(x => x.id === id);
    if (!m) return;
    setMails(prev => prev.filter(x => x.id !== id));
    setTrash(prev => [m, ...prev]);
    setOpenId(null);
  };

  return (
    <div className="grid lg:grid-cols-[400px_1fr] gap-6">
      {/* LEFT: COMPOSER CONTROL */}
      <div className="rounded-3xl glass p-6 space-y-5 relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-amber-400/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-amber-300 uppercase"><Zap size={13} /> New Email</div>
            <h3 className="font-display text-xl font-bold mt-1">Write an email</h3>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-300 to-rose-500 grid place-items-center shadow-lg">
            <Inbox size={18} className="text-black" />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2"> Examples</p>
          <div className="grid grid-cols-2 gap-2">
            {MAIL_TEMPLATES.map(t => (
              <button key={t.id} onClick={() => applyTemplate(t.id)}
                className="text-left rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white/[0.09] p-3 transition group">
                <div className={`w-7 h-7 rounded-lg ${t.color} grid place-items-center text-white text-sm font-black mb-1.5`}>{t.from[0]}</div>
                <div className="text-[12px] font-bold leading-tight">{t.label}</div>
                <div className="text-[11px] text-slate-500 truncate">{t.subject}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase">From name</label>
              <input value={from} onChange={e => setFrom(e.target.value)} className="mt-1 w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-amber-300/60" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase">From email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-[13px] font-mono outline-none focus:border-amber-300/60" />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase">Subject line</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} className="mt-1 w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:border-amber-300/60" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase">Body</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={5} className="mt-1 w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] leading-relaxed outline-none focus:border-amber-300/60 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase">Label</label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {["Work", "Finance", "Personal", "Promotions", "Security", "Social"].map(l => (
                  <button key={l} onClick={() => setTag(l)} className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${tag === l ? "bg-amber-300 text-black border-amber-300" : "border-slate-200 text-slate-500 hover:bg-slate-100"}`}>{l}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase">Avatar color</label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {["bg-blue-600", "bg-emerald-600", "bg-orange-600", "bg-pink-600", "bg-violet-600", "bg-zinc-900", "bg-red-600", "bg-cyan-600"].map(c => (
                  <button key={c} onClick={() => setColor(c)} className={`w-7 h-7 rounded-full ${c} border-2 ${color === c ? "border-white scale-110" : "border-slate-200"} transition`} />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
            <input type="checkbox" checked={hasAttach} onChange={e => setHasAttach(e.target.checked)} className="accent-amber-300 w-4 h-4" />
            <Paperclip size={14} className="text-slate-500" />
            <input value={attachName} onChange={e => setAttachName(e.target.value)} disabled={!hasAttach} placeholder="Offer_Letter.pdf"
              className="flex-1 bg-transparent text-[13px] outline-none font-semibold disabled:opacity-40" />
            <button onClick={() => setStarred(!starred)} className={`p-1.5 rounded-lg ${starred ? "text-amber-300" : "text-white/30"}`}><Star size={16} fill={starred ? "currentColor" : "none"} /></button>
          </div>

          <div className="flex items-center gap-3 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5">
            <span className="text-[12px] font-bold text-slate-500 whitespace-nowrap">Arrives in</span>
            <input type="range" min={0} max={30} value={delaySec} onChange={e => setDelaySec(Number(e.target.value))} className="flex-1 accent-amber-300" />
            <span className="text-sm font-mono font-bold bg-slate-100 px-2 py-1 rounded-lg min-w-[52px] text-center">{delaySec}s</span>
          </div>

          <motion.button whileTap={{ scale: 0.97 }} onClick={sendNow}
            className="w-full py-4 rounded-2xl font-display font-semibold text-white bg-slate-900 hover:bg-slate-700 flex items-center justify-center gap-2 text-[15px]">
            <Send size={17} strokeWidth={2.6} /> {delaySec === 0 ? "Send Now" : `Send in ${delaySec}s + NOTIFY`}
          </motion.button>
          <p className="text-[11px] text-slate-400 flex gap-1.5 leading-relaxed"><ShieldCheck size={13} className="mt-0.5 shrink-0" /> Demo inbox only — nothing is really sent. Perfect for Reels showing “I got the job!” reactions.</p>
        </div>
      </div>

      {/* RIGHT: GMAIL CLONE */}
      <div className="rounded-3xl overflow-hidden border border-slate-200 bg-[#f6f8fc] text-slate-800 shadow-2xl flex flex-col min-h-[640px]">
        {/* gmail topbar */}
        <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center gap-3">
          <Menu size={18} className="text-slate-500" />
          <div className="flex items-center gap-2 font-semibold text-[19px]">
            <span className="font-display"><span className="text-blue-600">G</span><span className="text-red-500">m</span><span className="text-amber-500">a</span><span className="text-blue-600">i</span><span className="text-emerald-600">l</span></span>
            <span className="hidden sm:inline text-[10px] font-bold bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white px-1.5 py-0.5 rounded-md">PRANK SIM</span>
          </div>
          <div className="flex-1 max-w-[520px] mx-auto">
            <div className="flex items-center gap-2 bg-[#eef3fc] hover:bg-slate-100 rounded-full px-4 py-2 transition">
              <Search size={16} className="text-slate-500 shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search mail (try 'Google' or 'OTP')" className="bg-transparent outline-none text-sm w-full placeholder:text-slate-500" />
              {search && <button onClick={() => setSearch("")}><X size={14} /></button>}
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white grid place-items-center text-sm font-bold shrink-0">Y</div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* sidebar */}
          <div className="w-[52px] sm:w-[200px] bg-white border-r border-slate-200 p-2 space-y-1 shrink-0">
            <button onClick={() => { playTap(); setShowCompose(true); }} className="w-full flex items-center justify-center sm:justify-start gap-2 bg-[#c2e7ff] hover:shadow-md rounded-2xl px-3 py-3 font-bold text-sm mb-3 transition">
              <Plus size={18} /> <span className="hidden sm:inline">Compose</span>
            </button>
            {[
              { id: "inbox" as const, icon: Inbox, label: "Inbox", count: unreadCount },
              { id: "starred" as const, icon: Star, label: "Starred", count: mails.filter(m => m.starred).length },
              { id: "sent" as const, icon: Send, label: "Sent", count: 0 },
              { id: "trash" as const, icon: Trash2, label: "Trash", count: trash.length },
            ].map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setOpenId(null); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-full text-sm transition ${tab === t.id ? "bg-[#d3e3fd] font-bold" : "hover:bg-slate-100 text-slate-600"}`}>
                <t.icon size={17} /> <span className="hidden sm:inline flex-1 text-left">{t.label}</span>
                {t.count > 0 && <span className="hidden sm:inline text-[11px] font-bold">{t.count}</span>}
              </button>
            ))}
            <div className="hidden sm:block pt-4 px-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Labels</p>
              {["Work", "Finance", "Personal", "Promotions"].map(l => (
                <div key={l} className="flex items-center gap-2 text-[13px] text-slate-600 py-1"><span className="w-2.5 h-2.5 rounded-sm bg-slate-300" />{l}</div>
              ))}
              <div className="mt-4 rounded-xl bg-gradient-to-br from-slate-900 to-indigo-900 text-white p-3 text-[11px] leading-relaxed">
                <div className="font-bold flex items-center gap-1 mb-1"><Sparkles size={12} /> Pro tip</div>
                Open a mail fullscreen & screen-record for 100% real-looking Reels.
              </div>
            </div>
          </div>

          {/* list / reading */}
          <div className="flex-1 flex flex-col min-w-0 bg-white">
            {!opened ? (
              <>
                <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-100 text-slate-400">
                  <input type="checkbox" className="accent-blue-600" readOnly checked={false} />
                  <Archive size={16} className="hover:text-slate-700 cursor-pointer" />
                  <AlertTriangle size={16} className="hover:text-slate-700 cursor-pointer" />
                  <Trash2 size={16} className="hover:text-slate-700 cursor-pointer" />
                  <span className="ml-auto text-[12px] font-semibold text-slate-500">{filtered.length} mails • Demo inbox</span>
                </div>
                <div className="flex-1 overflow-y-auto gmail-scroll max-h-[520px]">
                  {filtered.length === 0 && (
                    <div className="py-16 text-center text-slate-400">
                      <MailOpen size={36} className="mx-auto mb-3 opacity-40" />
                      <p className="font-semibold text-sm">No mails here yet</p>
                      <p className="text-xs">Forge one from the left panel →</p>
                    </div>
                  )}
                  <AnimatePresence initial={false}>
                    {filtered.map(m => (
                      <motion.div key={m.id} layout initial={{ opacity: 0, x: 20, backgroundColor: "#fef9c3" }} animate={{ opacity: 1, x: 0, backgroundColor: "transparent" }}
                        onClick={() => { setOpenId(m.id); setMails(prev => prev.map(x => x.id === m.id ? { ...x, unread: false } : x)); }}
                        className={`group flex items-center gap-3 px-4 py-3 border-b border-slate-100 cursor-pointer hover:shadow-[inset_0_0_0_999px_rgba(0,0,0,0.03)] transition ${m.unread ? "bg-white" : "bg-[#f2f6fc]"}`}>
                        <button onClick={e => { e.stopPropagation(); toggleStar(m.id); }} className={m.starred ? "text-amber-400" : "text-slate-300 hover:text-amber-300"}>
                          <Star size={17} fill={m.starred ? "currentColor" : "none"} />
                        </button>
                        <div className={`w-9 h-9 rounded-full ${m.color} text-white grid place-items-center font-bold text-[15px] shrink-0`}>{m.from[0]}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className={`text-[13.5px] truncate ${m.unread ? "font-bold text-slate-900" : "font-medium text-slate-600"}`}>{m.from}</span>
                            <span className="hidden md:inline text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{m.tag}</span>
                            {m.attachment && <Paperclip size={12} className="text-slate-400 shrink-0" />}
                            <span className="ml-auto text-[11px] text-slate-500 font-semibold shrink-0">{m.time}</span>
                          </div>
                          <div className={`text-[13px] truncate ${m.unread ? "font-bold text-slate-800" : "text-slate-500"}`}>{m.subject} <span className="font-normal text-slate-400">— {m.body.slice(0, 70)}</span></div>
                        </div>
                        <button onClick={e => { e.stopPropagation(); toTrash(m.id); }} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-slate-200 rounded-full transition"><Trash2 size={15} className="text-slate-500" /></button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="flex-1 overflow-y-auto gmail-scroll max-h-[560px]">
                <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-100 sticky top-0 bg-white/90 backdrop-blur z-10">
                  <button onClick={() => setOpenId(null)} className="p-2 hover:bg-slate-100 rounded-full"><ChevronLeft size={18} /></button>
                  <button className="p-2 hover:bg-slate-100 rounded-full"><Archive size={17} className="text-slate-600" /></button>
                  <button className="p-2 hover:bg-slate-100 rounded-full"><AlertTriangle size={17} className="text-slate-600" /></button>
                  <button onClick={() => toTrash(opened.id)} className="p-2 hover:bg-slate-100 rounded-full"><Trash2 size={17} className="text-slate-600" /></button>
                  <span className="ml-auto text-[11px] font-bold text-slate-400 hidden sm:inline">SIMULATED MESSAGE • NOT REALLY SENT</span>
                  <MoreVertical size={17} className="text-slate-400" />
                </div>
                <div className="px-5 sm:px-8 py-5">
                  <h1 className="text-[20px] sm:text-[24px] font-medium text-slate-900 leading-snug pr-8">{opened.subject}</h1>
                  <div className="flex items-center gap-3 mt-4 pb-4 border-b border-slate-100">
                    <div className={`w-10 h-10 rounded-full ${opened.color} text-white grid place-items-center font-bold text-lg`}>{opened.from[0]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-[14px]">{opened.from}</span>
                        {opened.email.includes("google") || opened.email.includes("hdfc") || opened.email.includes("apple") ? <BadgeCheck size={15} className="text-blue-600" /> : null}
                        <span className="text-[12px] text-slate-500">&lt;{opened.email}&gt;</span>
                      </div>
                      <div className="text-[12px] text-slate-500">to me <span className="underline">v</span></div>
                    </div>
                    <span className="text-[12px] text-slate-500">{opened.time}</span>
                    <Star size={17} className={opened.starred ? "text-amber-400" : "text-slate-300"} fill={opened.starred ? "currentColor" : "none"} />
                    <Reply size={17} className="text-slate-500" />
                    <MoreVertical size={16} className="text-slate-400" />
                  </div>
                  <div className="py-5 text-[14.5px] leading-[1.75] text-slate-800 whitespace-pre-line">{opened.body}</div>
                  {opened.attachment && (
                    <div className="flex items-center gap-3 border border-slate-200 rounded-xl p-3 max-w-[320px] hover:shadow-md transition cursor-pointer">
                      <div className="w-10 h-10 rounded-lg bg-red-100 grid place-items-center text-red-600 font-black text-xs">PDF</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold truncate">{opened.attachment.name}</div>
                        <div className="text-[11px] text-slate-500">{opened.attachment.size}</div>
                      </div>
                    </div>
                  )}
                  <div className="mt-6 flex gap-2">
                    <button className="flex items-center gap-2 border border-slate-300 rounded-full px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"><Reply size={15} /> Reply</button>
                    <button className="flex items-center gap-2 border border-slate-300 rounded-full px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"><Forward size={15} /> Forward</button>
                  </div>
                  <div className="mt-6 rounded-xl bg-amber-50 border border-amber-200 p-3 flex gap-2 text-[12px] text-amber-800">
                    <Lock size={14} className="mt-0.5 shrink-0" />
                    <span><b>PrankX demo mail.</b> This message lives only in your browser — nothing was sent or received over the internet. Use for skits & reactions with consent.</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* fake popup compose mini */}
        <AnimatePresence>
          {showCompose && (
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              className="absolute bottom-4 right-4 w-[92%] sm:w-[380px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-20 text-slate-800">
              <div className="bg-[#f2f6fc] px-4 py-2.5 flex items-center justify-between">
                <span className="text-[13px] font-bold">New Message — preview</span>
                <button onClick={() => setShowCompose(false)}><X size={16} /></button>
              </div>
              <div className="p-4 space-y-2 text-[13px]">
                <div className="flex gap-2 border-b border-slate-100 pb-2"><span className="text-slate-400">From</span><b>{from} &lt;{email}&gt;</b></div>
                <div className="font-bold">{subject || "(no subject)"}</div>
                <div className="text-slate-600 whitespace-pre-line max-h-[120px] overflow-y-auto">{body.slice(0, 300)}</div>
                <div className="flex gap-2 pt-2">
                  <button onClick={sendNow} className="px-5 py-2 rounded-full bg-blue-600 text-white text-[13px] font-bold hover:bg-blue-700">Send (simulate)</button>
                  <button onClick={() => setShowCompose(false)} className="px-4 py-2 text-[13px] text-slate-500 font-semibold">Close</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* OS-level toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ y: -80, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -80, opacity: 0 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[95] w-[94%] max-w-[420px] bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 p-3 flex gap-3 items-start">
            <div className={`w-10 h-10 rounded-full ${toast.color} text-white grid place-items-center font-bold shrink-0`}>{toast.from[0]}</div>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { setOpenId(toast.id); setToast(null); markRead(toast.id, true); }}>
              <div className="flex items-center gap-1.5 text-[12px] text-slate-500 font-semibold"><ImageIcon size={12} /> Gmail • now <BellRing size={12} className="text-amber-500" /></div>
              <div className="text-[13px] font-bold truncate">{toast.from}</div>
              <div className="text-[13px] truncate">{toast.subject}</div>
            </div>
            <button onClick={() => setToast(null)}><X size={15} className="text-slate-400" /></button>
            <div className="absolute bottom-0 left-3 right-3 h-[3px] bg-slate-100 rounded-full overflow-hidden">
              <motion.div initial={{ width: "100%" }} animate={{ width: "0%" }} transition={{ duration: 5, ease: "linear" }} className="h-full bg-blue-500" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
