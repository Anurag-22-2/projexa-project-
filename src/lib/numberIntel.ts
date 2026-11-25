// PrankX Number Intelligence — 100% offline heuristic engine + community DB simulation
// Honest scope: this is an educational pattern detector, not a real Truecaller lookup.

export type Verdict = "SAFE" | "LIKELY_SAFE" | "SUSPICIOUS" | "SPAM" | "SCAM" | "FAKE_SPOOF" | "INVALID";

export type IntelResult = {
  verdict: Verdict;
  score: number; // 0 = safe, 100 = dangerous
  confidence: number;
  country: string;
  countryCode: string;
  circle: string;
  operator: string;
  lineType: string;
  formatted: string;
  valid: boolean;
  reasons: { label: string; good: boolean }[];
  patterns: string[];
  advice: string[];
};

const INDIA_CIRCLES: Record<string, string> = {
  "981": "Delhi", "982": "Mumbai", "983": "Kolkata", "984": "Chennai", "985": "Maharashtra",
  "986": "Assam / NE", "987": "Punjab", "988": "Punjab", "989": "Delhi", "990": "Karnataka",
  "991": "Delhi", "992": "Mumbai", "993": "Bihar", "994": "Chennai", "995": "Delhi",
  "996": "Andhra Pradesh", "997": "Gujarat", "998": "Rajasthan", "999": "Delhi / Haryana",
  "900": "Mumbai", "901": "Delhi", "902": "Maharashtra", "903": "Karnataka", "904": "Tamil Nadu",
  "905": "Haryana", "906": "West Bengal", "907": "Kerala", "908": "Gujarat", "909": "Tamil Nadu",
};

const OPERATOR_SERIES: { prefix: string[]; op: string }[] = [
  { prefix: ["981", "989", "991", "995"], op: "Airtel (likely)" },
  { prefix: ["982", "992", "997"], op: "Vodafone Idea (likely)" },
  { prefix: ["983", "900", "983"], op: "Jio / Airtel (likely)" },
  { prefix: ["984", "994", "904"], op: "Airtel / Jio South (likely)" },
  { prefix: ["987", "988"], op: "Jio / Airtel Punjab (likely)" },
  { prefix: ["999", "995"], op: "Jio / Vi Delhi (likely)" },
];

// Seeded community scam DB (demo + education). Users can add their own reports (localStorage).
export type CommunityEntry = { number: string; reports: number; tags: string[]; lastSeen: string };

export const SEED_SCAM_DB: CommunityEntry[] = [
  { number: "+14045550132", reports: 4821, tags: ["Lottery scam", "International"], lastSeen: "2 days ago" },
  { number: "+924444444444", reports: 3120, tags: ["Prize fraud", "WhatsApp"], lastSeen: "5 hours ago" },
  { number: "+2348012345678", reports: 2954, tags: ["419 advance fee", "International"], lastSeen: "1 day ago" },
  { number: "+919820012345", reports: 12, tags: ["Telemarketing"], lastSeen: "3 weeks ago" },
  { number: "1401234567", reports: 8934, tags: ["Promo header", "Telemarketing"], lastSeen: "10 min ago" },
  { number: "+15551234567", reports: 1204, tags: ["Robocall", "VoIP"], lastSeen: "4 days ago" },
];

export function normalize(input: string): string {
  return input.replace(/[^\d+]/g, "").replace(/^(00)/, "+");
}

