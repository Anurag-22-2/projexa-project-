export type CallPreset = {
  id: string;
  name: string;
  number: string;
  tag: string;
  initial: string;
  gradient: string;
  voice: string;
  female?: boolean;
};

export const CALL_PRESETS: CallPreset[] = [
  { id: "mom", name: "Mom", number: "+91 98200 12345", tag: "Family", initial: "M", gradient: "from-rose-500 to-orange-400", voice: "Hi sweetheart, have you eaten? When are you coming home? Dad wants to talk to you!", female: true },
  { id: "boss", name: "Mr. Sharma (Boss)", number: "+91 99870 44521", tag: "Work", initial: "S", gradient: "from-slate-700 to-slate-900", voice: "Hello, where are you? Client meeting starts in ten minutes. Join immediately!" },
  { id: "crush", name: "Aarohi", number: "+91 90041 77823", tag: "Crush", initial: "A", gradient: "from-pink-500 to-fuchsia-600", voice: "Hey! I was thinking about you. Are you free this evening for coffee?", female: true },
  { id: "police", name: "Mumbai Police", number: "100", tag: "Official", initial: "P", gradient: "from-blue-700 to-indigo-900", voice: "This is a demo call from Mumbai Police awareness campaign. Stay safe, do not share OTPs." },
  { id: "delivery", name: "Swiggy Delivery", number: "+91 86520 99110", tag: "Delivery", initial: "S", gradient: "from-orange-500 to-red-500", voice: "Sir, your order has arrived at the gate. Please come downstairs." },
  { id: "unknown", name: "Unknown Number", number: "+1 (404) 555-0132", tag: "Spam?", initial: "U", gradient: "from-zinc-600 to-zinc-800", voice: "Congratulations! You have won a lottery. This is a demo prank call." },
  { id: "bank", name: "HDFC Bank", number: "1800 266 00", tag: "Bank", initial: "H", gradient: "from-emerald-600 to-teal-700", voice: "Dear customer, never share your OTP with anyone. This is an awareness demo call." },
  { id: "gf", name: "Priya", number: "+91 98330 55218", tag: "Personal", initial: "P", gradient: "from-violet-500 to-purple-700", voice: "Baby, where are you? I miss you so much! Call me back when you see this.", female: true },
];

export type MailTemplate = {
  id: string;
  label: string;
  from: string;
  email: string;
  subject: string;
  body: string;
  tag: string;
  color: string;
};

export const MAIL_TEMPLATES: MailTemplate[] = [
  {
    id: "google-job",
    label: "Dream Job",
    from: "Google Careers",
    email: "careers@google.com",
    subject: "Congratulations! You are shortlisted for Software Engineer at Google",
    body: `Hi there,\n\nGreat news! Your profile has been shortlisted for the Software Engineer (L3) role at Google, Bangalore.\n\nInterview Round 1: Monday, 11:00 AM (Google Meet)\nCTC Offered: Rs. 48 LPA + stocks\n\nPlease reply with your confirmation and updated resume.\n\nBest,\nSarah Thompson\nTalent Acquisition | Google`,
    tag: "Work",
    color: "bg-blue-600",
  },
  {
    id: "bank-credit",
    label: "Bank Credit",
    from: "HDFC Bank",
    email: "alerts@hdfcbank.com",
    subject: "Rs. 85,000 credited to your A/c XX4521 - UPI Ref 4419283",
    body: `Dear Customer,\n\nINR 85,000.00 has been CREDITED to your A/c ending 4521 on 19-Nov-2026 via UPI.\n\nUPI Ref: 441928376512\nAvailable Balance: Rs. 1,24,530.75\n\nIf not done by you, call 1800-266-00 immediately.\n\n- HDFC Bank (Demo, not real)`,
    tag: "Finance",
    color: "bg-emerald-600",
  },
  {
    id: "otp",
    label: "OTP Alert",
    from: "MY-JIO OTP",
    email: "otp@jio.com",
    subject: "Your OTP is 482913 - valid for 5 mins",
    body: `482913 is your OTP for login verification.\n\nDo NOT share this OTP with anyone. Jio never asks for OTP on call.\n\nThis is a PRANK demo. No real transaction involved.`,
    tag: "Security",
    color: "bg-orange-600",
  },
  {
    id: "iphone",
    label: "Lottery Win",
    from: "Apple Store India",
    email: "winner@apple-india.in",
    subject: "You WON an iPhone 17 Pro Max in Diwali Lucky Draw",
    body: `Dear Lucky Winner,\n\nYou have been selected as the GRAND WINNER of our Diwali Lucky Draw!\n\nPrize: iPhone 17 Pro Max (256GB, Black Titanium)\nClaim Code: APPLE-DIWALI-2026-X7\n\nClick claim within 24 hours. (Demo prank - not real, just for fun!)`,
    tag: "Promotions",
    color: "bg-zinc-900",
  },
  {
    id: "crush-mail",
    label: "Crush Mail",
    from: "Aarohi Sharma",
    email: "aarohi.s@gmail.com",
    subject: "Hey, I wanted to tell you something...",
    body: `Hey you,\n\nI have been wanting to say this for a long time... I really like spending time with you.\n\nAre you free this Saturday? There is a new cafe in Bandra I want to try - with you.\n\nReply soon?\n- Aarohi`,
    tag: "Personal",
    color: "bg-pink-600",
  },
  {
    id: "interview",
    label: "Interview",
    from: "Infosys HR",
    email: "hr@infosys.com",
    subject: "Interview Scheduled: Systems Engineer - 20 Nov, 10 AM",
    body: `Hello Candidate,\n\nYour interview for Systems Engineer is scheduled:\nDate: 20-Nov-2026, 10:00 AM\nVenue: Infosys Campus, Hinjewadi Phase 2 / Virtual\n\nBring: Resume, ID proof, photos.\n\nAll the best!\n- HR Team (Demo)`,
    tag: "Work",
    color: "bg-indigo-600",
  },
];

export const GRADIENTS = [
  "from-rose-500 to-orange-400",
  "from-violet-500 to-purple-700",
  "from-blue-500 to-cyan-400",
  "from-emerald-500 to-teal-600",
  "from-amber-400 to-orange-600",
  "from-pink-500 to-fuchsia-600",
  "from-slate-700 to-slate-900",
  "from-lime-400 to-emerald-600",
];

export const EMOJIS: string[] = [];