export function detectCountry(digits: string, raw: string): { country: string; code: string } {
  if (raw.trim().startsWith("+")) {
    if (raw.startsWith("+91")) return { country: "India", code: "+91" };
    if (raw.startsWith("+1")) return { country: "USA / Canada (NANP)", code: "+1" };
    if (raw.startsWith("+44")) return { country: "United Kingdom", code: "+44" };
    if (raw.startsWith("+92")) return { country: "Pakistan", code: "+92" };
    if (raw.startsWith("+234")) return { country: "Nigeria", code: "+234" };
    if (raw.startsWith("+880")) return { country: "Bangladesh", code: "+880" };
    if (raw.startsWith("+971")) return { country: "UAE", code: "+971" };
    if (raw.startsWith("+65")) return { country: "Singapore", code: "+65" };
    if (raw.startsWith("+61")) return { country: "Australia", code: "+61" };
    const m = raw.match(/^\+(\d{1,4})/);
    return { country: "International", code: m ? `+${m[1]}` : "+" };
  }
  if (/^(6|7|8|9)\d{9}$/.test(digits)) return { country: "India (assumed, 10-digit mobile)", code: "+91" };
  if (/^1800\d{4,7}$/.test(digits)) return { country: "India Toll-Free", code: "" };
  if (/^14\d{8}$/.test(digits)) return { country: "India Promo Header", code: "" };
  if (/^\d{5,6}$/.test(digits)) return { country: "Short Code", code: "" };
  return { country: "Unknown", code: "" };
}

function guessCircleOperator(indian10: string): { circle: string; operator: string } {
  const p = indian10.slice(0, 3);
  const circle = INDIA_CIRCLES[p] || "India (circle unknown)";
  const opHit = OPERATOR_SERIES.find(o => o.prefix.includes(p));
  return { circle, operator: opHit ? opHit.op : "Unknown operator (porting possible)" };
}

export function analyzeNumber(rawInput: string, community: CommunityEntry[]): IntelResult {
  const raw = rawInput.trim();
  const clean = normalize(raw);
  const digits = clean.replace(/\D/g, "");
  const { country, code } = detectCountry(digits, clean || raw);

  const reasons: { label: string; good: boolean }[] = [];
  const patterns: string[] = [];
  const advice: string[] = [];
  let score = 0;
  let verdict: Verdict = "LIKELY_SAFE";
  let valid = true;
  let lineType = "Unknown";
  let circle = "—";
  let operator = "—";
  let formatted = raw || "—";

  if (!raw || digits.length < 5) {
    return {
      verdict: "INVALID", score: 0, confidence: 100, country: "—", countryCode: "",
      circle: "—", operator: "—", lineType: "—", formatted: raw || "—", valid: false,
      reasons: [{ label: "Number is too short to analyze. Enter at least 5 digits.", good: false }],
      patterns: [], advice: ["Enter a full number with country code, for example +91 98200 12345."],
    };
  }

  // community hit?
  const normCompare = (a: string) => a.replace(/\D/g, "");
  const hit = community.find(c => normCompare(c.number) === digits || normCompare(c.number) === digits.slice(-10) || digits.endsWith(normCompare(c.number).slice(-7)));
  if (hit) {
    score += Math.min(55, 25 + hit.reports / 400);
    patterns.push(`Community reports: ${hit.reports.toLocaleString()} reports (${hit.tags.join(", ")})`);
    reasons.push({ label: `${hit.reports.toLocaleString()} users reported this number (${hit.tags.join(", ")}).`, good: false });
  }

  // formatting
  if (/^\+91[6-9]\d{9}$/.test(clean)) {
    valid = true; lineType = "Indian mobile (10-digit)";
    formatted = `+91 ${clean.slice(3, 8)} ${clean.slice(8)}`;
    const g = guessCircleOperator(clean.slice(3));
    circle = g.circle; operator = g.operator;
    reasons.push({ label: "Valid Indian 10-digit mobile format.", good: true });
  } else if (/^[6-9]\d{9}$/.test(digits) && !clean.startsWith("+")) {
    valid = true; lineType = "Indian mobile (10-digit, no code)";
    formatted = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    const g = guessCircleOperator(digits);
    circle = g.circle; operator = g.operator;
    reasons.push({ label: "Valid Indian mobile pattern. Country code assumed as +91.", good: true });
  } else if (/^1800\d{4,7}$/.test(digits)) {
    valid = true; lineType = "Toll-free helpline";
    score -= 25;
    reasons.push({ label: "1800 toll-free series — usually a real company helpline.", good: true });
    advice.push("Toll-free does not mean 100% safe — scammers sometimes spoof helplines. Verify from the official website.");
    circle = "Pan-India"; operator = "Toll-free";
    formatted = `${digits.slice(0, 4)} ${digits.slice(4)}`;
  } else if (/^14\d{8}$/.test(digits)) {
    valid = true; lineType = "Promotional header (TM/AD)";
    score += 22;
    patterns.push("140 / 140-series promotional telemarketing header");
    reasons.push({ label: "140-series promotional header — telemarketing or bulk SMS voice.", good: false });
    advice.push("Genuine banks never call from 140 numbers for KYC or OTP. Do not share codes.");
    circle = "Pan-India"; operator = "Telemarketer route";
  } else if (/^\d{5,6}$/.test(digits)) {
    valid = true; lineType = "Short code (VM / AD)";
    score += 15;
    reasons.push({ label: "5–6 digit short code — bulk promo or service alerts.", good: false });
    circle = "Pan-India";
  } else if (clean.startsWith("+1") && digits.length === 11) {
    valid = true; lineType = "US / Canada number (NANP)";
    formatted = `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    score += 18;
    patterns.push("+1 international range — common in lottery and prize scams in India");
    reasons.push({ label: "Unexpected +1 call in India is a classic lottery-scam pattern.", good: false });
    advice.push("No real lottery contacts winners by missed call or WhatsApp. Never pay a 'claim fee'.");
    circle = "USA / Canada"; operator = "NANP carrier / VoIP possible";
  } else if (/^\+(92|234|880|254|251)\d+/.test(clean)) {
    valid = true; lineType = "International mobile";
    score += 38;
    patterns.push("High-risk international corridor often abused for prize and job scams");
    reasons.push({ label: `${country} numbers are frequently spoofed for prize, job and romance scams.`, good: false });
    advice.push("Do not call back unknown international numbers — callback charges can be very high (Wangiri fraud).");
  } else if (clean.startsWith("+") && digits.length >= 8 && digits.length <= 15) {
    valid = true; lineType = "International number";
    score += 12;
    reasons.push({ label: "International format looks structurally valid.", good: true });
    advice.push("If you have no contacts abroad, treat unexpected international calls as suspicious.");
  } else if (digits.length > 15 || digits.length < 7) {
    valid = false; score += 30;
    reasons.push({ label: "Abnormal length — real numbers are 7 to 15 digits.", good: false });
    patterns.push("Abnormal length — strong spoof indicator");
  }

  // fake / spoof heuristics
  if (/^(\d)\1{6,}$/.test(digits) || /(\d)\1{7}/.test(digits)) {
    score += 30; patterns.push("Repeated-digit block (e.g. 0000000, 9999999) — typical fake range");
    reasons.push({ label: "Long repeated-digit block — very common in spoofed and demo numbers.", good: false });
  }
  if (/012345|123456|234567|345678|456789|987654|876543/.test(digits)) {
    score += 25; patterns.push("Sequential run (12345 / 98765) — demo and fake-number pattern");
    reasons.push({ label: "Sequential digits detected — rarely a real personal number.", good: false });
  }
  if (/^\+?0{2,}/.test(clean)) {
    score += 12; reasons.push({ label: "Double-zero trunk prefix — often a spoofed gateway call.", good: false });
  }
  const lower = raw.toLowerCase();
  if (lower.includes("private") || lower.includes("unknown") || lower.includes("no caller")) {
    score += 28; lineType = "Withheld / Private";
    patterns.push("Caller ID withheld — cannot be verified");
    reasons.push({ label: "Hidden caller ID — legitimate callers rarely hide their number.", good: false });
  }
  if (/^\+1555/.test(clean) || /^\+1404.*013/.test(clean)) {
    score += 20; patterns.push("Fictional / demo range (555 / 404-555) — safe for movies, fake in real life");
    reasons.push({ label: "Known fictional demo range — used in films and prank apps.", good: false });
  }

  // safe anchors
  if (/100$|101$|102$|108$|112$/.test(digits) || digits === "100" || digits === "112" || digits === "1930") {
    score = Math.min(score, 5);
    lineType = "Emergency / helpline";
    reasons.push({ label: "Emergency or cyber-helpline format (100 / 112 / 1930).", good: true });
    advice.push("Save 1930 (Cyber Fraud Helpline, India) and 112 in your phone.");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  if (!valid && score >= 40) verdict = "FAKE_SPOOF";
  else if (score >= 70) verdict = hit && hit.tags.join(" ").toLowerCase().includes("scam") ? "SCAM" : "SPAM";
  else if (score >= 45) verdict = "SUSPICIOUS";
  else if (score >= 25) verdict = "SUSPICIOUS";
  else if (score >= 10) verdict = "LIKELY_SAFE";
  else verdict = "SAFE";

  // repeated-digit heavy overrides to fake
  if (/(\d)\1{6,}/.test(digits) && verdict !== "SCAM" && verdict !== "SPAM") verdict = "FAKE_SPOOF";
  if (!valid && verdict === "LIKELY_SAFE") verdict = "SUSPICIOUS";

  // advice builder
  if (verdict === "SAFE" || verdict === "LIKELY_SAFE") {
    advice.push("Looks structurally clean, but stay alert — always verify money or OTP requests through the official app.");
    if (lineType.includes("Indian mobile")) advice.push("Save the contact if you know them. Unknown Indian mobiles can still be telemarketers.");
  }
  if (verdict === "SUSPICIOUS") {
    advice.push("Do not share OTP, UPI PIN or screen-share on this call.");
    advice.push("Let it go to voicemail. Search the number online before calling back.");
  }
  if (verdict === "SPAM") {
    advice.push("Block and report as spam. Do not press 1 / 9 in IVR traps.");
    advice.push("Register on DND (1909) to reduce telemarketing.");
  }
  if (verdict === "SCAM" || verdict === "FAKE_SPOOF") {
    advice.push("Do not call back, do not pay any fee, do not install any app they suggest.");
    advice.push("If money was involved, call 1930 (India Cyber Helpline) immediately and report at cybercrime.gov.in.");
  }

  const confidence = hit ? 92 : valid ? 78 : 65;

  return { verdict, score, confidence, country, countryCode: code, circle, operator, lineType, formatted, valid, reasons, patterns, advice };
}

export const VERDICT_META: Record<Verdict, { label: string; color: string; bg: string; desc: string }> = {
  SAFE: { label: "Safe", color: "text-emerald-300", bg: "from-emerald-400 to-teal-500", desc: "Structure looks clean. No major danger signals found." },
  LIKELY_SAFE: { label: "Likely Safe", color: "text-lime-300", bg: "from-lime-300 to-emerald-400", desc: "Probably fine, but stay cautious with money or OTP talk." },
  SUSPICIOUS: { label: "Suspicious", color: "text-amber-300", bg: "from-amber-300 to-orange-500", desc: "One or more risk patterns found. Handle with care." },
  SPAM: { label: "Spam Likely", color: "text-orange-300", bg: "from-orange-400 to-red-500", desc: "Strong spam indicators. Best to block and ignore." },
  SCAM: { label: "Scam Risk", color: "text-red-300", bg: "from-red-500 to-rose-600", desc: "High-risk scam pattern. Do not engage or pay anything." },
  FAKE_SPOOF: { label: "Fake / Spoofed", color: "text-fuchsia-300", bg: "from-fuchsia-500 to-purple-600", desc: "Looks artificially generated or spoofed, not a real personal number." },
  INVALID: { label: "Invalid", color: "text-slate-300", bg: "from-slate-400 to-slate-600", desc: "Not enough digits to analyze." },
};

export function loadCommunity(): CommunityEntry[] {
  try {
    const extra = JSON.parse(localStorage.getItem("prankx_community") || "[]");
    return [...extra, ...SEED_SCAM_DB];
  } catch { return SEED_SCAM_DB; }
}

export function saveReport(number: string, tag: string) {
  try {
    const extra: CommunityEntry[] = JSON.parse(localStorage.getItem("prankx_community") || "[]");
    const norm = number.replace(/\D/g, "");
    const found = extra.find(e => e.number.replace(/\D/g, "") === norm);
    if (found) { found.reports += 1; if (!found.tags.includes(tag)) found.tags.push(tag); }
    else extra.unshift({ number, reports: 1, tags: [tag], lastSeen: "just now" });
    localStorage.setItem("prankx_community", JSON.stringify(extra.slice(0, 100)));
  } catch {}
}
