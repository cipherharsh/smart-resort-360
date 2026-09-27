import { useMemo, useState, useEffect } from "react";
import {
  Activity, AlertCircle, AlertTriangle, ArrowLeft, ArrowRight, BarChart3, Bell, BookOpen, Bot, Building2,
  CalendarDays, Check, CheckCircle2, ChevronDown, CircleDollarSign, CircleHelp, Clock3, Cloud, CloudRain, CloudSun,
  Coffee, Command, ConciergeBell, Cpu, CreditCard, DoorOpen, Download, Droplets, Gauge, GitBranch, Home as HomeIcon, Hotel,
  KeyRound, Layers3, LifeBuoy, ListFilter, LogOut, MapPin, Menu, MessageCircle, MoreHorizontal, Navigation,
  PackageCheck, PanelLeft, Pause, Phone, Play, Plus, Radio, Network, Receipt, RefreshCw, Search, Send, Settings, ShieldAlert, Sparkles,
  Sun, Target, Thermometer, TicketCheck, Timer, TrendingUp, Trophy, UserRound, Users, Utensils, Wine, Wind, Wrench, X, Zap
} from "lucide-react";
import { toast } from "sonner";
import { api, setAuthToken, ResortStats, BackendHealth } from "../lib/api";
import { seedAmenities, seedAssets, seedBookings, seedUsers } from "../data/backendAlignedSeed";
import { TopbarWeatherPill, ManagerWeatherCard, StaffWeatherCard, GuestWeatherCard, WeatherModal, useLiveWeather } from "../components/WeatherWidgets";
import { AIIntelligenceScreen, DispatchScreen, GuestAmenityDetail, GuestBuggy, GuestCheckout, GuestOffer, GuestFolio, GuestProfile, GuestReservations, GuestSOS, NotificationScreen, ProfileScreen, PropertyHealthScreen, RevenueScreen, SearchOverlay, SentimentScreen, SettingsScreen, StaffNotificationScreen, StaffScheduleScreen, WhatIfScreen, WorkforceScreen } from "./Expansion";

const RESORT_HERO_IMAGES = [
  {
    url: "/manus-storage/resort-villa-clean_eb5956dd.jpg",
    title: "Sunridge Private Lagoon Villa",
    tag: "Lagoon Sanctuary"
  },
  {
    url: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=1920&q=85",
    title: "18-Hole Championship Golf Course & Greens",
    tag: "Championship Golf Court"
  },
  {
    url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1920&q=85",
    title: "Infinity Horizon & Twilight Cabanas",
    tag: "Sunset Deck"
  },
  {
    url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1920&q=85",
    title: "Royal Tropical Palm Sanctuary",
    tag: "Estate Grounds"
  },
  {
    url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1920&q=85",
    title: "Minimalist Coastal Architecture",
    tag: "Boutique Wing"
  },
  {
    url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1920&q=85",
    title: "Golden Hour Private Boardwalk",
    tag: "Sunset Pier"
  }
];

const resortImg = "/manus-storage/resort-villa-clean_eb5956dd.jpg";
const resortFallback = "/resort-hero.jpg";
const resortWebFallback = "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1920&q=85";
void seedAmenities; void seedAssets; void seedBookings; void seedUsers;
type Role = "manager" | "staff" | "guest";
type ManagerPage = "command" | "bookings" | "decisions" | "maintenance" | "amenity" | "forecast" | "revenue" | "workforce" | "sentiment" | "whatif" | "property-health" | "ai-map" | "connected" | "operations" | "emergency" | "notifications" | "profile" | "settings";
type StaffPage = "staff-home" | "tasks" | "schedule" | "dispatch" | "emergency" | "notifications";
type GuestPage = "guest-home" | "concierge" | "amenities" | "amenity-detail" | "reservations" | "waitlist" | "offer" | "buggy" | "folio" | "checkout" | "sos" | "profile";
type Page = ManagerPage | StaffPage | GuestPage;

type DemoState = {
  taskCreated: boolean; taskAccepted: boolean; taskCompleted?: boolean; spaState: "open" | "available" | "maintenance"; offerGuest: "none" | "B" | "C"; guestAsked: boolean; connected: boolean; lastAction: string; highOccupancy?: boolean; guestComplaint?: boolean;
};
const initialDemo: DemoState = { taskCreated:false, taskAccepted:false, taskCompleted:false, spaState:"open", offerGuest:"none", guestAsked:false, connected:false, lastAction:"System ready", highOccupancy:false, guestComplaint:false };

const managerNav = [
  {id:"command", label:"Command Center", icon:Gauge},
  {id:"ai-map", label:"Geospatial GIS Map", icon:Navigation},
  {id:"whatif", label:"Digital Twin Simulator", icon:GitBranch},
  {id:"sentiment", label:"Social Signals & Sentiment", icon:MessageCircle},
  {id:"decisions", label:"Intelligence Center", icon:Sparkles},
  {id:"bookings", label:"Bookings", icon:CalendarDays},
  {id:"maintenance", label:"Maintenance Intelligence", icon:Wrench},
  {id:"amenity", label:"Amenity Control", icon:TicketCheck},
  {id:"forecast", label:"Occupancy Forecast", icon:TrendingUp},
  {id:"revenue", label:"Revenue Intelligence", icon:CircleDollarSign},
  {id:"workforce", label:"Workforce Intelligence", icon:Users},
  {id:"property-health", label:"Property Health", icon:Building2},
  {id:"connected", label:"Connected Intelligence", icon:GitBranch},
  {id:"operations", label:"Operations Center", icon:Radio},
  {id:"emergency", label:"Emergency Control", icon:ShieldAlert},
  {id:"notifications", label:"Notifications", icon:Bell},
  {id:"profile", label:"Profile", icon:UserRound},
  {id:"settings", label:"Settings", icon:Settings}
] as const;
const staffNav = [
  {id:"staff-home", label:"Staff Home", icon:HomeIcon}, {id:"tasks", label:"My Tasks", icon:ListFilter}, {id:"schedule", label:"Schedule", icon:CalendarDays}, {id:"dispatch", label:"Dispatch", icon:Building2}, {id:"emergency", label:"Emergency", icon:ShieldAlert}, {id:"notifications", label:"Notifications", icon:Bell}
] as const;
const guestNav = [
  {id:"guest-home", label:"My Stay", icon:HomeIcon},
  {id:"concierge", label:"AI Concierge", icon:Bot},
  {id:"amenities", label:"Amenities", icon:Sparkles},
  {id:"reservations", label:"My Reservations", icon:CalendarDays},
  {id:"waitlist", label:"My Waitlist", icon:Timer},
  {id:"offer", label:"Current Offer", icon:TicketCheck},
  {id:"buggy", label:"Buggy", icon:ArrowRight},
  {id:"folio", label:"Digital Folio", icon:Receipt},
  {id:"checkout", label:"Checkout", icon:CheckCircle2},
  {id:"sos", label:"Guest SOS", icon:ShieldAlert},
  {id:"profile", label:"Profile", icon:UserRound}
] as const;

function Logo({compact=false, large=false}:{compact?:boolean; large?:boolean}) {
  return <div className="flex items-center gap-3.5">
    <div className={`grid ${large ? 'h-11 w-11' : 'h-9 w-9'} place-items-center rounded-xl bg-[#8fd6c2] text-[#132725] shadow-[0_7px_20px_rgba(107,203,173,.25)]`}>
      <span className={`font-serif ${large ? 'text-2xl' : 'text-lg'} font-bold`}>S</span>
    </div>
    {!compact && (
      <div className="sr-wordmark-copy">
        <div className={`${large ? 'text-[17px]' : 'text-[13px]'} font-extrabold tracking-[.03em] text-[#ffffff] drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]`}>
          SMART RESORT <span className="text-[#8fd6c2]">360</span>
        </div>
        <div className={`mt-0.5 ${large ? 'text-[11px] text-[#e0f2ee]' : 'sr-dim text-[9px]'} uppercase tracking-[.18em] font-bold drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]`}>
          Intelligent hospitality
        </div>
      </div>
    )}
  </div>;
}
function Icon({icon: I, size=16}:{icon:any; size?:number}) { return <I size={size} strokeWidth={1.7}/>; }
function StatusChip({children,tone="teal",pulse=false}:{children:React.ReactNode;tone?:"teal"|"amber"|"red"|"blue"|"neutral";pulse?:boolean}) { return <span className={`sr-chip sr-chip-${tone} ${pulse?"sr-live":""}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{children}</span>; }
function MiniBar({value,color="#7fcbb7"}:{value:number;color?:string}) { return <div className="sr-bar"><span style={{width:`${value}%`,background:color}} /></div>; }
function SectionHeader({eyebrow,title,description,action}:{eyebrow:string;title:string;description?:string;action?:React.ReactNode}) { return <div className="mb-7 flex items-end justify-between gap-4"><div><div className="sr-kicker mb-2">{eyebrow}</div><h1 className="sr-page-title">{title}</h1>{description&&<p className="sr-muted mt-2 max-w-2xl text-sm leading-6">{description}</p>}</div>{action}</div>; }
function Stat({label,value,delta,tone="teal",icon: I}:{label:string;value:string;delta:string;tone?:"teal"|"amber"|"red"|"blue";icon:any}) { const colors={teal:"#8fd6c2",amber:"#e9bc73",red:"#ef9a8e",blue:"#a9c9e9"}; return <div className="sr-surface sr-enter p-5"><div className="flex items-center justify-between"><div className="sr-label">{label}</div><div className="rounded-lg p-2" style={{background:`${colors[tone]}12`,color:colors[tone]}}><Icon icon={I} size={16}/></div></div><div className="sr-number mt-4 text-[28px] font-semibold text-[#f4f0e8]">{value}</div><div className="mt-2 flex items-center gap-2 text-[11px]" style={{color:colors[tone]}}><TrendingUp size={12}/>{delta}</div></div>; }

function Entry({onEnter}:{onEnter:()=>void}) {
  const [imgIndex, setImgIndex] = useState<number>(() => {
    // Generate a random initial index on page load
    return Math.floor(Math.random() * RESORT_HERO_IMAGES.length);
  });
  const [prevIndex, setPrevIndex] = useState<number>(imgIndex);

  const activeHero = RESORT_HERO_IMAGES[imgIndex];

  // Automatically cycle to the next hero image every 2.5 seconds with silky smooth synced crossfade
  useEffect(() => {
    const timer = setInterval(() => {
      setImgIndex((current) => {
        setPrevIndex(current);
        return (current + 1) % RESORT_HERO_IMAGES.length;
      });
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return <div className="sr-entry relative overflow-hidden">
    {/* Full-bleed background slideshow image across the entire Entry screen */}
    <div className="absolute inset-0 z-0 overflow-hidden bg-[#0a1515]">
      {RESORT_HERO_IMAGES.map((hero, idx) => {
        const isCurrent = idx === imgIndex;
        const isPrevious = idx === prevIndex && prevIndex !== imgIndex;
        const isVisible = isCurrent || isPrevious;

        return (
          <img
            key={hero.url}
            src={hero.url}
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.includes("resort-hero.jpg") && target.src !== resortFallback) {
                target.src = resortFallback;
              } else {
                target.src = resortWebFallback;
              }
            }}
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              filter: "saturate(1.02) contrast(1.02) brightness(0.96)",
              opacity: isCurrent ? 1 : 0,
              zIndex: isCurrent ? 2 : isPrevious ? 1 : 0,
              transition: "opacity 900ms cubic-bezier(0.4, 0, 0.2, 1)",
              transform: "translateZ(0)",
              willChange: isVisible ? "opacity" : "auto",
              pointerEvents: "none"
            }}
            alt={hero.title}
          />
        );
      })}
      {/* Subtle global ambient depth overlay */}
      <div className="absolute inset-0 z-[3] bg-gradient-to-t from-black/35 via-transparent to-black/15 pointer-events-none" />
    </div>

    {/* Left Translucent Panel */}
    <div className="sr-entry-copy relative z-10">
      <Logo large={true}/>
      <div className="relative z-[1] max-w-xl">
        <div className="sr-kicker mb-5 text-[14px] font-extrabold tracking-wider text-[#a6ede0] drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
          PS ID 4 · HACKCELESTIAL 3.0
        </div>
        <h1 className="font-serif text-[clamp(44px,6vw,82px)] font-medium leading-[.96] tracking-[-.055em] text-[#ffffff] drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)]">
          From resort data<br/>
          <span className="text-[#8fd6c2] drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">to intelligent action.</span>
        </h1>
        <p className="mt-7 max-w-lg text-[18px] leading-8 text-[#ffffff] font-medium drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
          An intelligent operating layer connecting resort operations, guest experience and revenue intelligence.
        </p>
        <button className="sr-button mt-9 min-h-14 px-8 text-[15px] font-bold shadow-[0_12px_32px_rgba(0,0,0,0.6)]" onClick={onEnter}>
          Enter platform <ArrowRight size={18}/>
        </button>
      </div>
      <div className="relative z-[1] flex items-center gap-3.5 text-[13px] uppercase tracking-[.18em] text-[#ffffff] font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
        <span className="h-2.5 w-2.5 rounded-full bg-[#8fd6c2] shadow-[0_0_10px_#8fd6c2]"/> Sense <span className="text-[#8fd6c2]">→</span> Predict <span className="text-[#8fd6c2]">→</span> Recommend <span className="text-[#8fd6c2]">→</span> Act
      </div>
    </div>

    {/* Right Art / Card Area */}
    <div className="sr-entry-art relative z-10">
      <div className="sr-entry-card z-30 relative">
        <div className="flex items-center justify-between">
          <StatusChip tone="teal"><span className="text-xs font-bold text-white tracking-wide">Live environment</span></StatusChip>
          <span className="font-mono text-xs font-bold text-white/90 drop-shadow">v0.9.4</span>
        </div>
        <div className="relative mt-4 min-h-[64px] overflow-hidden">
          {RESORT_HERO_IMAGES.map((hero, idx) => {
            const isCurrent = idx === imgIndex;
            const isPrevious = idx === prevIndex && prevIndex !== imgIndex;
            const isVisible = isCurrent || isPrevious;
            if (!isVisible) return null;

            return (
              <p
                key={hero.title}
                className="absolute inset-x-0 top-0 font-serif text-[23px] leading-tight text-white font-semibold drop-shadow-[0_3px_10px_rgba(0,0,0,0.95)]"
                style={{
                  opacity: isCurrent ? 1 : 0,
                  transform: isCurrent ? "translateY(0px)" : "translateY(-6px)",
                  filter: isCurrent ? "blur(0px)" : "blur(4px)",
                  zIndex: isCurrent ? 2 : 1,
                  transition: isCurrent
                    ? "opacity 700ms cubic-bezier(0.22, 1, 0.36, 1), transform 700ms cubic-bezier(0.22, 1, 0.36, 1), filter 700ms cubic-bezier(0.22, 1, 0.36, 1)"
                    : "opacity 500ms cubic-bezier(0.22, 1, 0.36, 1), transform 500ms cubic-bezier(0.22, 1, 0.36, 1), filter 500ms cubic-bezier(0.22, 1, 0.36, 1)",
                  willChange: "opacity, transform, filter",
                  pointerEvents: isCurrent ? "auto" : "none",
                }}
              >
                {hero.title}
              </p>
            );
          })}
        </div>
      </div>
    </div>
  </div>;
}

function Auth({onLogin}:{onLogin:(role:Role)=>void}) {
  const [role,setRole]=useState<Role>("manager");
  const [step,setStep]=useState<1|2>(1);
  const [email, setEmail]=useState<string>("resort360test@gmail.com");
  const [otp, setOtp]=useState<string>("");
  const [loading, setLoading]=useState<boolean>(false);
  const [devOtpNotice, setDevOtpNotice]=useState<string | null>(null);

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    setStep(1);
    setOtp("");
    setDevOtpNotice(null);
    if (newRole === "manager") setEmail("resort360test@gmail.com");
    else if (newRole === "guest") setEmail("guest@smartresort360.com");
    else setEmail("maintenance@smartresort360.com");
  };

  const handleSendOTP = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    setLoading(true);
    try {
      if (role === "manager") {
        const res = await api.requestManagerOTP(email);
        toast.success(res.message || "OTP code sent to your email!");
        if (res.dev_otp) {
          setDevOtpNotice(res.dev_otp);
          setOtp(res.dev_otp);
        }
        setStep(2);
      } else if (role === "guest") {
        const res = await api.requestGuestOTP(email);
        toast.success(res.message || "OTP code sent to your email!");
        if (res.dev_otp) {
          setDevOtpNotice(res.dev_otp);
          setOtp(res.dev_otp);
        }
        setStep(2);
      } else {
        const res = await api.requestStaffOTP(email);
        toast.success(res.message || "OTP code sent to your employee email!");
        if (res.dev_otp) {
          setDevOtpNotice(res.dev_otp);
          setOtp(res.dev_otp);
        }
        setStep(2);
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      toast.error("Please enter the 4-digit verification code");
      return;
    }
    setLoading(true);
    try {
      if (role === "manager") {
        const res = await api.verifyManagerOTP(email, otp);
        setAuthToken(res.access_token, res.role, res.email);
        toast.success("Manager workspace unlocked successfully!");
        onLogin("manager");
      } else if (role === "guest") {
        const res = await api.verifyGuestOTP(email, otp);
        setAuthToken(res.access_token, res.role, res.email);
        toast.success("Guest stay portal authenticated!");
        onLogin("guest");
      } else {
        const res = await api.verifyStaffOTP(email, otp);
        setAuthToken(res.access_token, res.role, res.email);
        toast.success("Staff workspace unlocked successfully!");
        onLogin("staff");
      }
    } catch (err: any) {
      toast.error(err.message || "Invalid OTP code provided");
    } finally {
      setLoading(false);
    }
  };

  return <div className="sr-auth"><div className="sr-auth-card sr-enter"><div className="flex items-center justify-between"><Logo/><button className="sr-button-quiet" onClick={()=>toast("Help center: Enter any email to receive an instant verification code.") }><CircleHelp size={16}/></button></div><div className="mt-12"><div className="sr-kicker mb-3">Secure access · dynamic OTP</div><h1 className="font-serif text-3xl text-[#f3eee6]">Welcome to Smart Resort 360</h1><p className="sr-muted mt-2 text-sm">Choose your workspace to receive your access code.</p></div><div className="sr-segment mt-7">{(["manager","staff","guest"] as Role[]).map(r=><button key={r} onClick={()=>handleRoleChange(r)} className={role===r?"active":""}>{r[0].toUpperCase()+r.slice(1)}</button>)}</div>{step===1?<div className="mt-6">{role==="guest"?<><label className="sr-label mb-2 block">Guest Email Address</label><input className="sr-input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Enter your email to receive OTP"/><p className="sr-muted mt-2 text-[11px]">We'll send a 4-digit access code to this email.</p></>:role==="staff"?<div className="grid gap-3"><div><label className="sr-label mb-2 block">Employee Email / ID</label><input className="sr-input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="maintenance@smartresort360.com"/><p className="sr-muted mt-2 text-[11px]">A 4-digit code will be sent to your employee email.</p></div></div>:<div className="grid gap-3"><div><label className="sr-label mb-2 block">Manager Gmail Address</label><input className="sr-input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="resort360test@gmail.com"/><p className="sr-muted mt-2 text-[11px]">A 4-digit code will be sent to your Gmail inbox.</p></div></div>}<button className="sr-button mt-6 w-full min-h-11" disabled={loading} onClick={handleSendOTP}>{loading ? "Connecting to Backend..." : "Send 4-Digit OTP"} <ArrowRight size={15}/></button></div>:<div className="mt-6"><div className="flex items-center gap-3"><button onClick={()=>setStep(1)} className="sr-button-quiet"><ArrowLeft size={15}/></button><div><div className="text-sm font-semibold">Verify {role==="guest"?"Your Stay":role==="staff"?"Staff Access":"Manager Access"}</div><div className="sr-muted mt-1 text-xs">Verification code sent to <span className="text-[#8fd6c2]">{email}</span></div></div></div>{devOtpNotice && <div className="mt-4 rounded-lg border border-[#8fd6c2]/20 bg-[#8fd6c2]/10 p-3 text-xs text-[#8fd6c2] flex items-center justify-between"><span>Dispatched Code: <strong>{devOtpNotice}</strong></span><button className="underline text-[11px]" onClick={()=>setOtp(devOtpNotice)}>Autofill</button></div>}<div className="mt-5"><label className="sr-label mb-2 block">Enter 4-Digit OTP</label><input className="sr-input text-center text-2xl tracking-[0.5em] font-mono" maxLength={6} value={otp} onChange={e=>setOtp(e.target.value)} placeholder="1234"/></div><button className="sr-button mt-6 w-full min-h-11" disabled={loading} onClick={handleVerifyOTP}>{loading ? "Verifying..." : "Verify & Unlock"} <Check size={15}/></button><button className="sr-button-quiet mt-3 w-full" onClick={handleSendOTP}>Resend Code</button></div>}<div className="mt-9 flex items-center justify-between border-t border-white/10 pt-5 text-[10px] text-[#6d8781]"><span>FastAPI + SQLite/Postgres Active</span><span>Smart Resort 360</span></div></div></div>; }

function Sidebar({role,page,setPage,onLogout,onDemo}:{role:Role;page:Page;setPage:(p:Page)=>void;onLogout:()=>void;onDemo:()=>void}) { const nav=role==="manager"?managerNav:role==="staff"?staffNav:guestNav; return <aside className="sr-sidebar"><Logo compact={false}/><div className="mt-10 mb-3 flex items-center justify-between"><span className="sr-label">Workspace</span><StatusChip tone={role==="guest"?"amber":"teal"}>{role[0].toUpperCase()+role.slice(1)}</StatusChip></div><nav className="space-y-1">{nav.map(({id,label,icon})=><button key={id} className={`sr-nav-item ${page===id?"active":""}`} onClick={()=>setPage(id as Page)}><Icon icon={icon}/><span className="sr-nav-copy">{label}</span>{id==="decisions"&&<span className="ml-auto sr-nav-copy rounded-full bg-[#d99568] px-1.5 py-0.5 text-[9px] text-[#1c1a17]">4</span>}</button>)}</nav><div className="mt-auto"><button className="sr-nav-item" onClick={onDemo}><Icon icon={Zap}/><span className="sr-nav-copy">Demo mode</span></button><button className="sr-nav-item" onClick={onLogout}><Icon icon={LogOut}/><span className="sr-nav-copy">Log out</span></button><div className="mt-4 rounded-xl border border-white/8 bg-white/[.03] p-3"><div className="flex items-center gap-2"><div className="grid h-7 w-7 place-items-center rounded-full bg-[#47665e] text-[10px] font-bold">{role==="manager"?"AV":role==="staff"?"ST":"GU"}</div><div className="sr-nav-copy"><div className="text-[11px] font-semibold">{role==="manager"?"General Manager":role==="staff"?"Engineering Staff":"Alexander Wright"}</div><div className="sr-dim text-[10px]">{role[0].toUpperCase()+role.slice(1)}</div></div><MoreHorizontal className="ml-auto sr-nav-copy text-[#7e9994]" size={15}/></div></div></div></aside>; }

function Topbar({role,page,setPage,onDemo,onSearch,onOpenWeather}:{role:Role;page:Page;setPage:(p:Page)=>void;onDemo:()=>void;onSearch:()=>void;onOpenWeather?:()=>void}) {
  const [backendOnline, setBackendOnline] = useState<boolean>(true);
  useEffect(() => {
    api.checkHealth().then(() => setBackendOnline(true)).catch(() => setBackendOnline(false));
  }, []);
  const title=page.replace("staff-home","Staff home").replace("guest-home","My stay").replace("-"," ");
  return (
    <header className="sr-topbar">
      <div className="flex items-center gap-3">
        <button className="sr-button-quiet sr-mobile-menu"><Menu size={18}/></button>
        <div className="sr-dim text-xs">Sunridge Cove /</div>
        <div className="text-xs font-semibold capitalize text-[#dce7df]">{title}</div>
      </div>
      <div className="flex items-center gap-2">
        <TopbarWeatherPill onOpenDetails={onOpenWeather} />
        <StatusChip tone={backendOnline ? "teal" : "amber"} pulse>{backendOnline ? "Backend: Online" : "Connecting API..."}</StatusChip>
        <button className="sr-button-quiet sr-search-trigger hidden sm:inline-flex" onClick={onSearch}><Search size={16}/><span className="hidden md:inline">Search</span><kbd className="sr-chip ml-1 px-1.5 text-[9px]">⌘ K</kbd></button>
        <button className="sr-button-quiet" onClick={()=>setPage("notifications" as Page)}><Bell size={17}/><span className="ml-[-5px] mt-[-12px] grid h-3.5 w-3.5 place-items-center rounded-full bg-[#d99568] text-[8px] text-[#1c1a17]">4</span></button>
        <button className="sr-button-quiet" onClick={onDemo}><Zap size={16}/><span className="hidden md:inline text-[11px]">Demo</span></button>
        <div className="ml-1 grid h-8 w-8 place-items-center rounded-full bg-[#46645d] text-[10px] font-bold">{role==="manager"?"AV":role==="staff"?"ST":"GU"}</div>
      </div>
    </header>
  );
}

function AppShell({role,setRole,page,setPage,onLogout,onDemo,onSearch,onOpenWeather,children}:{role:Role;setRole:(r:Role)=>void;page:Page;setPage:(p:Page)=>void;onLogout:()=>void;onDemo:()=>void;onSearch:()=>void;onOpenWeather?:()=>void;children:React.ReactNode}) { return <div className={`sr-app ${role==="guest"?"sr-guest":""}`}><div className="sr-shell"><Sidebar role={role} page={page} setPage={setPage} onLogout={onLogout} onDemo={onDemo}/><div className="sr-main"><Topbar role={role} page={page} setPage={setPage} onDemo={onDemo} onSearch={onSearch} onOpenWeather={onOpenWeather}/>{children}</div></div></div>; }

function CommandCenter({demo,setDemo,setPage,onOpenWeather}:{demo:DemoState;setDemo:React.Dispatch<React.SetStateAction<DemoState>>;setPage:(p:Page)=>void;onOpenWeather?:()=>void}) {
  const [stats, setStats] = useState<ResortStats | null>(null);
  useEffect(() => {
    api.getStats().then(setStats).catch(() => {});
  }, []);

  const occupancyVal = stats?.occupancy_rate || "87.4%";
  const revenueVal = stats ? `₹ ${stats.total_folio_revenue.toLocaleString()}` : "₹ 14,250";
  const openTasksVal = stats ? `${stats.open_tickets}` : "12";
  const activeStaffVal = stats ? `${stats.active_staff_count} active` : "4 online";

  return (
    <main className="sr-content">
      <SectionHeader
        eyebrow="Wednesday · 26 September 2026 · Live Operations"
        title="Good morning, Resort Manager."
        description="Smart Resort 360 AI Operating Layer is active and synced with live resort sensors & meteorological stations."
        action={
          <div className="flex flex-wrap gap-2">
            <button className="sr-button sr-button-secondary" onClick={()=>setPage("ai-map")}>
              <Navigation size={14}/> Geospatial GIS Map
            </button>
            <button className="sr-button sr-button-secondary" onClick={()=>setPage("whatif")}>
              <GitBranch size={14}/> Digital Twin
            </button>
            <button className="sr-button" onClick={()=>setPage("decisions")}>
              Decision stream <ArrowRight size={14}/>
            </button>
          </div>
        }
      />
      <div className="sr-grid sr-grid-4">
        <Stat label="Occupancy Rate" value={occupancyVal} delta="+6.8% vs baseline" icon={Building2}/>
        <Stat label="Revenue Pace" value={revenueVal} delta="Synced from folios" tone="blue" icon={TrendingUp}/>
        <Stat label="Staff Coverage" value={activeStaffVal} delta="All departments filled" icon={Users}/>
        <Stat label="Open Attention" value={openTasksVal} delta="Maintenance & service" tone="amber" icon={AlertTriangle}/>
      </div>

      {/* Live Environmental Intelligence Dashboard */}
      <div className="mt-7">
        <ManagerWeatherCard onOpenDetails={onOpenWeather} />
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
        <div className="sr-surface sr-enter sr-delay-1 p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="sr-kicker">Sense / Predict</div>
              <h2 className="mt-2 font-serif text-[23px] text-[#f3eee6]">Occupancy snapshot</h2>
              <p className="sr-muted mt-1 text-xs">Live rooms and Amazon Chronos-Bolt 7-day forecast</p>
            </div>
            <StatusChip>Live · FastAPI Synced</StatusChip>
          </div>
          <div className="mt-8 flex items-end gap-1" style={{height:150}}>
            {[58,64,69,73,79,87,84,81,76,82,89,92,90,87,86,88,91,93,94,91,88,86,84,87].map((v,i)=><div key={i} className="group relative flex-1" style={{height:`${v}%`}}><div className={`h-full rounded-t-sm ${i>13?"bg-[#578476]/55":"bg-[#72b9a4]"}`}><div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 rounded bg-[#0b1516] px-2 py-1 text-[9px] text-white group-hover:block">{v}%</div></div></div>)}
          </div>
          <div className="mt-3 flex justify-between text-[10px] text-[#6f8983]"><span>24 Sep</span><span>Today</span><span>30 Sep</span></div>
          <div className="mt-5 grid grid-cols-3 gap-4 border-t border-white/8 pt-4">
            <div><div className="sr-label">Occupied Amenities</div><div className="mt-1 text-sm font-semibold">{stats?.occupied_amenities || "2 / 6"}</div></div>
            <div><div className="sr-label">Forecast High</div><div className="mt-1 text-sm font-semibold text-[#8fd6c2]">93.4% <span className="sr-muted text-[10px]">Fri</span></div></div>
            <div><div className="sr-label">Demand Signal</div><div className="mt-1 text-sm font-semibold text-[#e9bc73]">Elevated</div></div>
          </div>
        </div>

        <div className="sr-surface sr-enter sr-delay-2 p-5">
          <div className="flex items-start justify-between">
            <div><div className="sr-kicker">Act</div><h2 className="mt-2 font-serif text-[23px] text-[#f3eee6]">Operational attention</h2></div>
            <button className="sr-button-quiet" onClick={()=>setPage("decisions")}>View all <ArrowRight size={14}/></button>
          </div>
          <div className="mt-5 space-y-3">
            <AttentionRow tone="red" icon={Thermometer} title="SPA_HEATER at high risk" meta="Preventive action due · 84 risk" onClick={()=>setPage("maintenance")}/>
            <AttentionRow tone="amber" icon={Users} title="Spa waitlist has 8 guests" meta="Next slot forecast in 90 min" onClick={()=>setPage("amenity")}/>
            <AttentionRow tone="blue" icon={MessageCircle} title="Sentiment cluster detected" meta="Poolside service · 6 mentions" onClick={()=>setPage("decisions")}/>
          </div>
          <div className="mt-5 rounded-lg border border-[#8fd6c2]/15 bg-[#8fd6c2]/[.06] p-3">
            <div className="flex gap-2">
              <Sparkles className="mt-0.5 text-[#8fd6c2]" size={15}/>
              <div>
                <div className="text-xs font-semibold text-[#cbeade]">AI has 4 recommendations ready</div>
                <div className="sr-muted mt-1 text-[10px] leading-4">Weather conditions factored into amenity and staffing forecasts.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <DecisionStream demo={demo} setPage={setPage} compact setDemo={setDemo}/>
    </main>
  );
}

function AttentionRow({tone,icon,title,meta,onClick}:{tone:"red"|"amber"|"blue";icon:any;title:string;meta:string;onClick:()=>void}) { return <button onClick={onClick} className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left hover:bg-white/[.04]"><div className={`rounded-lg p-2 ${tone==="red"?"bg-[#d95f58]/10 text-[#ef9a8e]":tone==="amber"?"bg-[#dfae52]/10 text-[#e9bc73]":"bg-[#609bd8]/10 text-[#a9c9e9]"}`}><Icon icon={icon} size={15}/></div><div className="min-w-0 flex-1"><div className="truncate text-xs font-semibold text-[#dfe9e2]">{title}</div><div className="sr-muted mt-1 truncate text-[10px]">{meta}</div></div><ArrowRight size={14} className="text-[#68827d]"/></button>; }

function DecisionStream({demo,setPage,compact=false,setDemo}:{demo:DemoState;setPage:(p:Page)=>void;compact?:boolean;setDemo:React.Dispatch<React.SetStateAction<DemoState>>}) { const actions = demo.connected ? [{time:"10:43:02",label:"Spa marked unavailable",detail:"Maintenance event synced to scheduler",tone:"red",icon:Wrench},{time:"10:43:04",label:"Alternatives recalculated",detail:"3 context-aware amenities ranked for Guest Queue Entry",tone:"teal",icon:Sparkles},{time:"10:43:05",label:"Concierge notified",detail:"Guest-facing recommendation is ready",tone:"blue",icon:Bot},{time:"10:43:07",label:"Manager informed",detail:"Decision chain added to your stream",tone:"amber",icon:Bell}] : [{time:"10:42:18",label:"Preventive inspection recommended",detail:"SPA_HEATER · 84 risk · 3 signals",tone:"red",icon:Wrench},{time:"10:40:09",label:"Spa capacity forecast updated",detail:"8 guests waiting · next slot 90 min",tone:"amber",icon:TicketCheck},{time:"10:36:44",label:"Revenue pace above plan",detail:"+12.4% · weekend demand elevated",tone:"teal",icon:TrendingUp},{time:"10:32:07",label:"Sentiment cluster detected",detail:"Poolside service · 6 mentions",tone:"blue",icon:MessageCircle}]; return <div className="sr-surface sr-enter sr-delay-2 mt-5 p-5"><div className="flex items-start justify-between"><div><div className="sr-kicker">Sense → Predict → Recommend → Act</div><h2 className="mt-2 font-serif text-[23px] text-[#f3eee6]">Intelligence Center</h2><p className="sr-muted mt-1 text-xs">A live, explainable record of intelligence becoming action.</p></div><div className="flex items-center gap-2"><StatusChip pulse>Live stream</StatusChip>{compact&&<button className="sr-button-quiet" onClick={()=>setPage("decisions")}>Open full view <ArrowRight size={14}/></button>}</div></div><div className={`mt-5 ${compact?"grid gap-3 md:grid-cols-4":"space-y-2"}`}>{actions.slice(0,compact?4:10).map((a,i)=><div key={a.time} className={`flex items-start gap-3 rounded-lg border border-white/7 bg-white/[.025] p-3 ${i===0?"sr-live":""}`}><div className={`rounded-lg p-2 ${a.tone==="red"?"bg-[#d95f58]/10 text-[#ef9a8e]":a.tone==="amber"?"bg-[#dfae52]/10 text-[#e9bc73]":a.tone==="blue"?"bg-[#609bd8]/10 text-[#a9c9e9]":"bg-[#65b899]/10 text-[#8fd6c2]"}`}><Icon icon={a.icon} size={14}/></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="text-[11px] font-semibold text-[#e0ebe3]">{a.label}</span><span className="sr-dim font-mono text-[9px]">{a.time}</span></div><div className="sr-muted mt-1 text-[10px] leading-4">{a.detail}</div></div></div>)}</div>{!compact&&<div className="mt-4 flex items-center gap-2"><button className="sr-button sr-button-secondary" onClick={()=>{setDemo(d=>({...d,connected:true,lastAction:"Decision stream expanded"}));toast("Connected chain is now live")}}><Play size={14}/> Simulate next decision</button><span className="sr-muted text-[10px]">Demo controls keep this stream deterministic.</span></div>}</div>; }

function Maintenance({demo,setDemo,setPage,setRole}:{demo:DemoState;setDemo:React.Dispatch<React.SetStateAction<DemoState>>;setPage:(p:Page)=>void;setRole:(r:Role)=>void}) { const [selected,setSelected]=useState("SPA_HEATER"); const assets=[{id:"SPA_HEATER",name:"Guest tower · HVAC unit",risk:84,last:"18 Sep 2026",signal:"Service overdue",tone:"red"},{id:"P-018",name:"Pool plant · circulation pump",risk:62,last:"03 Aug 2026",signal:"Estimated usage elevated",tone:"amber"},{id:"EL-112",name:"East wing · elevator motor",risk:38,last:"22 Sep 2026",signal:"Within baseline",tone:"teal"},{id:"CH-009",name:"Kitchen · chiller unit",risk:27,last:"25 Sep 2026",signal:"Within baseline",tone:"teal"}]; const asset=assets.find(a=>a.id===selected)!; return <main className="sr-content"><SectionHeader eyebrow="Property health / Predictive maintenance" title="Maintenance Intelligence" description="Know what will fail before it interrupts a guest stay." action={<button className="sr-button" onClick={()=>{setDemo(d=>({...d,taskCreated:true,lastAction:"Preventive task created for SPA_HEATER"}));toast("Preventive inspection TICKET-SPA-001 created")}}><Plus size={15}/> Create preventive task</button>}/><div className="sr-grid sr-grid-4"><Stat label="Assets monitored" value="184" delta="100% coverage" icon={Cpu}/><Stat label="At elevated risk" value="7" delta="2 new this week" tone="amber" icon={AlertTriangle}/><Stat label="Avoided downtime" value="31.2h" delta="This quarter" icon={Clock3}/><Stat label="Prediction confidence" value="92%" delta="Across 28 models" tone="blue" icon={Target}/></div><div className="mt-7 grid gap-5 xl:grid-cols-[1.08fr_.92fr]"><div className="sr-surface overflow-hidden"><div className="flex items-center justify-between p-5"><div><div className="sr-kicker">Asset table</div><h2 className="mt-2 font-serif text-[23px]">Risk-ranked assets</h2></div><button className="sr-button-quiet"><ListFilter size={15}/> Filters</button></div><div className="sr-table-row grid-cols-[1.2fr_.7fr_.9fr_.8fr] border-y border-white/8 bg-white/[.02] text-[10px] uppercase tracking-[.1em] text-[#718a85]"><span>Asset</span><span>Risk</span><span>Last service</span><span>Signal</span></div>{assets.map(a=><button key={a.id} onClick={()=>setSelected(a.id)} className={`sr-table-row w-full grid-cols-[1.2fr_.7fr_.9fr_.8fr] text-left ${selected===a.id?"bg-[#8fd6c2]/[.06]":""}`}><div><div className="text-xs font-semibold text-[#dfe9e2]">{a.id}</div><div className="sr-muted mt-1 text-[10px]">{a.name}</div></div><div><div className={`text-sm font-semibold ${a.tone==="red"?"text-[#ef9a8e]":a.tone==="amber"?"text-[#e9bc73]":"text-[#8fd6c2]"}`}>{a.risk}</div><MiniBar value={a.risk} color={a.tone==="red"?"#df746b":a.tone==="amber"?"#d6a458":"#70bda5"}/></div><div className="sr-muted text-[10px]">{a.last}</div><StatusChip tone={a.tone as any}>{a.signal}</StatusChip></button>)}</div><AssetDetail asset={asset} taskCreated={demo.taskCreated} taskAccepted={demo.taskAccepted} taskCompleted={demo.taskCompleted} onCreate={()=>{setDemo(d=>({...d,taskCreated:true,lastAction:"Preventive task created for SPA_HEATER"}));toast("Task TICKET-SPA-001 routed to Engineering")}} onStaff={()=>{setRole("staff");setPage("tasks")}}/></div><div className="mt-5 sr-surface p-5"><div className="sr-kicker">How the prediction was made</div><div className="mt-4 grid gap-3 md:grid-cols-3"><Reason label="Previous faults" value="+34 risk" detail="3 prior service events" tone="red"/><Reason label="Service age" value="+27 risk" detail="Service due" tone="amber"/><Reason label="Estimated usage" value="+23 risk" detail="Estimated usage elevated" tone="blue"/></div></div></main>; }
function Reason({label,value,detail,tone}:{label:string;value:string;detail:string;tone:"red"|"amber"|"blue"}) { return <div className="sr-surface-soft p-4"><div className="flex items-center justify-between"><span className="sr-label">{label}</span><span className={`text-xs font-semibold ${tone==="red"?"text-[#ef9a8e]":tone==="amber"?"text-[#e9bc73]":"text-[#a9c9e9]"}`}>{value}</span></div><div className="sr-muted mt-3 text-[11px] leading-5">{detail}</div></div>; }
function AssetDetail({asset,taskCreated,taskAccepted,taskCompleted,onCreate,onStaff}:{asset:any;taskCreated:boolean;taskAccepted:boolean;taskCompleted?:boolean;onCreate:()=>void;onStaff:()=>void}) { return <div className="sr-surface sr-enter sr-delay-1 p-5"><div className="flex items-start justify-between"><div><div className="sr-kicker">Asset details</div><div className="mt-2 flex items-center gap-3"><h2 className="font-serif text-[25px]">{asset.id}</h2><StatusChip tone="red" pulse>High risk</StatusChip></div><div className="sr-muted mt-1 text-xs">{asset.name}</div></div><button className="sr-button-quiet"><MoreHorizontal size={17}/></button></div><div className="mt-6 rounded-xl border border-[#d95f58]/20 bg-[#d95f58]/[.06] p-4"><div className="flex gap-3"><AlertCircle className="mt-0.5 text-[#ef9a8e]" size={17}/><div><div className="text-sm font-semibold text-[#f4c1b9]">Preventive inspection recommended</div><div className="sr-muted mt-1 text-[11px] leading-5">A service interruption is likely within the next 5–7 days if service remains overdue under high room usage.</div></div></div></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="sr-surface-soft p-3"><div className="sr-label">Risk score</div><div className="sr-number mt-2 text-2xl text-[#ef9a8e]">{asset.risk}<span className="sr-muted text-xs"> / 100</span></div></div><div className="sr-surface-soft p-3"><div className="sr-label">Confidence</div><div className="sr-number mt-2 text-2xl text-[#8fd6c2]">92<span className="sr-muted text-xs">%</span></div></div></div><div className="mt-5"><div className="flex items-center justify-between"><div className="sr-label">Recommended action</div><span className="text-[10px] text-[#8fd6c2]">30 min · low disruption</span></div><div className="mt-3 rounded-lg border border-white/8 bg-white/[.03] p-3"><div className="text-xs font-semibold">Inspect compressor and belt tension</div><div className="sr-muted mt-1 text-[10px]">Route to Engineering · priority P1 · before 14:00 today</div></div></div>{taskCreated?<div className="mt-5 rounded-lg border border-[#8fd6c2]/20 bg-[#8fd6c2]/[.07] p-3"><div className="flex items-center gap-2 text-xs font-semibold text-[#c7efdf]"><CheckCircle2 size={15}/> TICKET-SPA-001 routed to Engineering Department</div><div className="sr-muted mt-1 pl-6 text-[10px]">Engineering · due today · {taskCompleted?"Completed by staff":taskAccepted?"Accepted by staff":"Awaiting acceptance"}</div><button className="sr-button-quiet mt-2 ml-4" onClick={onStaff}>Open staff view <ArrowRight size={13}/></button></div>:<button className="sr-button mt-5 w-full" onClick={onCreate}>Create preventive inspection <ArrowRight size={14}/></button>}</div>; }

function Amenity({demo,setDemo,setPage}:{demo:DemoState;setDemo:React.Dispatch<React.SetStateAction<DemoState>>;setPage:(p:Page)=>void}) { const available=demo.spaState!=="maintenance"; const offer=demo.offerGuest; return <main className="sr-content"><SectionHeader eyebrow="Guest experience / Dynamic scheduling" title="Amenity Control" description="Turn changing capacity into fair, explainable guest outcomes." action={<div className="flex gap-2"><button className="sr-button sr-button-secondary" onClick={()=>setDemo(d=>({...d,spaState:"maintenance",connected:true,lastAction:"Luxury Spa maintenance triggered"}))}><Wrench size={14}/> Trigger maintenance</button><button className="sr-button" onClick={()=>{setDemo(d=>({...d,spaState:"available",offerGuest:"B",lastAction:"Spa slot opened; Next queue entry offered"}));toast("Slot available · queue recalculated")}}><Zap size={14}/> Slot available</button></div>}/><div className="sr-grid sr-grid-4"><Stat label="Seeded amenities" value="7" delta="2 under service" icon={Sparkles}/><Stat label="Waitlist state" value="24" delta="Backend adapter pending" tone="amber" icon={Users}/><Stat label="Availability" value="—" delta="Backend adapter pending" icon={Gauge}/><Stat label="Offer state" value="8" delta="Session only" tone="blue" icon={Timer}/></div><div className="mt-7 grid gap-5 xl:grid-cols-[.78fr_1.22fr]"><div className="sr-surface overflow-hidden"><div className="p-5"><div className="sr-kicker">Amenity portfolio</div><h2 className="mt-2 font-serif text-[23px]">Control center</h2></div><AmenityRow name="Luxury Spa" kind="Wellness · 6 slots" state={demo.spaState} selected={true} onClick={()=>toast("Luxury Spa selected")}/><AmenityRow name="Cedar Sauna" kind="Wellness · 4 slots" state="open"/><AmenityRow name="Yoga Studio" kind="Fitness · 12 slots" state="open"/><AmenityRow name="Infinity Pool" kind="Recreation · open" state="open"/></div><div className="sr-surface p-5"><div className="flex items-start justify-between"><div><div className="sr-kicker">Luxury Spa · Smart waitlist</div><h2 className="mt-2 font-serif text-[23px]">Priority scheduler</h2><p className="sr-muted mt-1 text-xs">Deterministic scoring · recalculated on every slot change</p></div><StatusChip tone={available?"teal":"red"} pulse>{available?"Capacity active":"Maintenance mode"}</StatusChip></div>{!available?<div className="mt-6 rounded-xl border border-[#ef9a8e]/20 bg-[#ef9a8e]/[.06] p-5"><div className="flex gap-3"><Wrench className="text-[#ef9a8e]" size={18}/><div><div className="text-sm font-semibold text-[#f1bbb4]">Luxury Spa is temporarily unavailable</div><div className="sr-muted mt-1 text-[11px] leading-5">The scheduler paused new offers, ranked alternatives, and notified Concierge. No guest is left without a next step.</div></div></div><button className="sr-button mt-5" onClick={()=>setPage("connected")}>View connected intelligence <GitBranch size={14}/></button></div>:<><div className="mt-6 grid grid-cols-3 gap-3"><QueueStat label="Waiting" value="8"/><QueueStat label="Next slot" value="Next opportunity"/><QueueStat label="Offer TTL" value="Configurable TTL"/></div><div className="mt-6 overflow-hidden rounded-xl border border-white/8"><div className="grid grid-cols-[.5fr_1.4fr_.8fr_.8fr] gap-3 bg-white/[.03] px-4 py-3 text-[9px] uppercase tracking-[.12em] text-[#718a85]"><span>#</span><span>Guest</span><span>Score</span><span>State</span></div><WaitlistRow rank="1" name="Guest Queue Entry" score="94" reason="Suite · 3 nights" state={offer==="B"?"Offered":"Queued"} tone={offer==="B"?"teal":"neutral"}/><WaitlistRow rank="2" name="Queue Entry #14" score="88" reason="Priority · 2 nights" state={offer==="C"?"Expired":"Queued"} tone={offer==="C"?"amber":"neutral"}/><WaitlistRow rank="3" name="Queue Entry #15" score="82" reason="Villa · 5 nights" state={offer==="C"?"Offered":"Queued"} tone={offer==="C"?"teal":"neutral"}/></div><div className="mt-5 flex flex-wrap gap-2"><button className="sr-button sr-button-secondary" onClick={()=>{setDemo(d=>({...d,offerGuest:"B",lastAction:"90-second offer sent to Next queue entry"}));toast("Next queue entry has 90 seconds to accept")}}><Send size={14}/> Offer next guest</button><button className="sr-button-quiet" onClick={()=>{setDemo(d=>({...d,offerGuest:"C",lastAction:"Next queue entry timed out; Following queue entry offered"}));toast("Offer expired · Following queue entry is next")}}><Timer size={14}/> Simulate timeout</button></div></>}</div></div><div className="sr-surface mt-5 p-5"><div className="flex items-center justify-between"><div><div className="sr-kicker">Explainable priority</div><h2 className="mt-2 font-serif text-[21px]">Why Next queue entry is next</h2></div><button className="sr-button-quiet" onClick={()=>toast("Priority scoring is deterministic and auditable")}>How it works <CircleHelp size={14}/></button></div><div className="mt-5 grid gap-3 md:grid-cols-4"><Reason label="Stay length" value="+24 pts" detail="Backend data" tone="blue"/><Reason label="Guest tier" value="+22 pts" detail="Backend policy" tone="amber"/><Reason label="Wait time" value="+20 pts" detail="Session data" tone="red"/><Reason label="Fit" value="+22 pts" detail="Backend preference" tone="blue"/></div></div></main>; }
function AmenityRow({name,kind,state,selected,onClick}:{name:string;kind:string;state:string;selected?:boolean;onClick?:()=>void}) { const open=state==="open"; return <button onClick={onClick} className={`flex w-full items-center gap-3 border-t border-white/7 p-4 text-left hover:bg-white/[.035] ${selected?"bg-[#8fd6c2]/[.06]":""}`}><div className="grid h-9 w-9 place-items-center rounded-lg bg-[#b8955c]/10 text-[#d5b582]"><Sparkles size={16}/></div><div className="min-w-0 flex-1"><div className="text-xs font-semibold">{name}</div><div className="sr-muted mt-1 text-[10px]">{kind}</div></div><StatusChip tone={open?"teal":"red"}>{open?"Open":state}</StatusChip></button>; }
function QueueStat({label,value}:{label:string;value:string}) { return <div className="sr-surface-soft p-3"><div className="sr-label">{label}</div><div className="sr-number mt-2 text-xl font-semibold">{value}</div></div>; }
function WaitlistRow({rank,name,score,reason,state,tone}:{rank:string;name:string;score:string;reason:string;state:string;tone:any}) { return <div className="grid grid-cols-[.5fr_1.4fr_.8fr_.8fr] items-center gap-3 border-t border-white/7 px-4 py-3"><span className="font-mono text-xs text-[#718a85]">{rank}</span><div><div className="text-[11px] font-semibold">{name}</div><div className="sr-muted mt-1 text-[9px]">{reason}</div></div><span className="text-sm font-semibold text-[#8fd6c2]">{score}</span><StatusChip tone={tone}>{state}</StatusChip></div>; }

function StaffHome({demo,setDemo,setPage}:{demo:DemoState;setDemo:React.Dispatch<React.SetStateAction<DemoState>>;setPage:(p:Page)=>void}) {
  return (
    <main className="sr-content">
      <SectionHeader eyebrow="Engineering department · Thursday 26 September" title="Engineering work queue" description="You have 4 tasks today. One new priority task needs your attention." action={<StatusChip pulse>On shift · 08:00–16:00</StatusChip>}/>
      <div className="sr-grid sr-grid-3">
        <Stat label="My tasks" value="4" delta="1 urgent" tone="amber" icon={ListFilter}/>
        <Stat label="Completed today" value="7" delta="On track" icon={CheckCircle2}/>
        <Stat label="Team status" value="3 / 4" delta="Engineering online" tone="blue" icon={Users}/>
      </div>
      
      {/* Live Field Weather for Staff */}
      <StaffWeatherCard />

      <div className="mt-7 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <div className="sr-surface p-5">
          <div className="flex items-center justify-between">
            <div><div className="sr-kicker">Priority queue</div><h2 className="mt-2 font-serif text-[23px]">Tasks that need you</h2></div>
            <button className="sr-button-quiet" onClick={()=>setPage("tasks")}>View all <ArrowRight size={14}/></button>
          </div>
          <div className="mt-5 space-y-3">
            <TaskCard demo={demo} task={{id:"TICKET-SPA-001",title:"Inspect compressor & belt tension",location:"Guest Tower · HVAC unit SPA_HEATER",priority:"P1",due:"Due today · 14:00",status:demo.taskCompleted?"Completed":demo.taskAccepted?"In progress":demo.taskCreated?"New":"Recommended"}} onAccept={()=>{setDemo(d=>({...d,taskCreated:true,taskAccepted:true,lastAction:"TICKET-SPA-001 accepted by Engineering Department"}));toast("Task accepted · manager notified")}} onComplete={()=>{setDemo(d=>({...d,taskCompleted:true,lastAction:"TICKET-SPA-001 completed by Engineering Department"}));toast("Inspection completed · manager notified")}} onOpen={()=>setPage("tasks")}/>
            <TaskCard demo={demo} task={{id:"MT-2041",title:"Pool plant pressure check",location:"Pool plant room · P-018",priority:"P2",due:"Due today · 16:30",status:"Scheduled"}} onAccept={()=>toast("Task accepted")}/>
          </div>
        </div>
        <div className="sr-surface p-5">
          <div className="sr-kicker">Department head</div>
          <h2 className="mt-2 font-serif text-[23px]">Autonomous briefing</h2>
          <div className="mt-5 rounded-xl border border-[#8fd6c2]/16 bg-[#8fd6c2]/[.06] p-4">
            <div className="flex gap-3">
              <Bot className="text-[#8fd6c2]" size={18}/>
              <div>
                <div className="text-xs font-semibold">Engineering is balanced for today.</div>
                <div className="sr-muted mt-2 text-[11px] leading-5">I routed SPA_HEATER to you because of your HVAC certification and proximity to Guest Tower. Weather conditions are clear for outdoor checks.</div>
              </div>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between"><span className="sr-muted text-[11px]">Coverage</span><span className="text-xs font-semibold">87%</span></div>
            <MiniBar value={87}/>
            <div className="flex items-center justify-between"><span className="sr-muted text-[11px]">Response SLA</span><span className="text-xs font-semibold text-[#8fd6c2]">98.4%</span></div>
            <MiniBar value={98} color="#8fd6c2"/>
          </div>
        </div>
      </div>
    </main>
  );
}

function TaskCard({demo,task,onAccept,onOpen,onComplete}:{demo:DemoState;task:any;onAccept:()=>void;onOpen?:()=>void;onComplete?:()=>void}) { return <div className={`rounded-xl border p-4 ${task.id==="TICKET-SPA-001"&&demo.taskCreated?"border-[#8fd6c2]/22 bg-[#8fd6c2]/[.045]":"border-white/8 bg-white/[.025]"}`}><div className="flex items-start gap-3"><div className={`rounded-lg p-2 ${task.priority==="P1"?"bg-[#d95f58]/10 text-[#ef9a8e]":"bg-[#e0ac53]/10 text-[#e9bc73]"}`}><Wrench size={16}/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-semibold">{task.title}</span><StatusChip tone={task.priority==="P1"?"red":"amber"}>{task.priority}</StatusChip></div><div className="sr-muted mt-1 text-[10px]">{task.id} · {task.location}</div><div className="sr-muted mt-3 flex items-center gap-2 text-[10px]"><Clock3 size={12}/>{task.due}</div></div><StatusChip tone={task.status==="In progress"?"teal":task.status==="New"?"blue":"neutral"}>{task.status}</StatusChip></div><div className="mt-4 flex gap-2 border-t border-white/7 pt-3"><button className="sr-button sr-button-secondary" onClick={onOpen}><ArrowRight size={13}/> Open task</button>{task.status!=="In progress"&&task.status!=="Completed"&&<button className="sr-button" onClick={onAccept}><Check size={13}/> Accept task</button>}{task.status==="In progress"&&onComplete&&<button className="sr-button" onClick={onComplete}><CheckCircle2 size={13}/> Complete</button>}</div></div>; }
function StaffTasks({demo,setDemo}:{demo:DemoState;setDemo:React.Dispatch<React.SetStateAction<DemoState>>}) { return <main className="sr-content"><SectionHeader eyebrow="My work queue" title="Tasks" description="Clear priorities, complete actions, keep the resort moving." action={<button className="sr-button sr-button-secondary" onClick={()=>toast("Task filters opened")}><ListFilter size={14}/> Filter</button>}/><div className="sr-surface overflow-hidden"><div className="flex flex-wrap items-center gap-2 border-b border-white/8 p-4"><StatusChip tone="teal">All · 4</StatusChip><StatusChip tone="red">Urgent · 1</StatusChip><StatusChip>Upcoming · 2</StatusChip><StatusChip>Completed · 1</StatusChip></div><div className="space-y-3 p-4"><TaskCard demo={demo} task={{id:"TICKET-SPA-001",title:"Inspect compressor & belt tension",location:"Guest Tower · HVAC unit SPA_HEATER",priority:"P1",due:"Due today · 14:00",status:demo.taskCompleted?"Completed":demo.taskAccepted?"In progress":demo.taskCreated?"New":"Recommended"}} onAccept={()=>{setDemo(d=>({...d,taskCreated:true,taskAccepted:true,lastAction:"TICKET-SPA-001 accepted by Engineering Department"}));toast("Task accepted")}} onComplete={()=>{setDemo(d=>({...d,taskCompleted:true,lastAction:"TICKET-SPA-001 completed by Engineering Department"}));toast("Task completed · manager notified")}}/><TaskCard demo={demo} task={{id:"MT-2041",title:"Pool plant pressure check",location:"Pool plant room · P-018",priority:"P2",due:"Due today · 16:30",status:"Scheduled"}} onAccept={()=>toast("Task accepted")}/><TaskCard demo={demo} task={{id:"RM-018",title:"Replace corridor light",location:"East wing · Level 2",priority:"P3",due:"Tomorrow · 10:00",status:"Scheduled"}} onAccept={()=>toast("Task accepted")}/></div></div></main>; }

function GuestHome({setPage}:{setPage:(p:Page)=>void}) {
  return (
    <main className="sr-content">
      <div className="sr-phone-wrap">
        <div className="sr-phone-card">
          <div className="sr-guest-hero">
            <img
              src={resortImg}
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes("resort-hero.jpg") && target.src !== resortFallback) {
                  target.src = resortFallback;
                } else {
                  target.src = resortWebFallback;
                }
              }}
              className="sr-hero-image"
              alt="Sunridge Cove resort"
            />
            <div className="absolute bottom-5 left-5 z-10">
              <div className="sr-kicker text-[#d5b582]">Welcome back</div>
              <h1 className="mt-1 font-serif text-3xl">Your stay, in flow.</h1>
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#d5b582]">Sunridge Cove</div>
                <div className="mt-1 text-base font-semibold text-[#fcf5e8]">Room 101 · Until 30 Sep</div>
              </div>
              <StatusChip tone="amber">Day 2 of 5</StatusChip>
            </div>

            {/* Live Resort Weather on Guest Dashboard */}
            <GuestWeatherCard setPage={setPage} />

            <div className="mt-6 grid grid-cols-2 gap-3">
              <GuestAction icon={Bot} label="Ask concierge" onClick={()=>setPage("concierge")}/>
              <GuestAction icon={Sparkles} label="Explore amenities" onClick={()=>setPage("amenities")}/>
              <GuestAction icon={CalendarDays} label="My reservations" onClick={()=>setPage("reservations")}/>
              <GuestAction icon={ArrowRight} label="Request buggy" onClick={()=>setPage("buggy")}/>
            </div>

            {/* Active Today's Reservation Shortcut Card */}
            <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-emerald-900/15 to-transparent p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">Today's Reservations</span>
                </div>
                <button
                  onClick={() => setPage("reservations")}
                  className="text-xs font-bold text-[#d5b582] hover:underline flex items-center gap-1"
                >
                  <span>View all</span>
                  <ArrowRight size={12} />
                </button>
              </div>
              <div className="mt-2 text-xs font-semibold text-[#fcf5e8]">
                🍽️ The Cove Seafood & Grill · Today at 20:30 (Table for 2)
              </div>
              <div className="mt-1 text-[11px] text-[#8ca6a1]">
                Oceanfront Terrace · Anniversary celebration setup
              </div>
            </div>
            
            <div className="mt-4 rounded-2xl border border-[#d5b582]/25 bg-gradient-to-br from-[#d5b582]/[.08] to-white/[.02] p-4.5 shadow-md">
              <div className="flex items-start gap-3.5">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#d5b582]/15 text-[#d5b582] border border-[#d5b582]/30 shadow-inner">
                  <Sparkles size={18} />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#fcf5e8]">Curated for your afternoon</div>
                  <div className="mt-1 text-xs sm:text-sm leading-relaxed text-[#d4ded7]">Explore indoor snooker, pool, and outdoor cricket courts.</div>
                  <button className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-[#d5b582] transition-colors hover:text-[#eed2a4]" onClick={()=>setPage("amenities")}>
                    <span>View recommendation</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <GuestBottom active="home" setPage={setPage}/>
        </div>
      </div>
    </main>
  );
}

function GuestAction({icon,label,onClick}:{icon:any;label:string;onClick:()=>void}) {
  return (
    <button
      onClick={onClick}
      className="sr-surface-soft flex items-center gap-3.5 p-3.5 rounded-xl border border-white/8 text-left transition-all hover:bg-white/[.08] hover:border-[#d5b582]/30 shadow-sm"
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#d5b582]/15 text-[#d5b582] border border-[#d5b582]/25 shadow-inner">
        <Icon icon={icon} size={18}/>
      </div>
      <span className="text-xs sm:text-sm font-semibold text-[#fcf5e8]">{label}</span>
    </button>
  );
}
function GuestBottom({active,setPage}:{active:string;setPage:(p:Page)=>void}) {
  return (
    <div className="sr-bottom-nav">
      <button className={active==="home"?"active":""} onClick={()=>setPage("guest-home")}>
        <HomeIcon size={18}/>
        <span className="text-xs font-medium">Home</span>
      </button>
      <button className={active==="reservations"?"active":""} onClick={()=>setPage("reservations")}>
        <CalendarDays size={18}/>
        <span className="text-xs font-medium">Bookings</span>
      </button>
      <button className={active==="amenities"?"active":""} onClick={()=>setPage("amenities")}>
        <Sparkles size={18}/>
        <span className="text-xs font-medium">Amenities</span>
      </button>
      <button className={active==="concierge"?"active":""} onClick={()=>setPage("concierge")}>
        <Bot size={18}/>
        <span className="text-xs font-medium">Concierge</span>
      </button>
      <button className={active==="profile"?"active":""} onClick={()=>setPage("profile")}>
        <UserRound size={18}/>
        <span className="text-xs font-medium">Profile</span>
      </button>
    </div>
  );
}

function Concierge({demo,setDemo,setPage}:{demo:DemoState;setDemo:React.Dispatch<React.SetStateAction<DemoState>>;setPage:(p:Page)=>void}) {
  const [asked,setAsked]=useState(demo.guestAsked);
  return (
    <main className="sr-content">
      <div className="sr-phone-wrap">
        <div className="sr-phone-card">
          <div className="flex items-center gap-3 border-b border-white/8 p-5">
            <button className="sr-button-quiet" onClick={()=>setPage("guest-home")}><ArrowLeft size={17}/></button>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#d5b582]/15 text-[#d5b582] border border-[#d5b582]/30 shadow-inner"><Bot size={20}/></div>
            <div>
              <div className="text-base font-semibold text-[#fcf5e8]">AI Concierge</div>
              <div className="text-xs text-[#a8bfb8]">Here to make your stay effortless</div>
            </div>
            <StatusChip tone="teal" pulse>Online</StatusChip>
          </div>
          <div className="min-h-[470px] p-5">
            <div className="sr-kicker text-[#d5b582]">Personalized for Maya</div>
            <h1 className="mt-1.5 font-serif text-3xl font-semibold text-[#fcf5e8]">How can I help?</h1>
            {!asked ? (
              <>
                <div className="mt-8 flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-[#7d6847] px-4 py-3 text-sm leading-relaxed text-[#fcf5e8] shadow-sm">
                    I want to use the spa.
                  </div>
                </div>
                <div className="mt-5 flex gap-3.5">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#d5b582]/15 text-[#d5b582] border border-[#d5b582]/25"><Bot size={16}/></div>
                  <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white/[.07] px-4 py-3 text-sm leading-relaxed text-[#ebe7dc] border border-white/8 shadow-sm">
                    Luxury Spa is currently full, but I can join you to the waitlist. I also found a few options that match your wellness preferences.
                  </div>
                </div>
                <button className="sr-button mt-6 w-full text-sm font-semibold" onClick={()=>{setAsked(true);setDemo(d=>({...d,guestAsked:true,lastAction:"Concierge recommended alternatives"}))}}>
                  Show my options <ArrowRight size={15}/>
                </button>
              </>
            ) : (
              <>
                <div className="mt-6 rounded-2xl border border-[#e9bc73]/25 bg-[#e9bc73]/[.07] p-4.5 shadow-sm">
                  <div className="flex items-start gap-3.5">
                    <Timer className="mt-0.5 text-[#e9bc73]" size={19}/>
                    <div>
                      <div className="text-sm font-bold text-[#fcf5e8]">Luxury Spa · Currently full</div>
                      <div className="mt-1 text-xs sm:text-sm leading-relaxed text-[#d4ded7]">Join the smart waitlist. We’ll offer a slot in priority order.</div>
                      <button className="sr-button sr-button-secondary mt-3 text-xs font-semibold" onClick={()=>{toast("You're on the waitlist · position 3");setPage("waitlist")}}>
                        Join waitlist
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-7">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#d5b582]">Recommended for you</div>
                  <h2 className="mt-1.5 font-serif text-2xl font-semibold text-[#fcf5e8]">While you wait</h2>
                  <div className="mt-4 space-y-3">
                    <Alternative name="Cedar Sauna" meta="Heat therapy · 45 min" reason="Similar wellness profile" onClick={()=>{setDemo(d=>({...d,lastAction:"Cedar Sauna reserved"}));setPage("waitlist")}}/>
                    <Alternative name="Yoga Studio" meta="Outdoor · 60 min · Available" reason="Available at 17:30" onClick={()=>toast("Yoga Studio details opened")}/>
                    <Alternative name="Infinity Pool" meta="Open access · cabana 4" reason="A calm alternative nearby" onClick={()=>toast("Infinity Pool details opened")}/>
                  </div>
                </div>
              </>
            )}
            <div className="mt-8 flex flex-wrap gap-2">
              <button className="sr-chip text-xs" onClick={()=>toast("☀️ Today's Weather in Goa: 28.4°C Sunny & Coastal Breeze · Perfect for Golf & Cricket!")}>☀️ Today's weather?</button>
              <button className="sr-chip text-xs" onClick={()=>toast("What's nearby? ready")}>What's nearby?</button>
              <button className="sr-chip text-xs" onClick={()=>toast("Dinner recommendations ready")}>Dinner tonight</button>
              <button className="sr-chip text-xs" onClick={()=>toast("Buggy request started")}>Call a buggy</button>
            </div>
          </div>
          <GuestBottom active="concierge" setPage={setPage}/>
        </div>
      </div>
    </main>
  );
}

function Alternative({name,meta,reason,onClick}:{name:string;meta:string;reason:string;onClick:()=>void}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3.5 rounded-xl border border-white/8 bg-white/[.025] p-3.5 text-left transition-all hover:bg-white/[.06] hover:border-[#d5b582]/30 shadow-sm"
    >
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#d5b582]/12 text-[#d5b582] border border-[#d5b582]/25 shadow-inner">
        <Sparkles size={18}/>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-[#fcf5e8]">{name}</div>
        <div className="mt-0.5 text-xs text-[#a8bfb8]">{meta}</div>
        <div className="mt-1.5 text-xs font-medium text-[#d5b582]">Why this? · {reason}</div>
      </div>
      <ArrowRight size={15} className="text-[#8c8371]"/>
    </button>
  );
}

function CoveMenuModal({ onClose, onReserve }: { onClose: () => void; onReserve: () => void }) {
  const [activePage, setActivePage] = useState<1 | 2>(1);

  const page1Items = [
    {
      name: "Rock Lobster Bisque with Truffle Froth",
      tag: "👑 Chef's Signature",
      price: "₹750",
      type: "Soup & Raw Bar",
      desc: "Slow-simmered rock lobster reduction finished with French cognac, black truffle cream froth, and toasted herbed brioche points."
    },
    {
      name: "Butter Garlic Jumbo Tiger Prawns (4-pc)",
      tag: "🦀 Fresh Catch",
      price: "₹1,150",
      type: "Coastal Starters",
      desc: "Arabian Sea jumbo tiger prawns sautéed in churned Goan garlic herb butter, deglazed with sauvignon blanc and fresh garden parsley."
    },
    {
      name: "Goan Recheado Rava Surmai Steaks",
      tag: "🌶️ Coastal Spice",
      price: "₹850",
      type: "Coastal Starters",
      desc: "Fresh Kingfish steaks marinated in spicy-tangy homemade Goan toddy vinegar recheado masala, coated in golden semolina and pan-crisped."
    },
    {
      name: "Wood-Charred Calamari & Squid Chimichurri",
      tag: "🔥 Charcoal Grill",
      price: "₹680",
      type: "Coastal Starters",
      desc: "Tender local squids wood-charred over coconut embers, tossed with bird's eye chili, smoked sea salt, kaffir lime, and roasted garlic aioli."
    },
    {
      name: "Mangrove Crab Claws in Fiery Xec Xec",
      tag: "🦀 Fresh Catch",
      price: "₹950",
      type: "Coastal Starters",
      desc: "Fresh mangrove crab claws braised in roasted Goan coconut, coriander seeds, black peppercorn, and toasted star anise broth."
    },
    {
      name: "Yellowfin Tuna Carpaccio & Capers",
      tag: "✨ Cold Raw Bar",
      price: "₹820",
      type: "Soup & Raw Bar",
      desc: "Sashimi-grade Arabian Sea yellowfin tuna sliced paper-thin, dressed with cold-pressed olive oil, capers, pink sea salt, lime zest, and micro basil."
    }
  ];

  const page2Items = [
    {
      name: "The Grand Cove Royal Seafood Platter (Serves 2-3)",
      tag: "👑 Royal Showpiece",
      price: "₹3,400",
      type: "Signature Platters",
      desc: "Charcoal-grilled whole butterflied Arabian Sea lobster, 4 jumbo tiger prawns, butter garlic crab claws, tandoori surmai fillets, crispy calamari, saffron butter rice, and trio of house dips."
    },
    {
      name: "Whole Butterflied Arabian Sea Lobster",
      tag: "🦞 Live Catch",
      price: "₹2,600",
      type: "Lobster & Fish Entrees",
      desc: "Choice of Classic Lobster Thermidor (baked with Gruyère cheese, white wine & Dijon cream) or Charcoal-Grilled with Lemon Garlic Churned Butter & parsley potato puree."
    },
    {
      name: "Traditional Goan Prawn Curry with Red Rice",
      tag: "🌶️ Traditional Heritage",
      price: "₹920",
      type: "Curries & Regional Mains",
      desc: "Authentic coastal coconut curry infused with fresh ground spices, kokum petals, triphala, and sweet ocean prawns, served with local red rice and warm poee."
    },
    {
      name: "Pan-Seared Chilean Sea Bass Fillet",
      tag: "✨ Gourmet Entree",
      price: "₹1,850",
      type: "Lobster & Fish Entrees",
      desc: "Crispy-skin wild Chilean sea bass over a bed of saffron-infused arborio risotto, wilted asparagus, and lemon-caper beurre blanc."
    },
    {
      name: "Charcoal Tandoori Whole Pomfret",
      tag: "🔥 Clay Oven",
      price: "₹1,200",
      type: "Lobster & Fish Entrees",
      desc: "Whole fresh white pomfret marinated in Kashmiri chili, crushed ajwain, cold-pressed mustard oil, and hung curd, roasted to perfection in charcoal tandoor."
    },
    {
      name: "Mangrove Mud Crab Sukka with Poi",
      tag: "🦀 Local Specialty",
      price: "₹1,350",
      type: "Curries & Regional Mains",
      desc: "Fresh mud crab tossed in caramelized onions, curry leaves, crushed black pepper, toasted coconut slivers, and served with freshly baked Goan poi."
    },
    {
      name: "Warm Traditional Bebinca & Coconut Gelato",
      tag: "🍨 Coastal Dessert",
      price: "₹450",
      type: "Artisan Desserts",
      desc: "Seven-layered traditional Indo-Portuguese spiced coconut cake served warm alongside artisanal toasted coconut cream gelato."
    }
  ];

  const currentList = activePage === 1 ? page1Items : page2Items;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in" onClick={onClose}>
      <div className="relative flex flex-col w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl border border-[#d5b582]/40 bg-[#122020] text-[#ebe7dc] shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="border-b border-[#d5b582]/20 bg-gradient-to-r from-[#172b2a] via-[#1f3735] to-[#172b2a] p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#d5b582]/15 text-[#d5b582] border border-[#d5b582]/30 shadow-inner">
                <Utensils size={22} />
              </div>
              <div>
                <span className="rounded-md bg-[#d5b582]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#d5b582]">
                  Oceanfront Fine Dining Menu
                </span>
                <h2 className="mt-1 font-serif text-2xl font-semibold text-[#fcf5e8]">The Cove Signature Seafood & Grill</h2>
                <div className="mt-1 flex items-center gap-3 text-xs text-[#8ca6a1]">
                  <span>📍 Beachfront Ocean Terrace</span>
                  <span>·</span>
                  <span>👨‍🍳 Chef Saurabh Naik</span>
                  <span>·</span>
                  <span className="text-[#d5b582]">Fresh Arabian Sea Catch</span>
                </div>
              </div>
            </div>
            <button className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-[#8ca6a1] hover:bg-white/10 hover:text-white" onClick={onClose}>
              ✕
            </button>
          </div>

          {/* 2-Page Navigation Tabs */}
          <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-black/30 p-1.5 border border-white/8">
            <button
              onClick={() => setActivePage(1)}
              className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
                activePage === 1
                  ? "bg-[#d5b582] text-[#122020] shadow-md font-bold"
                  : "text-[#8ca6a1] hover:text-[#ebe7dc] hover:bg-white/5"
              }`}
            >
              <span>📄 Page 1</span>
              <span>·</span>
              <span>Raw Bar, Soups & Starters</span>
            </button>
            <button
              onClick={() => setActivePage(2)}
              className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
                activePage === 2
                  ? "bg-[#d5b582] text-[#122020] shadow-md font-bold"
                  : "text-[#8ca6a1] hover:text-[#ebe7dc] hover:bg-white/5"
              }`}
            >
              <span>📄 Page 2</span>
              <span>·</span>
              <span>Lobster, Curries & Royal Platters</span>
            </button>
          </div>
        </div>

        {/* Menu Items Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5 scrollbar-thin">
          <div className="flex items-center justify-between pb-1 border-b border-white/5">
            <span className="text-xs uppercase tracking-wider text-[#d5b582] font-semibold">
              {activePage === 1 ? "Starters & Fresh Catch Selections" : "Signature Seafood Mains & Royal Platters"}
            </span>
            <span className="text-[11px] text-[#8ca6a1]">All prices in INR (₹) exclusive of taxes</span>
          </div>

          {currentList.map((item, idx) => (
            <div
              key={idx}
              className="group relative rounded-2xl border border-white/8 bg-white/[.025] p-4 transition-all hover:border-[#d5b582]/40 hover:bg-white/[.05]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-[#d5b582]/15 px-2 py-0.5 text-[10px] font-bold text-[#d5b582]">
                      {item.tag}
                    </span>
                    <span className="text-[10px] text-[#8ca6a1] font-mono">[{item.type}]</span>
                  </div>
                  <h3 className="mt-1.5 font-serif text-base font-semibold text-[#fcf5e8] group-hover:text-[#d5b582] transition-colors">
                    {item.name}
                  </h3>
                  <p className="sr-muted mt-1 text-xs leading-relaxed">{item.desc}</p>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="font-mono text-base font-bold text-[#d5b582]">{item.price}</span>
                  <button
                    onClick={() => {
                      toast.success(`Selected for Table Order: ${item.name}`, {
                        description: `Price: ${item.price} · Added to order preference`
                      });
                    }}
                    className="mt-2 rounded-md bg-white/5 px-2 py-1 text-[10px] font-medium text-[#c4ded6] hover:bg-[#d5b582]/20 hover:text-[#d5b582]"
                  >
                    + Note for Table
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer with Page Indicator & Booking Action */}
        <div className="border-t border-[#d5b582]/20 bg-[#162928] p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              disabled={activePage === 1}
              onClick={() => setActivePage(1)}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold disabled:opacity-30 hover:bg-white/5"
            >
              ← Page 1
            </button>
            <span className="font-mono text-xs text-[#d5b582]">Page {activePage} of 2</span>
            <button
              disabled={activePage === 2}
              onClick={() => setActivePage(2)}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold disabled:opacity-30 hover:bg-white/5"
            >
              Page 2 →
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className="sr-button-quiet text-xs" onClick={onClose}>
              Close Menu
            </button>
            <button
              className="sr-button"
              onClick={() => {
                onClose();
                onReserve();
              }}
            >
              Reserve Table For This Menu <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BarMenuModal({ onClose, onReserve }: { onClose: () => void; onReserve: () => void }) {
  const [activePage, setActivePage] = useState<1 | 2 | 3 | 4 | 5>(1);

  const page1Items = [
    {
      name: "Hapusa Himalayan Artisanal Juniper Gin (30ml)",
      tag: "🏔️ Himalayan Botanical",
      price: "₹680",
      type: "Artisanal Gin",
      desc: "Small-batch copper-pot distilled with wild Himalayan juniper, coriander seed, turmeric, mango, and fresh gondhoraj lime peel."
    },
    {
      name: "Monkey 47 Schwarzwald Dry Gin (30ml)",
      tag: "🌿 Ultra Premium",
      price: "₹890",
      type: "Artisanal Gin",
      desc: "Complex German gin crafted with 47 hand-picked botanicals, lingonberries, elderflower, and spring water from the Black Forest."
    },
    {
      name: "Hendrick's Orbium & Cucumber Tonic (Cocktail)",
      tag: "🍸 Signature Highball",
      price: "₹850",
      type: "Gin Cocktails",
      desc: "Hendrick's Orbium infused with blue lotus blossom, wormwood, fresh ribbon cucumber, pink peppercorns, and Fever-Tree Indian tonic."
    },
    {
      name: "Blood Orange & Thai Basil Gin Fizz",
      tag: "✨ Sunset Special",
      price: "₹740",
      type: "Gin Cocktails",
      desc: "Artisanal dry gin shaken with fresh blood orange reduction, bruised Thai basil leaves, raw sugarcane syrup, and sparkling soda."
    },
    {
      name: "Grey Goose French Winter Wheat Vodka (30ml)",
      tag: "🇫🇷 French Luxury",
      price: "₹720",
      type: "Premium Vodka",
      desc: "Crafted from single-origin French soft winter wheat and spring water naturally filtered through Gensac Champagne limestone."
    },
    {
      name: "Belvedere Pure Rye Polish Vodka (30ml)",
      tag: "🌾 Heritage Rye",
      price: "₹690",
      type: "Premium Vodka",
      desc: "Quadruple-distilled Polish Dankowskie Diamond rye delivering a velvet texture with subtle vanilla and cracked white pepper notes."
    },
    {
      name: "Sunset Espresso Kahlúa Martini",
      tag: "☕ Mixology Signature",
      price: "₹780",
      type: "Vodka Cocktails",
      desc: "Belvedere vodka shaken with freshly pulled single-estate Kalledevarapura espresso, Mexican coffee liqueur, and dark chocolate shavings."
    }
  ];

  const page2Items = [
    {
      name: "The Macallan Double Cask 12YO (30ml)",
      tag: "👑 Speyside Luxury",
      price: "₹1,250",
      type: "Single Malt Scotch",
      desc: "Matured in American and European sherry-seasoned oak casks. Balanced notes of rich dried fruits, warm butterscotch, and candied citrus."
    },
    {
      name: "Glenfiddich 15YO Solera Reserve (30ml)",
      tag: "🥃 Solera Vat Matured",
      price: "₹1,100",
      type: "Single Malt Scotch",
      desc: "Aged in European oak sherry casks and new oak casks, harmonized in a handcrafted Solera vat with warm winter spice and honeyed fudge."
    },
    {
      name: "Talisker 10YO Maritime Peat Malt (30ml)",
      tag: "🌊 Peated Island Malt",
      price: "₹980",
      type: "Single Malt Scotch",
      desc: "Distilled on the rugged Isle of Skye. Intense maritime smoke, rich dried-fruit sweetness, cracked black pepper, and salty sea spray finish."
    },
    {
      name: "Amrut Fusion Indian Single Malt (30ml)",
      tag: "🇮🇳 Award Winner",
      price: "₹820",
      type: "Indian Single Malt",
      desc: "Crafted from peated Scottish barley and unpeated Indian malted barley. Rich palate of peat-smoke, barley oak, citrus, and dark chocolate."
    },
    {
      name: "Paul John Bold Peated Goa Single Malt (30ml)",
      tag: "🌴 Local Goa Masterpiece",
      price: "₹750",
      type: "Indian Single Malt",
      desc: "Locally distilled in Goa with Islay peated malt. Heavy wafts of sweet peat smoke, wildflower honey, and toasted oak spice."
    },
    {
      name: "Johnnie Walker Blue Label Blended Scotch (30ml)",
      tag: "💎 Rare Reserve",
      price: "₹2,200",
      type: "Blended Scotch",
      desc: "An extraordinary blend of Scotland’s rarest, most elusive whiskies with velvety layers of honey, hazelnut, and dark cocoa smoke."
    },
    {
      name: "Woodford Reserve Kentucky Straight Bourbon (30ml)",
      tag: "🌽 Kentucky Bourbon",
      price: "₹840",
      type: "Bourbon & Rye",
      desc: "Complex American bourbon containing more than 200 detectable flavor notes from bold grain and wood to sweet aromatics and spice."
    },
    {
      name: "Smoked Applewood Old Fashioned (Signature)",
      tag: "🔥 Torched Cocktail",
      price: "₹890",
      type: "Whiskey Cocktails",
      desc: "Woodford Reserve Bourbon, Angostura & orange bitters, demerara sugar, torched maraschino cherry served under a cloche of applewood smoke."
    }
  ];

  const page3Items = [
    {
      name: "Goa Brewing Co. Eight Finger Eddie IPA (Pint)",
      tag: "🌴 Local Craft Beer",
      price: "₹420",
      type: "Craft Beer",
      desc: "Hazy double dry-hopped coastal IPA loaded with tropical mango, passion fruit, pine, and juicy citrus aroma from Goa’s pioneer brewery."
    },
    {
      name: "Susegado Kokum Gose Sour Ale (Pint)",
      tag: "🍒 Heritage Brew",
      price: "₹390",
      type: "Craft Beer",
      desc: "Traditional German Gose brewed with local wild Goan Kokum berries and Arabian sea salt for a tart, crisp, and refreshing sunset drink."
    },
    {
      name: "Hoegaarden Belgian Witbier (Draught 500ml)",
      tag: "🍺 European Draught",
      price: "₹520",
      type: "Draught Beer",
      desc: "Naturally cloudy Belgian wheat beer cold-poured with hints of fresh Curacao orange peel and crushed coriander seeds."
    },
    {
      name: "Corona Extra Cerveza (330ml Bottle)",
      tag: "🍋 Sun & Beach Classic",
      price: "₹450",
      type: "Lager",
      desc: "Crisp, refreshing Mexican golden lager served ice-cold with sea-salted fresh lime wedge."
    },
    {
      name: "Moët & Chandon Impérial Brut (Glass / Bottle)",
      tag: "🍾 French Champagne",
      price: "₹1,800 / ₹9,500",
      type: "Champagne",
      desc: "Iconic French Champagne showing vibrant green apple, white flowers, fine brioche notes, and elegant effervescence."
    },
    {
      name: "Whispering Angel Côtes de Provence Rosé (Glass)",
      tag: "🍷 Sunset Provence Rosé",
      price: "₹950",
      type: "Fine Wine",
      desc: "World-renowned French rosé with ripe wild strawberry notes, white peach, refreshing acidity, and flinty ocean minerality."
    },
    {
      name: "Aperol Sunset Spritz",
      tag: "🍊 Sunset Deck Favorite",
      price: "₹790",
      type: "Aperitif & Spritz",
      desc: "Aperol aperitivo, Cinzano Italian Prosecco, sparkling splash of soda, and charred fresh orange wheels served in an oversized goblet."
    }
  ];

  const page4Items = [
    {
      name: "Truffle Edamame & Cream Cheese Dumplings (6-pc)",
      tag: "🌿 Steamed Dim Sum",
      price: "₹580",
      type: "Vegetarian Tapas",
      desc: "Silken translucent parcels filled with mashed edamame beans and cream cheese, drizzled with black truffle oil and scallion soy broth."
    },
    {
      name: "Peri-Peri Charcoal Cottage Cheese Skewers",
      tag: "🔥 Robata Grill",
      price: "₹520",
      type: "Vegetarian Tapas",
      desc: "Fresh malai paneer cubes marinated in African bird's eye chili, roasted over coconut charcoal with charred sweet peppers and chimichurri."
    },
    {
      name: "Crispy Hass Avocado & Jalapeño Croquettes",
      tag: "🥑 House Favorite",
      price: "₹490",
      type: "Vegetarian Tapas",
      desc: "Golden panko-crusted fresh Hass avocado croquettes with molten Monterey Jack cheese and smoked chipotle cilantro crema."
    },
    {
      name: "Mediterranean Mezze Board with Fresh Za'atar Pita",
      tag: "🫒 Platter to Share",
      price: "₹650",
      type: "Vegetarian Tapas",
      desc: "Creamy garlic tahini hummus, roasted beetroot mutabal, tzatziki, Kalamata olives, herbed falafel, and fire-baked za'atar flatbread."
    },
    {
      name: "Wild Forest Mushroom & Fontina Arancini",
      tag: "🧀 Crispy Bites",
      price: "₹540",
      type: "Vegetarian Tapas",
      desc: "Crisp golden arborio risotto spheres stuffed with sautéed porcini mushrooms, melted fontina cheese, and roasted garlic emulsion."
    },
    {
      name: "Charcoal-Grilled Lotus Stem & Sweet Potato Chaat",
      tag: "✨ Tangy & Crunchy",
      price: "₹460",
      type: "Vegetarian Tapas",
      desc: "Crunchy lotus stem chips and tandoori sweet potato tossed with jaggery tamarind glaze, fresh mint yogurt, and pomegranate pearls."
    }
  ];

  const page5Items = [
    {
      name: "Goan Chorizo & Pork Belly Poi Sliders (3-pc)",
      tag: "👑 Local Bar Legend",
      price: "₹680",
      type: "Non-Veg Bar Bites",
      desc: "Fiery cured Goan pork sausage and slow-braised pork belly tossed with caramelized onions inside mini freshly baked buttered poi breads."
    },
    {
      name: "Crispy Salt & Pepper Arabian Calamari",
      tag: "🦑 Fresh Seafood",
      price: "₹640",
      type: "Non-Veg Bar Bites",
      desc: "Flash-fried tender squid rings tossed with fresh crushed garlic, green scallions, cracked Tellicherry peppercorn, and smoked sriracha aioli."
    },
    {
      name: "Teriyaki Glazed Chicken Yakitori Skewers (4-pc)",
      tag: "🔥 Japanese Robata",
      price: "₹560",
      type: "Non-Veg Bar Bites",
      desc: "Charcoal-grilled chicken thigh skewers basted with reduced sweet mirin teriyaki glaze, toasted white sesame seeds, and spring onion."
    },
    {
      name: "Coastal Dynamite Butter Tiger Prawns",
      tag: "🦀 Seafood Special",
      price: "₹780",
      type: "Non-Veg Bar Bites",
      desc: "Crispy golden Arabian Sea tiger prawns tossed in rich garlic butter and spicy Japanese tobiko dynamic mayonnaise."
    },
    {
      name: "Royal Awadhi Lamb Galouti Kebabs on Sheermal",
      tag: "🍖 Awadhi Royal",
      price: "₹720",
      type: "Non-Veg Bar Bites",
      desc: "Melt-in-mouth spiced minced mutton patties smoked over charcoal, served atop miniature saffron sheermal breads with mint labneh."
    },
    {
      name: "Smoky Buffalo Glazed Chicken Wings (8-pc)",
      tag: "🍗 Crunchy Bites",
      price: "₹590",
      type: "Non-Veg Bar Bites",
      desc: "Double-fried crispy chicken wings tossed in Louisiana cayenne hot pepper glaze, served with Gorgonzola blue cheese dip and celery sticks."
    }
  ];

  const pageMap = {
    1: { title: "🍸 Page 1: Artisanal Gin, Botanicals & Vodka", items: page1Items, subtitle: "Handcrafted Gin Tonics, Rare Vodka & Signature Highballs" },
    2: { title: "🥃 Page 2: Fine Whiskies, Single Malts & Blended Scotch", items: page2Items, subtitle: "Speyside, Islay Peat, Indian Single Malts & Aged Blended Scotch" },
    3: { title: "🍺 Page 3: Draught Beers, Craft Ales & Sunset Champagne", items: page3Items, subtitle: "Local Goan Craft Breweries, Belgian Draughts, Champagne & Wine Spritzers" },
    4: { title: "🌿 Page 4: Gourmet Tapas & Vegetarian Starters", items: page4Items, subtitle: "Truffle Dumplings, Robata Paneer, Croquettes & Mezze Platters" },
    5: { title: "🍖 Page 5: Coastal & Non-Veg Bar Bites", items: page5Items, subtitle: "Goan Chorizo Sliders, Crispy Calamari, Yakitori & Dynamite Prawns" }
  };

  const currentPageData = pageMap[activePage];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in" onClick={onClose}>
      <div className="relative flex flex-col w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-3xl border border-[#d5b582]/40 bg-[#122020] text-[#ebe7dc] shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="border-b border-[#d5b582]/20 bg-gradient-to-r from-[#1b2626] via-[#243332] to-[#1b2626] p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#d5b582]/15 text-[#d5b582] border border-[#d5b582]/30 shadow-inner">
                <Wine size={22} />
              </div>
              <div>
                <span className="rounded-md bg-[#d5b582]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#d5b582]">
                  Sunset Cocktail & Spirits Menu (5-Pages)
                </span>
                <h2 className="mt-1 font-serif text-2xl font-semibold text-[#fcf5e8]">Azure Sunset Lounge & Cocktail Bar</h2>
                <div className="mt-1 flex items-center gap-3 text-xs text-[#8ca6a1]">
                  <span>📍 Cliffside Sunset Deck</span>
                  <span>·</span>
                  <span>⏰ 16:00 – 01:00</span>
                  <span>·</span>
                  <span className="text-[#d5b582]">Live Sunset DJ & Acoustic</span>
                </div>
              </div>
            </div>
            <button className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-[#8ca6a1] hover:bg-white/10 hover:text-white" onClick={onClose}>
              ✕
            </button>
          </div>

          {/* 5-Page Navigation Bar */}
          <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { p: 1, label: "🍸 Gin & Vodka" },
              { p: 2, label: "🥃 Whiskies & Scotch" },
              { p: 3, label: "🍺 Beers & Champagne" },
              { p: 4, label: "🌿 Veg Tapas" },
              { p: 5, label: "🍖 Non-Veg Bites" }
            ].map(({ p, label }) => (
              <button
                key={p}
                onClick={() => setActivePage(p as any)}
                className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                  activePage === p
                    ? "bg-[#d5b582] text-[#122020] shadow-md font-bold"
                    : "border border-white/8 bg-black/30 text-[#8ca6a1] hover:text-[#ebe7dc] hover:bg-white/5"
                }`}
              >
                <span>P{p}: {label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5 scrollbar-thin">
          <div className="flex items-center justify-between pb-1 border-b border-white/5">
            <div>
              <div className="text-xs uppercase tracking-wider text-[#d5b582] font-semibold">
                {currentPageData.title}
              </div>
              <div className="text-[11px] text-[#8ca6a1] mt-0.5">{currentPageData.subtitle}</div>
            </div>
            <span className="text-[10px] text-[#8ca6a1] font-mono">Page {activePage}/5</span>
          </div>

          {currentPageData.items.map((item, idx) => (
            <div
              key={idx}
              className="group relative rounded-2xl border border-white/8 bg-white/[.025] p-4 transition-all hover:border-[#d5b582]/40 hover:bg-white/[.05]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-[#d5b582]/15 px-2 py-0.5 text-[10px] font-bold text-[#d5b582]">
                      {item.tag}
                    </span>
                    <span className="text-[10px] text-[#8ca6a1] font-mono">[{item.type}]</span>
                  </div>
                  <h3 className="mt-1.5 font-serif text-base font-semibold text-[#fcf5e8] group-hover:text-[#d5b582] transition-colors">
                    {item.name}
                  </h3>
                  <p className="sr-muted mt-1 text-xs leading-relaxed">{item.desc}</p>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="font-mono text-base font-bold text-[#d5b582]">{item.price}</span>
                  <button
                    onClick={() => {
                      toast.success(`Bar Selection: ${item.name}`, {
                        description: `Price: ${item.price} · Added to Lounge request`
                      });
                    }}
                    className="mt-2 rounded-md bg-white/5 px-2 py-1 text-[10px] font-medium text-[#c4ded6] hover:bg-[#d5b582]/20 hover:text-[#d5b582]"
                  >
                    + Note for Order
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer with 5-Page Slider Controls & Action */}
        <div className="border-t border-[#d5b582]/20 bg-[#162928] p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              disabled={activePage === 1}
              onClick={() => setActivePage((p) => Math.max(1, p - 1) as any)}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold disabled:opacity-30 hover:bg-white/5"
            >
              ← Prev
            </button>
            <span className="font-mono text-xs text-[#d5b582]">Page {activePage} of 5</span>
            <button
              disabled={activePage === 5}
              onClick={() => setActivePage((p) => Math.min(5, p + 1) as any)}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold disabled:opacity-30 hover:bg-white/5"
            >
              Next →
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className="sr-button-quiet text-xs" onClick={onClose}>
              Close Menu
            </button>
            <button
              className="sr-button"
              onClick={() => {
                onClose();
                onReserve();
              }}
            >
              Reserve Lounge For This Menu <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function VerandahMenuModal({ onClose, onReserve }: { onClose: () => void; onReserve: () => void }) {
  const [activePage, setActivePage] = useState<1 | 2 | 3 | 4>(1);

  const page1Items = [
    {
      name: "Eggs Benedict with Black Truffle Hollandaise",
      tag: "👑 Breakfast Signature",
      price: "₹620",
      type: "Artisan Breakfast",
      desc: "Free-range poached farm eggs on warm toasted brioche with smoked turkey ham, sautéed spinach, velvety black truffle hollandaise, and herbed potato rosti."
    },
    {
      name: "Avocado & Pugliese Burrata Sourdough Toast",
      tag: "🥑 Healthy Gourmet",
      price: "₹580",
      type: "Artisan Breakfast",
      desc: "Fresh Hass avocado mash, artisanal Italian pugliese burrata, blistered heirloom cherry tomatoes, toasted pine nuts, and pomegranate balsamic drizzle on toasted sourdough."
    },
    {
      name: "Belgian Malted Waffles & Wild Berry Compote",
      tag: "🧇 Morning Sweet",
      price: "₹480",
      type: "Bakery & Waffles",
      desc: "Golden crisp malted Belgian waffles served with warm forest blueberry-maple reduction, churned Madagascar vanilla butter, and fresh mint."
    },
    {
      name: "Single-Estate Kalledevarapura Arabica Flat White",
      tag: "☕ Single Origin",
      price: "₹280",
      type: "Artisan Coffee Bar",
      desc: "Locally sourced high-altitude Chikmagalur shade-grown arabica extracted through a Synesso espresso machine with silken micro-foam."
    },
    {
      name: "Cold Brew Tonic with Orange Blossom & Thyme",
      tag: "✨ Signature Brew",
      price: "₹320",
      type: "Artisan Coffee Bar",
      desc: "18-hour cold steeped single-origin arabica poured over Indian artisanal tonic water, infused with natural orange blossom and fresh garden thyme."
    },
    {
      name: "Warm Almond Frangipane Croissant Basket (2-pc)",
      tag: "🥐 Viennoiserie",
      price: "₹350",
      type: "French Bakery",
      desc: "Flaky double-baked French butter croissant filled with rich almond frangipane cream and toasted sliced California almonds."
    }
  ];

  const page2Items = [
    {
      name: "Pizza Burrata & San Marzano Margherita D.O.P.",
      tag: "🔥 Woodfired Pizza",
      price: "₹790",
      type: "Neapolitan Pizza",
      desc: "48-hour fermented slow-rise sourdough crust baked at 480°C with San Marzano DOP tomato passata, fior di latte, fresh artisanal baby burrata crown, and wild sweet basil."
    },
    {
      name: "Wild Porcini & Truffle Four-Cheese Pizza",
      tag: "🍄 Chef's Woodfired",
      price: "₹880",
      type: "Neapolitan Pizza",
      desc: "White base with fior di latte, Gorgonzola Dolce, fontina, smoked scamorza, sautéed wild porcini mushrooms, and a delicate white truffle oil drizzle."
    },
    {
      name: "Artisanal Pork Pepperoni & Hot Chili Honey Pizza",
      tag: "🍕 House Favorite",
      price: "₹940",
      type: "Neapolitan Pizza",
      desc: "Smoky cured artisanal pork pepperoni, mozzarella di bufala, crushed red chili flakes, finished straight from the wood oven with hot spicy wildflower honey."
    },
    {
      name: "Handmade Truffle Tagliolini Cacio e Pepe",
      tag: "🍝 Handcrafted Pasta",
      price: "₹760",
      type: "Fresh Pasta",
      desc: "Fresh bronze-die cut egg tagliolini tossed in emulsified 24-month aged Pecorino Romano broth, cracked Sarawak black peppercorns, and freshly shaved black truffle."
    },
    {
      name: "8-Hour Slow-Braised Lamb Shoulder Pappardelle",
      tag: "🍖 Traditional Ragu",
      price: "₹860",
      type: "Fresh Pasta",
      desc: "Hand-cut wide ribbon pappardelle tossed in a rich slow-simmered Australian lamb shoulder ragu with Chianti wine, rosemary, and aged Parmigiano-Reggiano."
    },
    {
      name: "Spinach & Ricotta Ravioli in Hazelnut Sage Butter",
      tag: "🌿 Handmade Vegetarian",
      price: "₹720",
      type: "Fresh Pasta",
      desc: "Pillow-soft egg ravioli filled with creamy buffalo ricotta and organic baby spinach, pan-glazed in brown butter, toasted hazelnuts, and crispy garden sage."
    }
  ];

  const page3Items = [
    {
      name: "Peri-Peri Spatchcock Baby Chicken (Live Grill)",
      tag: "🔥 Charcoal Rotisserie",
      price: "₹820",
      type: "Live Charcoal Grill",
      desc: "Tender whole spatchcock baby chicken flame-grilled over coconut charcoal with African bird's eye peri-peri glaze, charred lemon, and garlic herb potato wedges."
    },
    {
      name: "Rosemary & Garlic Infused Charcoal Lamb Chops",
      tag: "🥩 Prime Cuts",
      price: "₹1,250",
      type: "Live Charcoal Grill",
      desc: "Prime New Zealand lamb chops seared over live hardwood charcoal, served with roasted garlic baby potatoes, confit shallots, and rich rosemary red wine jus."
    },
    {
      name: "Pan-Grilled Wild Norwegian Salmon Steak",
      tag: "🐟 Atlantic Catch",
      price: "₹1,380",
      type: "Live Charcoal Grill",
      desc: "Crisp-skin Norwegian salmon steak with char-grilled asparagus spears, lemon-dill emulsion, and saffron buttered parsnip purée."
    },
    {
      name: "Tandoori Malai Paneer Tikka Angare",
      tag: "🍢 Clay Oven Tandoor",
      price: "₹590",
      type: "Indian Clay Oven",
      desc: "Soft cottage cheese chunks infused with cold-pressed mustard oil, hung curd, and deghi chili marinade, roasted over smoking tandoor charcoal with spiced bell peppers."
    },
    {
      name: "Awadhi Murgh Malai Tikka with Saffron Laccha",
      tag: "🍗 Royal Tandoor",
      price: "₹690",
      type: "Indian Clay Oven",
      desc: "Boneless chicken thigh steeped in cardamom-scented cashew nut cream and royal Indian spices, flame-roasted in charcoal tandoor with mint chutney."
    },
    {
      name: "Charred Harissa Arabian Tiger Prawn Skewers (4-pc)",
      tag: "🦀 Coastal Robata",
      price: "₹1,050",
      type: "Live Charcoal Grill",
      desc: "Jumbo Arabian Sea tiger prawns brushed with smoked harissa paste and garlic butter, served with cucumber mint labneh and warm charred flatbread."
    }
  ];

  const page4Items = [
    {
      name: "Grand International Morning Buffet",
      tag: "🍳 All-Inclusive Breakfast",
      price: "₹1,100 / guest",
      type: "Grand Buffet",
      desc: "Expansive breakfast spread: live egg & omelette station, South Indian dosa/idli bar, French bakery & pastries, tropical fruit cart, charcuterie, and limitless artisan coffee."
    },
    {
      name: "Verandah Live Grills & Gourmet Dinner Buffet",
      tag: "👑 Royal Evening Spread",
      price: "₹1,800 / guest",
      type: "Grand Buffet",
      desc: "Lavish multi-cuisine dinner: live charcoal grill counters, woodfired Neapolitan pizzas, sushi & dim sum bar, Indian curries, European carved roasts, and grand dessert boulevard."
    },
    {
      name: "Bronte Pistachio & Tahitian Vanilla Artisan Gelato",
      tag: "🍨 Fresh Italian Gelato",
      price: "₹360",
      type: "Artisan Desserts",
      desc: "Two generous scoops of house-churned artisanal Italian gelato featuring Sicilian Bronte pistachios and Tahitian vanilla bean with waffle crisps."
    },
    {
      name: "Warm 70% Dark Chocolate Lava Fondant",
      tag: "🍫 Warm Dessert",
      price: "₹460",
      type: "Artisan Desserts",
      desc: "Warm molten Belgian Valrhona dark chocolate cake with a liquid core, served with sea salt caramel gelato and berry coulis."
    },
    {
      name: "Classic Italian Tiramisu al Mascarpone",
      tag: "☕ Italian Heritage",
      price: "₹440",
      type: "Artisan Desserts",
      desc: "Savoiardi sponge ladyfingers steeped in Kalledevarapura espresso and aged Marsala, layered with whipped Italian mascarpone and dusted with cocoa."
    },
    {
      name: "Rose & Cardamom Saffron Rasmalai Tres Leches",
      tag: "✨ Indian Fusion",
      price: "₹420",
      type: "Artisan Desserts",
      desc: "Light saffron sponge cake soaked in three-milk cardamom-saffron reduction, garnished with soft rasmalai pearls, silver leaf, and organic rose petals."
    }
  ];

  const pageMap = {
    1: { title: "☕ Page 1: Artisan Breakfast, Single-Origin Coffee & Bakery", items: page1Items, subtitle: "Farm Poached Eggs, Sourdough Toasts, Viennoiserie & Speciality Espresso" },
    2: { title: "🍕 Page 2: Woodfired Neapolitan Pizzas & Handcrafted Pastas", items: page2Items, subtitle: "48-Hour Sourdough Crusts, Fresh Tagliolini, Ravioli & Slow-Braised Ragu" },
    3: { title: "🔥 Page 3: Live Charcoal Grills, Rotisserie & Clay Oven Tandoor", items: page3Items, subtitle: "Peri-Peri Baby Chicken, Prime Lamb Chops, Salmon & Awadhi Tikka" },
    4: { title: "🍽️ Page 4: Grand International Buffets & Artisan Gelato", items: page4Items, subtitle: "All-Day Breakfast & Dinner Buffets, Molten Fondant & Classic Tiramisu" }
  };

  const currentPageData = pageMap[activePage];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in" onClick={onClose}>
      <div className="relative flex flex-col w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-3xl border border-[#d5b582]/40 bg-[#122020] text-[#ebe7dc] shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="border-b border-[#d5b582]/20 bg-gradient-to-r from-[#1a2927] via-[#243936] to-[#1a2927] p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#d5b582]/15 text-[#d5b582] border border-[#d5b582]/30 shadow-inner">
                <Coffee size={22} />
              </div>
              <div>
                <span className="rounded-md bg-[#d5b582]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#d5b582]">
                  All-Day Multi-Cuisine Menu (4-Pages)
                </span>
                <h2 className="mt-1 font-serif text-2xl font-semibold text-[#fcf5e8]">The Verandah All-Day Brasserie & Cafe</h2>
                <div className="mt-1 flex items-center gap-3 text-xs text-[#8ca6a1]">
                  <span>📍 Main Courtyard Ground Floor</span>
                  <span>·</span>
                  <span>⏰ Open 24/7</span>
                  <span>·</span>
                  <span className="text-[#d5b582]">Woodfired & Live Charcoal Grills</span>
                </div>
              </div>
            </div>
            <button className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-[#8ca6a1] hover:bg-white/10 hover:text-white" onClick={onClose}>
              ✕
            </button>
          </div>

          {/* 4-Page Navigation Tabs */}
          <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { p: 1, label: "☕ Breakfast & Coffee" },
              { p: 2, label: "🍕 Pizzas & Pastas" },
              { p: 3, label: "🔥 Live Grills & Tandoor" },
              { p: 4, label: "🍽️ Buffets & Desserts" }
            ].map(({ p, label }) => (
              <button
                key={p}
                onClick={() => setActivePage(p as any)}
                className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                  activePage === p
                    ? "bg-[#d5b582] text-[#122020] shadow-md font-bold"
                    : "border border-white/8 bg-black/30 text-[#8ca6a1] hover:text-[#ebe7dc] hover:bg-white/5"
                }`}
              >
                <span>P{p}: {label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5 scrollbar-thin">
          <div className="flex items-center justify-between pb-1 border-b border-white/5">
            <div>
              <div className="text-xs uppercase tracking-wider text-[#d5b582] font-semibold">
                {currentPageData.title}
              </div>
              <div className="text-[11px] text-[#8ca6a1] mt-0.5">{currentPageData.subtitle}</div>
            </div>
            <span className="text-[10px] text-[#8ca6a1] font-mono">Page {activePage}/4</span>
          </div>

          {currentPageData.items.map((item, idx) => (
            <div
              key={idx}
              className="group relative rounded-2xl border border-white/8 bg-white/[.025] p-4 transition-all hover:border-[#d5b582]/40 hover:bg-white/[.05]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-[#d5b582]/15 px-2 py-0.5 text-[10px] font-bold text-[#d5b582]">
                      {item.tag}
                    </span>
                    <span className="text-[10px] text-[#8ca6a1] font-mono">[{item.type}]</span>
                  </div>
                  <h3 className="mt-1.5 font-serif text-base font-semibold text-[#fcf5e8] group-hover:text-[#d5b582] transition-colors">
                    {item.name}
                  </h3>
                  <p className="sr-muted mt-1 text-xs leading-relaxed">{item.desc}</p>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="font-mono text-base font-bold text-[#d5b582]">{item.price}</span>
                  <button
                    onClick={() => {
                      toast.success(`Selected for Table: ${item.name}`, {
                        description: `Price: ${item.price} · Added to Brasserie preference`
                      });
                    }}
                    className="mt-2 rounded-md bg-white/5 px-2 py-1 text-[10px] font-medium text-[#c4ded6] hover:bg-[#d5b582]/20 hover:text-[#d5b582]"
                  >
                    + Note for Table
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer with 4-Page Slider Controls & Action */}
        <div className="border-t border-[#d5b582]/20 bg-[#162928] p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              disabled={activePage === 1}
              onClick={() => setActivePage((p) => Math.max(1, p - 1) as any)}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold disabled:opacity-30 hover:bg-white/5"
            >
              ← Prev
            </button>
            <span className="font-mono text-xs text-[#d5b582]">Page {activePage} of 4</span>
            <button
              disabled={activePage === 4}
              onClick={() => setActivePage((p) => Math.min(4, p + 1) as any)}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold disabled:opacity-30 hover:bg-white/5"
            >
              Next →
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className="sr-button-quiet text-xs" onClick={onClose}>
              Close Menu
            </button>
            <button
              className="sr-button"
              onClick={() => {
                onClose();
                onReserve();
              }}
            >
              Reserve Table For This Menu <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RasoiRoyalMenuModal({ onClose, onReserve }: { onClose: () => void; onReserve: () => void }) {
  const [activePage, setActivePage] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8>(1);

  const page1Items = [
    {
      name: "Maharaja Shahi Bhojan Royal Thali (14-Course Feast)",
      tag: "👑 Royal Showpiece",
      price: "₹850",
      type: "Royal Grand Thali",
      desc: "Lavish royal feast: Paneer Lababdar, Dal Baati Churma with pure ghee, Gatta Curry, Kaju Makhana, Missi Roti, Kesari Basmati Pulao, Dahi Bhalla, Smoked Chaas, and warm Malpua with Rabdi."
    },
    {
      name: "Shekhawati Shudh Jain Royal Thali (Zero Onion/Garlic/Root Veg)",
      tag: "🌿 100% Pure Jain",
      price: "₹820",
      type: "Jain Grand Thali",
      desc: "Strict Jain specialty prepared in dedicated Jain vessels: Jain Paneer Makhani, Panchmel Dal, Kela Methi Nu Shaak, Moong Moghar, Phulkas with A2 Bilona Ghee, Saffron Rice & Kesari Rasmalai."
    },
    {
      name: "Kathiyawadi Gujarati Swad Thali",
      tag: "🟢 Gujarati Specialty",
      price: "₹780",
      type: "Regional Thali",
      desc: "Authentic Gujarati spread: Sev Tameta Nu Shaak, Ringan No Olo (or Jain Dudhi Chana), Gujarati Khatti-Meethi Dal, hot Bajra Rotla with white butter, organic jaggery, and Kesar Shrikhand."
    },
    {
      name: "Royal Kesar Pista Shikanji",
      tag: "✨ Shahi Aperitif",
      price: "₹220",
      type: "Royal Refreshers",
      desc: "Chilled hand-churned gondhoraj lime cooler infused with Kashmiri saffron strands, crushed green pistachios, black rock salt, and mint."
    },
    {
      name: "Smoked Dhungari Chaas with Roasted Cumin",
      tag: "🌿 Pure Jain / Veg",
      price: "₹180",
      type: "Royal Refreshers",
      desc: "Fresh churned spiced buttermilk with crushed ginger (optional), roasted cumin, rock salt, and smoked with red-hot coconut charcoal and A2 cow ghee."
    },
    {
      name: "Wild Kokum & Cumin Digestive Cooler",
      tag: "🍷 Coastal Heritage",
      price: "₹190",
      type: "Royal Refreshers",
      desc: "Fresh Goan wild kokum nectar brewed with roasted jeera, rock salt, black pepper, and sparkling spring soda."
    }
  ];

  const page2Items = [
    {
      name: "Dahi Ke Shahi Kebab with Mint & Sonth (6-pc)",
      tag: "👑 Royal Starter",
      price: "₹520",
      type: "Clay Oven Kebabs",
      desc: "Silken spiced hung curd and chenna patties infused with green cardamom, mace, and saffron, pan-griddled in pure desi cow ghee."
    },
    {
      name: "Tandoori Malai Broccoli Angare",
      tag: "🌿 Pure Jain / Veg",
      price: "₹540",
      type: "Clay Oven Kebabs",
      desc: "Tender broccoli florets steeped in rich cashew nut paste, cream cheese, green cardamom, and roasted over fragrant charcoal embers."
    },
    {
      name: "Paneer Tikka Shahi Shashlik (Jain Available)",
      tag: "🔥 Charcoal Tandoor",
      price: "₹580",
      type: "Clay Oven Kebabs",
      desc: "Chunks of fresh malai cottage cheese marinated in Kashmiri deghi chili, hung curd, and cold-pressed mustard oil, tandoor-roasted with bell peppers."
    },
    {
      name: "Bharwan Shakarkandi / Stuffed Tandoori Aloo Nazakat",
      tag: "🥔 Clay Oven Roast",
      price: "₹490",
      type: "Clay Oven Kebabs",
      desc: "Sweet potato / potato barrels stuffed with seasoned paneer, raisins, crushed cashews, and fresh herbs, glazed over charcoal with pomegranate reduction."
    },
    {
      name: "Golden Sweet Corn & Water Chestnut Seekh (4-pc)",
      tag: "🌿 Pure Jain / Veg",
      price: "₹510",
      type: "Clay Oven Kebabs",
      desc: "Skewered patties made of crushed tender American sweet corn, crunchy water chestnuts, aromatic garam masala, and fresh coriander."
    },
    {
      name: "Subz Hariyali Kebab with Raw Mango Dip",
      tag: "🥗 Green Goodness",
      price: "₹480",
      type: "Clay Oven Kebabs",
      desc: "Nutritious pan-seared patties of fresh spinach, green peas, raw banana mash, and mint, dusted with chaat masala."
    }
  ];

  const page3Items = [
    {
      name: "Shahi Paneer Lababdar / Jain Paneer Makhani",
      tag: "👑 Signature Curry",
      price: "₹620",
      type: "Shahi Gravies",
      desc: "Fresh malai paneer cubes simmered in a velvety reduction of vine-ripened tomatoes, cashew nuts, and green cardamom, finished with kasuri methi and churned butter."
    },
    {
      name: "Royal Khoya Kaju Curry in Saffron Gravy",
      tag: "🌿 Pure Jain / Veg",
      price: "₹660",
      type: "Shahi Gravies",
      desc: "Whole golden-roasted premium cashew nuts braised in a rich reduction of reduced milk mawa (khoya), saffron, white pepper, and royal spices."
    },
    {
      name: "Dum Subz Handi / Jain Malai Kofta",
      tag: "🍲 Clay Handi Special",
      price: "₹580",
      type: "Shahi Gravies",
      desc: "Melt-in-mouth raw-banana and chenna kofta or seasonal garden vegetables slow-simmered in an earthen handi with an aromatic yellow cashew gravy."
    },
    {
      name: "Dal Bukhara (24-Hour Charcoal Slow-Cooked)",
      tag: "🔥 Legendary Lentils",
      price: "₹520",
      type: "Heritage Dal",
      desc: "Whole black urad lentils slow-simmered for 24 hours over gentle charcoal embers with fresh tomato puree, dairy cream, and white butter."
    },
    {
      name: "Panchmel Dal Tadka with A2 Desi Ghee Dhungar",
      tag: "🌿 Pure Jain / Veg",
      price: "₹460",
      type: "Heritage Dal",
      desc: "Five-lentil melange cooked with rock salt and turmeric, finished with an aromatic tempering of pure cow ghee, asafoetida (hing), and dry red chilies."
    },
    {
      name: "Navratan Shahi Korma with Dried Fruits",
      tag: "✨ Mild & Royal",
      price: "₹640",
      type: "Shahi Gravies",
      desc: "Nine treasures of farm vegetables, paneer, pineapple, raisins, and nuts cooked in a fragrant cashew-cream and edible rosewater sauce."
    }
  ];

  const page4Items = [
    {
      name: "Traditional Rajasthani Dal Baati Churma Platter",
      tag: "👑 Heritage Legend",
      price: "₹650",
      type: "Regional Classics",
      desc: "Crisp golden whole-wheat baatis dipped in warm desi ghee, served with spicy Panchmel Dal, tangy gatta curry, and cardamom almond churma."
    },
    {
      name: "Mewari Gatta Curry in Spiced Dahi Gravy",
      tag: "🌿 Pure Jain / Veg",
      price: "₹540",
      type: "Regional Classics",
      desc: "Steamed tender gram flour rolls cooked in a rich, tempered Rajasthani yogurt sauce infused with ajwain and crushed coriander."
    },
    {
      name: "Kathiyawadi Sev Tameta Nu Shaak (Jain Available)",
      tag: "🍅 Gujarati Street Taste",
      price: "₹480",
      type: "Regional Classics",
      desc: "Tangy-sweet tomato curry stewed with jaggery, cumin, mustard seeds, and topped with crunchy Bhavnagri chickpea sev."
    },
    {
      name: "Surti Undhiyu with Methi Muthiya (Seasonal)",
      tag: "🌿 Gujarati Specialty",
      price: "₹580",
      type: "Regional Classics",
      desc: "Slow-braised winter vegetable medley with fried fenugreek dumplings, flat papdi beans, and freshly scraped coconut-sesame masala."
    },
    {
      name: "Papad Mangodi ki Shahi Kadhi",
      tag: "🌿 Pure Jain / Veg",
      price: "₹460",
      type: "Regional Classics",
      desc: "Sun-dried moong dal mangodi dumplings and roasted Bikaneri papad cooked in a creamy buttermilk kadhi tempered with curry leaves and mustard."
    },
    {
      name: "Marwari Pitor ki Sabzi",
      tag: "✨ Royal Marwari",
      price: "₹510",
      type: "Regional Classics",
      desc: "Diamond-shaped spiced besan cakes shallow-fried and simmered in an authentic rustic curd and mustard gravy."
    }
  ];

  const page5Items = [
    {
      name: "Shahi Dum Subz Handi Biryani (with Burani Raita)",
      tag: "👑 Royal Dum Pukht",
      price: "₹580",
      type: "Biryani & Rices",
      desc: "Fragrant extra-long grain basmati rice layered with spiced vegetables, saffron milk, fresh mint, sealed in earthen handi with dough crust."
    },
    {
      name: "Awadhi Jain Motia Paneer Pulao",
      tag: "🌿 100% Pure Jain",
      price: "₹550",
      type: "Biryani & Rices",
      desc: "Aromatic basmati rice tossed with delicate pearls of fresh malai paneer, green cardamom, whole cloves, and golden cashew nuts."
    },
    {
      name: "Kashmiri Kesar & Dry Fruit Pulao",
      tag: "✨ Sweet & Aromatic",
      price: "₹590",
      type: "Biryani & Rices",
      desc: "Fragrant rice steeped in Pampore saffron broth, tossed with roasted almonds, cashews, walnuts, raisins, and fresh pomegranate arils."
    },
    {
      name: "Jeera Butter Brown Basmati Rice",
      tag: "🌿 Pure Jain / Veg",
      price: "₹340",
      type: "Biryani & Rices",
      desc: "Steamed aged basmati grains tempered with cracked royal cumin seeds and clarified churned butter."
    },
    {
      name: "Royal Moong Dal Khichdi with Bilona Ghee",
      tag: "🥣 Comfort Classic",
      price: "₹420",
      type: "Biryani & Rices",
      desc: "Slow-cooked yellow lentils and basmati rice tempered with cumin, hing, and generous dollop of pure Gir cow A2 bilona ghee."
    },
    {
      name: "South Indian Curd Rice with Mustard Tadka",
      tag: "🌿 Pure Jain / Veg",
      price: "₹380",
      type: "Biryani & Rices",
      desc: "Soft rice mashed in fresh thick curd, tempered with mustard seeds, curry leaves, ginger, and ruby pomegranate pearls."
    }
  ];

  const page6Items = [
    {
      name: "Amritsari Chur-Chur Paneer Kulcha",
      tag: "👑 Clay Oven Special",
      price: "₹240",
      type: "Artisan Breads",
      desc: "Flaky layered clay oven flatbread stuffed with spiced paneer, crushed coriander seeds, and served crushed with homemade white butter."
    },
    {
      name: "Warqi Malai Paratha in Pure Desi Ghee",
      tag: "🫓 Layered Paratha",
      price: "₹180",
      type: "Artisan Breads",
      desc: "Multi-layered flaky whole wheat bread laminated with pure cow ghee and baked crisp in tandoor."
    },
    {
      name: "Rajasthani Missi Roti with Fresh Desi Makhan",
      tag: "🌿 Pure Jain / Veg",
      price: "₹140",
      type: "Artisan Breads",
      desc: "Stone-ground gram flour and whole wheat flatbread infused with roasted ajwain, kasuri methi, topped with fresh white butter."
    },
    {
      name: "Butter / Plain Tandoori Naan (Plain for Jain)",
      tag: "🔥 Clay Oven",
      price: "₹160",
      type: "Artisan Breads",
      desc: "Soft, pillowy leavened flatbread baked on the walls of clay tandoor, brushed with churned butter."
    },
    {
      name: "Hand-Tossed Phulka with A2 Bilona Ghee (3-pc)",
      tag: "🌿 100% Pure Jain",
      price: "₹120",
      type: "Artisan Breads",
      desc: "Soft puffed whole wheat flatbreads freshly puffed on direct flame and brushed with warm Gir cow A2 ghee."
    },
    {
      name: "Rustic Bajra / Makki Rotla with Organic Gud",
      tag: "🌾 Heritage Grain",
      price: "₹160",
      type: "Artisan Breads",
      desc: "Hand-patted pearl millet / yellow corn flatbread served hot off clay griddle with homemade butter and organic jaggery."
    }
  ];

  const page7Items = [
    {
      name: "Dahi Bhalla Papdi Royal Chaat",
      tag: "👑 Shahi Chaat",
      price: "₹380",
      type: "Chaats & Farshaan",
      desc: "Pillow-soft lentil dumplings in sweet creamy yogurt topped with crispy papdi, roasted jeera, tamarind sonth, and pomegranate."
    },
    {
      name: "Crispy Palak Patta Chaat with Sev",
      tag: "🌿 Pure Jain / Veg",
      price: "₹360",
      type: "Chaats & Farshaan",
      desc: "Flash-fried baby spinach leaves in crisp gram batter, drizzled with spiced curd, mint chutney, tamarind glaze, and sev."
    },
    {
      name: "Khaman Dhokla & Khandvi Duo Platter",
      tag: "🟡 Gujarati Farshaan",
      price: "₹320",
      type: "Chaats & Farshaan",
      desc: "Steamed spongy nylon khaman dhokla and rolled spiced besan khandvi tempered with mustard seeds and fresh grated coconut."
    },
    {
      name: "Smoked Boondi & Roasted Cumin Raita",
      tag: "🌿 Pure Jain / Veg",
      price: "₹220",
      type: "Artisanal Raitas",
      desc: "Whipped creamy curd with crisp gram flour boondi, rock salt, and aromatic dhungar charcoal smoke."
    },
    {
      name: "Anardana & Charred Pineapple Raita",
      tag: "🍍 Fruity & Tangy",
      price: "₹260",
      type: "Artisanal Raitas",
      desc: "Chilled yogurt mixed with roasted spiced pineapple cubes, black salt, and dried wild pomegranate seed powder."
    },
    {
      name: "Jain Raw Banana & Sweet Corn Bhel",
      tag: "🌿 100% Pure Jain",
      price: "₹290",
      type: "Chaats & Farshaan",
      desc: "Crunchy puffed rice, crisp raw banana wafers, steamed sweet corn, roasted peanuts, and tangy raw mango sonth dressing."
    }
  ];

  const page8Items = [
    {
      name: "Kesari Rasmalai with Saffron Caviar (2-pc)",
      tag: "👑 Royal Mithai",
      price: "₹360",
      type: "Shahi Desserts",
      desc: "Delicate fresh chenna discs soaked in thickened saffron-cardamom milk, topped with pistachio slivers and molecular saffron pearls."
    },
    {
      name: "Moong Dal Halwa in A2 Bilona Ghee",
      tag: "🌿 Pure Jain / Veg",
      price: "₹380",
      type: "Shahi Desserts",
      desc: "Slow-roasted split yellow lentils in pure cow ghee and reduced milk, served piping hot with slivered almonds and edible silver leaf."
    },
    {
      name: "Awadhi Shahi Tukda with Malai Rabdi",
      tag: "✨ Awadhi Heritage",
      price: "₹350",
      type: "Shahi Desserts",
      desc: "Ghee-crisped brioche triangles steeped in saffron syrup, coated with thick slow-reduced rabdi and dry rose petals."
    },
    {
      name: "Royal Malai Kulfi Falooda with Rose Nectar",
      tag: "🍨 Pot-Churned Kulfi",
      price: "₹340",
      type: "Shahi Desserts",
      desc: "Traditional pot-churned condensed milk kulfi served over basil seeds, silky corn vermicelli, and pure organic rose syrup."
    },
    {
      name: "Warm Gulab Jamun Stuffed with Gulkand (2-pc)",
      tag: "🌹 Floral Sweet",
      price: "₹280",
      type: "Shahi Desserts",
      desc: "Soft mawa dumplings filled with aromatic damask rose petal preserve, fried golden and soaked in green cardamom syrup."
    },
    {
      name: "Alphonso Mango Kesar Shrikhand with Puri",
      tag: "🥭 Seasonal Delight",
      price: "₹320",
      type: "Shahi Desserts",
      desc: "Velvety hung yogurt whisked with pure Ratnagiri Alphonso mango pulp, saffron, and served with mini warm puris."
    }
  ];

  const pageMap = {
    1: { title: "👑 Page 1: Royal Thali Experiences & Shahi Aperitifs", items: page1Items, subtitle: "Maharaja Feast, Shekhawati Jain Thali, Kathiyawadi & Kesar Shikanji" },
    2: { title: "🍢 Page 2: Clay Oven Tandoor & Charcoal Kebabs", items: page2Items, subtitle: "Dahi Ke Kebab, Malai Broccoli, Paneer Shashlik & Corn Seekh" },
    3: { title: "🍲 Page 3: Shahi Gravies, Paneer & Mughlai Curries", items: page3Items, subtitle: "Paneer Lababdar, Khoya Kaju, 24hr Dal Bukhara & Shahi Korma" },
    4: { title: "🌶️ Page 4: Rajasthani, Marwari & Gujarati Classics", items: page4Items, subtitle: "Dal Baati Churma, Mewari Gatta, Sev Tameta & Undhiyu" },
    5: { title: "🥘 Page 5: Handi Biryanis, Pulaos & Dum Pukht Rices", items: page5Items, subtitle: "Shahi Dum Biryani, Jain Motia Pulao, Kashmiri Kesar Rice & Khichdi" },
    6: { title: "🫓 Page 6: Artisan Tandoori Breads & Kulchas", items: page6Items, subtitle: "Amritsari Chur-Chur, Warqi Paratha, Missi Roti & A2 Phulkas" },
    7: { title: "🥗 Page 7: Royal Chaats, Farshaan & Artisanal Raitas", items: page7Items, subtitle: "Dahi Papdi Chaat, Palak Patta, Dhokla Khandvi & Smoked Raita" },
    8: { title: "🍨 Page 8: Shahi Mithais, Halwas & Royal Kulfi Bar", items: page8Items, subtitle: "Kesari Rasmalai, Moong Dal Halwa, Shahi Tukda & Malai Kulfi Falooda" }
  };

  const currentPageData = pageMap[activePage];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in" onClick={onClose}>
      <div className="relative flex flex-col w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-3xl border border-[#8fd6c2]/40 bg-[#10221f] text-[#ebe7dc] shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="border-b border-[#8fd6c2]/20 bg-gradient-to-r from-[#122b27] via-[#1a3832] to-[#122b27] p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#8fd6c2]/15 text-[#8fd6c2] border border-[#8fd6c2]/30 shadow-inner">
                <Utensils size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-[#8fd6c2]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#8fd6c2]">
                    🟢 100% Pure Veg & Jain Menu (8-Pages)
                  </span>
                  <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300">
                    Separate Kitchen
                  </span>
                </div>
                <h2 className="mt-1 font-serif text-2xl font-semibold text-[#fcf5e8]">Rasoi Royal Pure Vegetarian & Jain Dining</h2>
                <div className="mt-1 flex items-center gap-3 text-xs text-[#8ca6a1]">
                  <span>📍 Heritage Garden Pavilion</span>
                  <span>·</span>
                  <span>👑 Maharaj Chhagan Lal</span>
                  <span>·</span>
                  <span className="text-[#8fd6c2]">Zero Non-Veg Cross-Contamination</span>
                </div>
              </div>
            </div>
            <button className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-[#8ca6a1] hover:bg-white/10 hover:text-white" onClick={onClose}>
              ✕
            </button>
          </div>

          {/* 8-Page Navigation Bar */}
          <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { p: 1, label: "👑 Thalis & Drinks" },
              { p: 2, label: "🍢 Tandoor & Kebabs" },
              { p: 3, label: "🍲 Shahi Gravies" },
              { p: 4, label: "🌶️ Regional Classics" },
              { p: 5, label: "🥘 Biryani & Rice" },
              { p: 6, label: "🫓 Breads & Kulchas" },
              { p: 7, label: "🥗 Chaat & Raita" },
              { p: 8, label: "🍨 Mithai & Kulfi" }
            ].map(({ p, label }) => (
              <button
                key={p}
                onClick={() => setActivePage(p as any)}
                className={`shrink-0 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all ${
                  activePage === p
                    ? "bg-[#8fd6c2] text-[#10221f] shadow-md font-bold"
                    : "border border-white/8 bg-black/30 text-[#8ca6a1] hover:text-[#ebe7dc] hover:bg-white/5"
                }`}
              >
                <span>P{p}: {label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5 scrollbar-thin">
          <div className="flex items-center justify-between pb-1 border-b border-white/5">
            <div>
              <div className="text-xs uppercase tracking-wider text-[#8fd6c2] font-semibold">
                {currentPageData.title}
              </div>
              <div className="text-[11px] text-[#8ca6a1] mt-0.5">{currentPageData.subtitle}</div>
            </div>
            <span className="text-[10px] text-[#8ca6a1] font-mono">Page {activePage}/8</span>
          </div>

          {currentPageData.items.map((item, idx) => (
            <div
              key={idx}
              className="group relative rounded-2xl border border-white/8 bg-white/[.025] p-4 transition-all hover:border-[#8fd6c2]/40 hover:bg-white/[.05]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-[#8fd6c2]/15 px-2 py-0.5 text-[10px] font-bold text-[#8fd6c2]">
                      {item.tag}
                    </span>
                    <span className="text-[10px] text-[#8ca6a1] font-mono">[{item.type}]</span>
                  </div>
                  <h3 className="mt-1.5 font-serif text-base font-semibold text-[#fcf5e8] group-hover:text-[#8fd6c2] transition-colors">
                    {item.name}
                  </h3>
                  <p className="sr-muted mt-1 text-xs leading-relaxed">{item.desc}</p>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="font-mono text-base font-bold text-[#8fd6c2]">{item.price}</span>
                  <button
                    onClick={() => {
                      toast.success(`Selected for Pure Veg Order: ${item.name}`, {
                        description: `Price: ${item.price} · Added to order preference`
                      });
                    }}
                    className="mt-2 rounded-md bg-white/5 px-2 py-1 text-[10px] font-medium text-[#c4ded6] hover:bg-[#8fd6c2]/20 hover:text-[#8fd6c2]"
                  >
                    + Note for Table
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer with 8-Page Slider Controls & Action */}
        <div className="border-t border-[#8fd6c2]/20 bg-[#132824] p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              disabled={activePage === 1}
              onClick={() => setActivePage((p) => Math.max(1, p - 1) as any)}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold disabled:opacity-30 hover:bg-white/5"
            >
              ← Prev
            </button>
            <span className="font-mono text-xs text-[#8fd6c2]">Page {activePage} of 8</span>
            <button
              disabled={activePage === 8}
              onClick={() => setActivePage((p) => Math.min(8, p + 1) as any)}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold disabled:opacity-30 hover:bg-white/5"
            >
              Next →
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className="sr-button-quiet text-xs" onClick={onClose}>
              Close Menu
            </button>
            <button
              className="sr-button"
              onClick={() => {
                onClose();
                onReserve();
              }}
            >
              Reserve Table For This Menu <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TableReservation {
  id: string;
  venueId: string;
  venueName: string;
  guests: number;
  timeSlot: string;
  seatingArea: string;
  occasion?: string;
  specialRequests?: string;
  reservedAt: string;
}

export interface GuestReservationRecord {
  id: string;
  venueId: string;
  venueName: string;
  category: "Dining" | "Bar" | "Wellness" | "Sports" | "Activity";
  iconType: "utensils" | "wine" | "coffee" | "sparkles" | "target";
  guests: number;
  timeSlot: string;
  date: string;
  seatingArea: string;
  occasion?: string;
  specialRequests?: string;
  price?: string;
  location: string;
  status: "Confirmed" | "Ready" | "Completed" | "Waitlisted";
}

const INITIAL_GUEST_RESERVATIONS: GuestReservationRecord[] = [
  {
    id: "RES-8421",
    venueId: "dining-1",
    venueName: "The Cove Signature Seafood & Grill",
    category: "Dining",
    iconType: "utensils",
    guests: 2,
    timeSlot: "20:30 (Prime Royal Dinner)",
    date: "Today · 26 Sep 2026",
    seatingArea: "Oceanfront Terrace",
    occasion: "💍 Anniversary / Romantic Date",
    specialRequests: "Candlelight window table, fresh rose petal setup with sea view",
    price: "À la carte (Avg ₹2,200 for 2)",
    location: "Beachfront Ocean Terrace",
    status: "Confirmed"
  },
  {
    id: "RES-3190",
    venueId: "spa-1",
    venueName: "Lotus Luxury Ayurvedic Spa & Steam",
    category: "Wellness",
    iconType: "sparkles",
    guests: 1,
    timeSlot: "16:00 (Sunset Relaxation)",
    date: "Today · 26 Sep 2026",
    seatingArea: "Ayurvedic Suite 4",
    occasion: "🌿 Wellness Ritual",
    specialRequests: "Warm herbal oil massage & Himalayan steam session",
    price: "₹3,500 / 60min",
    location: "Lotus Wellness Sanctuary Level 1",
    status: "Confirmed"
  },
  {
    id: "RES-1892",
    venueId: "snooker-1",
    venueName: "Royal Snooker Lounge",
    category: "Sports",
    iconType: "sparkles",
    guests: 2,
    timeSlot: "14:00 (Afternoon Game)",
    date: "Today · 26 Sep 2026",
    seatingArea: "Table 1 (Tournament 12ft Slate)",
    occasion: "🎱 Leisure Sports",
    specialRequests: "Strachan 6811 tournament cloth & pro cue set reserved",
    price: "₹800/hr",
    location: "Clubhouse Level 2",
    status: "Confirmed"
  }
];

function getStoredGuestReservations(): GuestReservationRecord[] {
  try {
    const raw = localStorage.getItem("sr_guest_reservations_v4");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return INITIAL_GUEST_RESERVATIONS;
}

function saveStoredGuestReservations(list: GuestReservationRecord[]) {
  try {
    localStorage.setItem("sr_guest_reservations_v4", JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("sr_reservations_updated"));
  } catch (e) {}
}

function TableReservationModal({
  item,
  existingReservation,
  onClose,
  onConfirm,
  onCancelReservation
}: {
  item: any;
  existingReservation?: TableReservation;
  onClose: () => void;
  onConfirm: (reservation: TableReservation) => void;
  onCancelReservation?: (venueId: string) => void;
}) {
  const isSports = item.gameType === "Indoor Games" || item.gameType === "Outdoor Games" || item.category === "Sports" || item.category === "Activity" || item.id === "snooker-1" || item.id === "pool-1" || item.id === "carrom-1" || item.id === "cricket-1" || item.id === "badminton-1" || item.id === "golf-1";
  const isWellness = item.gameType === "Wellness" || item.category === "Wellness" || item.id === "spa-1" || item.id === "yoga-1" || item.id === "pool-resort-1";
  const isBar = item.subCategory === "Bar" || item.category === "Bar" || item.id === "bar-1";

  const defaultTime = isSports
    ? "14:00 (Afternoon Practice Game)"
    : isWellness
    ? "16:00 (Sunset Soundbath & Spa)"
    : "20:30 (Prime Royal Dinner)";

  const defaultArea = isSports
    ? "Tournament Match Setup"
    : isWellness
    ? "Lotus Ayurvedic Suite"
    : "Oceanfront Terrace";

  const defaultOccasion = isSports
    ? "Friendly Casual Match"
    : isWellness
    ? "🌿 Deep Relaxation Ritual"
    : "Casual Dining";

  const [guests, setGuests] = useState<number>(existingReservation ? existingReservation.guests : (isSports ? 2 : isWellness ? 1 : 2));
  const [timeSlot, setTimeSlot] = useState<string>(existingReservation ? existingReservation.timeSlot : defaultTime);
  const [seatingArea, setSeatingArea] = useState<string>(existingReservation ? existingReservation.seatingArea : defaultArea);
  const [occasion, setOccasion] = useState<string>(existingReservation?.occasion || defaultOccasion);
  const [specialRequests, setSpecialRequests] = useState<string>(existingReservation?.specialRequests || "");

  const guestOptions = isSports
    ? [
        { count: 1, label: "1 Player", sub: "Solo Practice / Drill" },
        { count: 2, label: "2 Players", sub: "1 vs 1 Singles Match" },
        { count: 3, label: "3 Players", sub: "3-Player Game / Rotation" },
        { count: 4, label: "4 Players", sub: "Doubles / 2 vs 2 Match" },
        { count: 6, label: "5-6 Players", sub: "Team Practice / Group" },
        { count: 8, label: "8+ Players", sub: "Full Team / Tournament" },
      ]
    : isWellness
    ? [
        { count: 1, label: "1 Guest", sub: "Private Sanctuary" },
        { count: 2, label: "2 Guests", sub: "Couples Ritual" },
        { count: 3, label: "3 Guests", sub: "Small Group Spa" },
        { count: 4, label: "4 Guests", sub: "Family Wellness" },
        { count: 6, label: "5-6 Guests", sub: "Group Soundbath" },
        { count: 8, label: "8+ Guests", sub: "Private Wing Soak" },
      ]
    : [
        { count: 1, label: "1 Guest", sub: "Solo Dining" },
        { count: 2, label: "2 Guests", sub: "Couples / Date" },
        { count: 3, label: "3 Guests", sub: "Small Group" },
        { count: 4, label: "4 Guests", sub: "Family Table" },
        { count: 6, label: "5-6 Guests", sub: "Group Dining" },
        { count: 8, label: "8+ Guests", sub: "Grand Private" },
      ];

  const timeSlots = isSports
    ? [
        { time: "07:00", label: "Morning Practice Session", period: "Morning Fresh Air" },
        { time: "09:00", label: "Morning Prime Match", period: "High Energy" },
        { time: "11:00", label: "Midday Arena Game", period: "Pre-Lunch Play" },
        { time: "14:00", label: "Afternoon Practice Game", period: "Club Session" },
        { time: "16:00", label: "Sundowner Match", period: "Cool Ocean Breeze" },
        { time: "18:00", label: "Floodlit Evening Arena", period: "Prime Evening Slot" },
        { time: "20:00", label: "Night Lights Match", period: "Tournament Session" },
        { time: "22:00", label: "Late Night Game", period: "Casual Friendly" }
      ]
    : isWellness
    ? [
        { time: "08:00", label: "Sunrise Awakening", period: "Morning Fresh" },
        { time: "10:30", label: "Morning Rejuvenation", period: "Morning Prime" },
        { time: "12:30", label: "Midday Hydro-Soak", period: "Afternoon" },
        { time: "15:00", label: "Deep Tissue Therapy", period: "Afternoon" },
        { time: "16:00", label: "Sunset Soundbath & Spa", period: "Sunset Glow" },
        { time: "18:00", label: "Twilight Relaxation", period: "Evening" },
        { time: "19:30", label: "Herbal Detox Steam", period: "Night" },
        { time: "21:00", label: "Moonlight Sleep Ritual", period: "Late Night" }
      ]
    : [
        { time: "12:30", label: "Lunch Service", period: "Afternoon" },
        { time: "14:00", label: "Late Lunch", period: "Afternoon" },
        { time: "16:30", label: "Sunset Tea & Tapas", period: "Evening" },
        { time: "18:30", label: "Sundowner Cocktails", period: "Evening" },
        { time: "19:30", label: "Candlelight Dinner", period: "Dinner" },
        { time: "20:30", label: "Prime Royal Dinner", period: "Dinner" },
        { time: "21:30", label: "Twilight Feast", period: "Night" },
        { time: "22:30", label: "Late Lounge & Bar", period: "Late Night" }
      ];

  const seatingOptions = isSports
    ? [
        { name: "Tournament Match Setup", desc: "Championship balls/shuttles, pro cues, digital scoring & referee assistance", icon: "🏆" },
        { name: "Casual Friendly Match", desc: "Standard gear, relaxed timers, chilled water bottles & towel service", icon: "🎯" },
        { name: "Coaching & Practice Net", desc: "Auto bowling machine / training cones, speed radar & pro drills", icon: "⚡" },
        { name: "Floodlit Night Arena", desc: "High-intensity anti-glare floodlights and stadium atmosphere", icon: "💡" },
        { name: "AC Club Lounge Table", desc: "Climate-controlled indoor arena with spectator viewing lounge", icon: "❄️" },
        { name: "VIP Private Court / Booth", desc: "Dedicated court attendant, priority gear and fresh beverage service", icon: "👑" }
      ]
    : isWellness
    ? [
        { name: "Lotus Ayurvedic Suite", desc: "Warm herbal oils, traditional brass vessels & steam chamber", icon: "🪷" },
        { name: "Ocean Breeze Pavilion", desc: "Open-air sea view cabana with calming sound of waves", icon: "🌊" },
        { name: "Hydrotherapy Hot Springs", desc: "Mineral-rich warm bubbling jacuzzi & cold plunge", icon: "🛁" },
        { name: "Himalayan Salt Cave", desc: "Micro-climate salt therapy for deep respiratory relaxation", icon: "✨" },
        { name: "Couples Luxury Sanctuary", desc: "Side-by-side massage tables, private plunge & rose petal bath", icon: "🕯️" },
        { name: "Zen Meditation Studio", desc: "Singing bowls, aromatherapy diffusers & organic tea lounge", icon: "🧘" }
      ]
    : [
        { name: "Oceanfront Terrace", desc: "Panoramic beach view & cool ocean breeze", icon: "🌊" },
        { name: "Candlelit Window", desc: "Intimate romantic sunset & mood glow", icon: "🕯️" },
        { name: "Garden Pavilion", desc: "Lush tropical open-air gazebo seating", icon: "🌿" },
        { name: "Royal AC Dining Hall", desc: "Quiet, air-conditioned luxury seating", icon: "❄️" },
        { name: "Private Lounge Cabana", desc: "Exclusive VIP curtained booth", icon: "🛋️" },
        { name: "Chef's Live Counter", desc: "Front-row view of live grills & kitchen", icon: "🔥" }
      ];

  const occasions = isSports
    ? [
        { label: "Friendly Casual Match", icon: "🤝" },
        { label: "Competitive Tournament", icon: "🥇" },
        { label: "Family & Kids Fun", icon: "👨‍👩‍👧‍👦" },
        { label: "Solo Skill Practice", icon: "🎯" },
        { label: "Coaching Request", icon: "📋" },
        { label: "Equipment Hire Only", icon: "🎽" }
      ]
    : isWellness
    ? [
        { label: "🌿 Deep Relaxation Ritual", icon: "🌿" },
        { label: "💆 Muscle Recovery & Sports", icon: "💆" },
        { label: "🧖 Ayurvedic Detox & Steam", icon: "🧖" },
        { label: "🧘 Mindfulness & Soundbath", icon: "🧘" },
        { label: "💍 Couples Romantic Spa", icon: "💍" },
        { label: "✨ Radiant Skin Facial", icon: "✨" }
      ]
    : [
        { label: "Casual Dining", icon: "✨" },
        { label: "Birthday Celebration", icon: "🎂" },
        { label: "Anniversary / Date", icon: "💍" },
        { label: "100% Pure Jain Table", icon: "🟢" },
        { label: "Baby High Chair Required", icon: "👶" },
        { label: "Chef Special / Wine Pairing", icon: "🍷" }
      ];

  const handleConfirm = () => {
    const reservation: TableReservation = {
      id: existingReservation?.id || `RES-${Math.floor(1000 + Math.random() * 9000)}`,
      venueId: item.id,
      venueName: item.name,
      guests,
      timeSlot,
      seatingArea,
      occasion,
      specialRequests,
      reservedAt: "Today"
    };
    onConfirm(reservation);
  };

  const themeAccent = isSports ? "#8fd6c2" : isWellness ? "#e9bc73" : "#d5b582";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in" onClick={onClose}>
      <div className="relative flex flex-col w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-3xl border border-[#d5b582]/40 bg-[#11211f] text-[#ebe7dc] shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="border-b border-white/10 bg-gradient-to-r from-[#172a27] via-[#223935] to-[#172a27] px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className={`grid h-12 w-12 place-items-center rounded-2xl border shadow-inner shrink-0 ${
                isSports
                  ? "bg-[#8fd6c2]/15 text-[#8fd6c2] border-[#8fd6c2]/30"
                  : isWellness
                  ? "bg-[#e9bc73]/15 text-[#e9bc73] border-[#e9bc73]/30"
                  : "bg-[#d5b582]/15 text-[#d5b582] border-[#d5b582]/30"
              }`}>
                {isSports ? <Target size={24} /> : isWellness ? <Sparkles size={24} /> : isBar ? <Wine size={24} /> : <Utensils size={24} />}
              </div>
              <div>
                <span className={`inline-block rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                  isSports
                    ? "bg-[#8fd6c2]/20 text-[#8fd6c2]"
                    : isWellness
                    ? "bg-[#e9bc73]/20 text-[#e9bc73]"
                    : "bg-[#d5b582]/20 text-[#d5b582]"
                }`}>
                  {isSports
                    ? (existingReservation ? "Modify Sports & Game Slot" : "🏆 Court & Playing Slot Booking · Today")
                    : isWellness
                    ? (existingReservation ? "Modify Wellness Ritual" : "🌿 Wellness Ritual Booking · Today")
                    : (existingReservation ? "Modify Table Reservation" : "🍽️ Table Reservation · Today")}
                </span>
                <h2 className="mt-1 font-serif text-xl sm:text-2xl font-semibold text-[#fcf5e8]">{item.name}</h2>
                <div className="mt-1 flex items-center gap-2 text-xs text-[#8ca6a1]">
                  <span>📍 {item.location}</span>
                  <span>·</span>
                  <span className="font-medium text-[#ebe7dc]">
                    {isSports ? "⏰ Today's Playing Slots" : isWellness ? "⏰ Today's Sanctuary Slots" : "⏰ Today's Service"}
                  </span>
                </div>
              </div>
            </div>
            <button className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-[#8ca6a1] hover:bg-white/10 hover:text-white" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* Existing active reservation banner if already reserved today */}
        {existingReservation && (
          <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-6 sm:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-emerald-300">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                Current Booking: {isSports ? "Playing Time" : isWellness ? "Ritual Time" : "Dining Time"} Reserved Today at {existingReservation.timeSlot} ({existingReservation.guests} {isSports ? (existingReservation.guests === 1 ? "Player" : "Players") : (existingReservation.guests === 1 ? "Guest" : "Guests")} · {existingReservation.seatingArea})
              </span>
            </div>
            {onCancelReservation && (
              <button
                onClick={() => onCancelReservation(item.id)}
                className="text-xs font-bold text-red-300 underline hover:text-red-200"
              >
                Cancel Booking
              </button>
            )}
          </div>
        )}

        {/* Modal Form Scrollable Content with balanced padding */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6 scrollbar-thin">
          {/* 1. Party Size / Number of Players Selector */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-[#d5b582] flex items-center gap-1.5">
                <span>
                  {isSports
                    ? "1. Number of Players (Group Size)"
                    : isWellness
                    ? "1. Number of Guests (Party Size)"
                    : "1. Party Size (Number of Guests)"}
                </span>
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-2 py-1">
                <button
                  type="button"
                  onClick={() => setGuests(g => Math.max(1, g - 1))}
                  className="grid h-6 w-6 place-items-center rounded-lg bg-white/10 text-xs font-bold text-[#c7d9d3] hover:bg-[#d5b582] hover:text-[#122020] transition-colors"
                >
                  -
                </button>
                <span className="font-mono text-xs font-bold text-[#fcf5e8] px-1 min-w-[70px] text-center">
                  {guests} {isSports ? (guests === 1 ? "Player" : "Players") : (guests === 1 ? "Guest" : "Guests")}
                </span>
                <button
                  type="button"
                  onClick={() => setGuests(g => Math.min(20, g + 1))}
                  className="grid h-6 w-6 place-items-center rounded-lg bg-white/10 text-xs font-bold text-[#c7d9d3] hover:bg-[#d5b582] hover:text-[#122020] transition-colors"
                >
                  +
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {guestOptions.map(opt => {
                const isSelected = guests === opt.count;
                return (
                  <button
                    key={opt.count}
                    type="button"
                    onClick={() => setGuests(opt.count)}
                    className={`rounded-2xl border p-3 text-left transition-all relative overflow-hidden ${
                      isSelected
                        ? "border-[#d5b582] bg-gradient-to-br from-[#d5b582]/25 to-[#d5b582]/10 text-[#fcf5e8] shadow-md ring-1 ring-[#d5b582]"
                        : "border-white/10 bg-white/[.025] text-[#c7d9d3] hover:border-white/20 hover:bg-white/[.06]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isSelected ? "text-[#d5b582]" : "text-[#ebe7dc]"}`}>
                        {opt.label}
                      </span>
                      {isSelected && <Check size={14} className="text-[#d5b582]" />}
                    </div>
                    <div className="text-[11px] text-[#8ca6a1] mt-0.5">{opt.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Time Slot Selector (Playing Time for Sports / Dining Time for Dining / Ritual Time for Wellness) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-[#d5b582]">
                {isSports
                  ? "2. Playing Time (Today · All-Day Match Slots)"
                  : isWellness
                  ? "2. Ritual Time (Today · Sanctuary Slots)"
                  : "2. Dining Time (Today · All-Day Slots)"}
              </label>
              <span className="text-[11px] text-[#8ca6a1]">Instant Confirmation</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {timeSlots.map(slot => {
                const fullSlotLabel = `${slot.time} (${slot.label})`;
                const isSelected = timeSlot === fullSlotLabel || timeSlot.startsWith(slot.time);
                return (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => setTimeSlot(fullSlotLabel)}
                    className={`rounded-2xl border p-3 text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? "border-[#d5b582] bg-gradient-to-r from-[#d5b582]/25 to-[#d5b582]/10 text-[#fcf5e8] shadow-md ring-1 ring-[#d5b582]"
                        : "border-white/10 bg-white/[.025] text-[#c7d9d3] hover:border-white/20 hover:bg-white/[.06]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`font-mono text-sm font-bold px-2 py-0.5 rounded-lg ${
                        isSelected ? "bg-[#d5b582] text-[#122020]" : "bg-white/10 text-[#ebe7dc]"
                      }`}>
                        {slot.time}
                      </span>
                      <div>
                        <div className={`text-xs font-semibold ${isSelected ? "text-[#fcf5e8]" : "text-[#c7d9d3]"}`}>
                          {slot.label}
                        </div>
                        <div className="text-[10px] text-[#8ca6a1]">{slot.period}</div>
                      </div>
                    </div>
                    {isSelected && <Check size={16} className="text-[#d5b582] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Area / Setup Preference (Court & Gear Setup for Sports / Seating for Dining / Treatment Suite for Wellness) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-[#d5b582]">
                {isSports
                  ? "3. Preferred Court / Table & Equipment Setup"
                  : isWellness
                  ? "3. Treatment Suite & Ambiance Preference"
                  : "3. Preferred Seating Atmosphere"}
              </label>
              <span className="text-[11px] text-[#8ca6a1]">
                {isSports ? "Equipment sanitised & prepared" : "Subject to readiness"}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {seatingOptions.map(seat => {
                const isSelected = seatingArea === seat.name;
                return (
                  <button
                    key={seat.name}
                    type="button"
                    onClick={() => setSeatingArea(seat.name)}
                    className={`rounded-2xl border p-3 text-left transition-all flex items-start gap-3 ${
                      isSelected
                        ? "border-[#d5b582] bg-gradient-to-r from-[#d5b582]/20 to-[#d5b582]/5 text-[#fcf5e8] shadow-md ring-1 ring-[#d5b582]"
                        : "border-white/10 bg-white/[.025] text-[#c7d9d3] hover:border-white/20 hover:bg-white/[.06]"
                    }`}
                  >
                    <span className="text-xl shrink-0 mt-0.5">{seat.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold ${isSelected ? "text-[#d5b582] font-bold" : "text-[#fcf5e8]"}`}>
                          {seat.name}
                        </span>
                        {isSelected && <Check size={14} className="text-[#d5b582]" />}
                      </div>
                      <p className="text-[11px] text-[#8ca6a1] mt-0.5 leading-snug">{seat.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Match Type / Occasion / Wellness Goal */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#d5b582] block mb-2.5">
              {isSports
                ? "4. Match / Session Type"
                : isWellness
                ? "4. Wellness Focus & Ritual Goal"
                : "4. Special Occasion / Dietary Preference"}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {occasions.map(occ => {
                const isSelected = occasion === occ.label;
                return (
                  <button
                    key={occ.label}
                    type="button"
                    onClick={() => setOccasion(occ.label)}
                    className={`rounded-xl border py-2.5 px-3 text-left text-xs font-medium transition-all flex items-center gap-2 ${
                      isSelected
                        ? "border-[#d5b582] bg-[#d5b582] text-[#122020] font-bold shadow-sm"
                        : "border-white/10 bg-white/[.025] text-[#a7c2bc] hover:bg-white/[.06] hover:text-[#ebe7dc]"
                    }`}
                  >
                    <span className="text-sm">{occ.icon}</span>
                    <span className="truncate">{occ.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Special Request Notes */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#d5b582] block mb-2">
              {isSports
                ? "5. Player Gear Requests & Custom Notes (Optional)"
                : isWellness
                ? "5. Wellness Requests & Health Notes (Optional)"
                : "5. Custom Guest Notes / Special Requests (Optional)"}
            </label>
            <input
              type="text"
              value={specialRequests}
              onChange={e => setSpecialRequests(e.target.value)}
              placeholder={
                isSports
                  ? "e.g. Need left-handed cues, size 5 cricket bat, Yonex carbon racquets, extra match balls..."
                  : isWellness
                  ? "e.g. Medium pressure, lavender aroma preference, sensitive skin..."
                  : "e.g. Quiet corner table, anniversary candlelight setup, extra Jain prep..."
              }
              className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-xs text-[#fcf5e8] placeholder:text-[#6a807b] focus:border-[#d5b582] focus:outline-none focus:ring-1 focus:ring-[#d5b582]"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-white/10 bg-[#162928] px-6 sm:px-8 py-4 flex items-center justify-between gap-4">
          <button className="sr-button-quiet text-xs font-semibold px-4 py-2.5" onClick={onClose}>
            Cancel
          </button>
          <button
            className="sr-button flex-1 flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm font-bold"
            onClick={handleConfirm}
          >
            <CheckCircle2 size={16} />
            <span>
              {isSports
                ? (existingReservation ? "Update Playing Time Slot" : `Confirm Playing Time for ${guests} ${guests === 1 ? "Player" : "Players"}`)
                : isWellness
                ? (existingReservation ? "Update Ritual Time" : `Confirm Wellness Ritual for ${guests} ${guests === 1 ? "Guest" : "Guests"}`)
                : (existingReservation ? "Update Table Reservation" : `Confirm Table for ${guests} ${guests === 1 ? "Guest" : "Guests"}`)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function GuestAmenities({setPage}:{setPage:(p:Page)=>void}) {
  const { weather } = useLiveWeather();
  const [selectedCategory, setSelectedCategory] = useState<"All" | "Food & Drinks" | "Indoor Games" | "Outdoor Games" | "Wellness">("All");
  const [bookingItem, setBookingItem] = useState<any>(null);
  const [allReservations, setAllReservations] = useState<GuestReservationRecord[]>(getStoredGuestReservations);
  const [showCoveMenu, setShowCoveMenu] = useState<boolean>(false);
  const [showBarMenu, setShowBarMenu] = useState<boolean>(false);
  const [showVerandahMenu, setShowVerandahMenu] = useState<boolean>(false);
  const [showRasoiMenu, setShowRasoiMenu] = useState<boolean>(false);

  useEffect(() => {
    const handleUpdate = () => setAllReservations(getStoredGuestReservations());
    window.addEventListener("sr_reservations_updated", handleUpdate);
    return () => window.removeEventListener("sr_reservations_updated", handleUpdate);
  }, []);

  const tableReservations = useMemo(() => {
    const map: Record<string, GuestReservationRecord> = {};
    allReservations.forEach(r => {
      map[r.venueId] = r;
    });
    return map;
  }, [allReservations]);

  const foodAndDrinks = [
    {
      id: "dining-1",
      name: "The Cove Signature Seafood & Grill",
      subCategory: "Restaurant",
      gameType: "Food & Drinks",
      meta: "Coastal Goan & Contemporary European · Michelin-Trained Chef",
      price: "À la carte (Avg ₹2,200 for 2)",
      location: "Beachfront Ocean Terrace",
      state: "Open · Table Reserve",
      tone: "teal" as const,
      details: "Oceanfront gourmet dining featuring freshly caught Arabian Sea fish, farm-to-table organic produce, candlelit sunset tables, and curated international wine pairings."
    },
    {
      id: "bar-1",
      name: "Azure Sunset Lounge & Cocktail Bar",
      subCategory: "Bar",
      gameType: "Food & Drinks",
      meta: "Artisanal Cocktails · Sunset DJ Sets · Tapas & Spirits",
      price: "Cocktails from ₹650",
      location: "Cliffside Sunset Deck",
      state: "Open 16:00 - 01:00",
      tone: "teal" as const,
      details: "Signature craft mixology, botanical infusions, rare single malts, and chill sunset live acoustic & lounge sets overlooking the Arabian Sea."
    },
    {
      id: "brasserie-1",
      name: "The Verandah All-Day Brasserie & Cafe",
      subCategory: "Restaurant",
      gameType: "Food & Drinks",
      meta: "Buffet & Live Grills · Woodfired Pizza · Artisan Coffee",
      price: "Breakfast ₹1,100 · Dinner ₹1,800",
      location: "Main Courtyard Ground Floor",
      state: "Open 24/7",
      tone: "teal" as const,
      details: "All-day multi-cuisine brasserie with live woodfired pizza oven, charcoal tandoor, single-origin espresso bar, and artisan gelato station."
    },
    {
      id: "pureveg-1",
      name: "Rasoi Royal Pure Vegetarian & Jain Dining",
      subCategory: "Pure Veg Restaurant",
      gameType: "Food & Drinks",
      meta: "🟢 100% Pure Vegetarian & Jain Specialist · Royal Thali",
      price: "Royal Thali ₹850 · À la carte (Avg ₹1,400 for 2)",
      location: "Heritage Garden Pavilion",
      state: "Open · Separate Veg Kitchen",
      tone: "teal" as const,
      details: "Dedicated 100% pure vegetarian culinary haven with zero non-veg cross contamination and strict separate kitchen protocols. Serving authentic royal North & South Indian thalis, Gujarati/Marwari specialties, clay oven breads, and customized Jain menus."
    }
  ];

  const indoorGames = [
    {
      id: "snooker-1",
      name: "Royal Snooker Lounge",
      subCategory: "Snooker",
      gameType: "Indoor Games",
      meta: "12ft Tournament Table · Strachan 6811 Cloth",
      price: "₹800/hr",
      location: "Clubhouse Level 2",
      state: "Open",
      tone: "teal" as const,
      details: "Full-size 12ft tournament table with Strachan 6811 cloth, luxury cue lounge, and private spectator gallery."
    },
    {
      id: "pool-1",
      name: "8-Ball Pool Arena",
      subCategory: "Pool",
      gameType: "Indoor Games",
      meta: "9ft Pro Slate Tables · Aramith Balls",
      price: "₹500/hr",
      location: "Clubhouse Game Zone",
      state: "In Use",
      tone: "amber" as const,
      details: "Championship 9-foot slate tables with Aramith tournament balls, beverage service, and digital scoring."
    },
    {
      id: "carrom-1",
      name: "Championship Carrom Club",
      subCategory: "Carrom",
      gameType: "Indoor Games",
      meta: "English Birch Ply · Tournament Coins",
      price: "Complimentary",
      location: "Indoor Recreation Wing",
      state: "Open",
      tone: "teal" as const,
      details: "English Birch ply championship boards, precision coins, premium boric smooth powder, and LED overhead illumination."
    }
  ];

  const outdoorGames = [
    {
      id: "cricket-1",
      name: "Floodlit Cricket Nets & Pitch",
      subCategory: "Cricket",
      gameType: "Outdoor Games",
      meta: "Astro-Turf Pitch · Auto Bowling Machine",
      price: "₹1,200/hr",
      location: "Sports Arena East",
      state: "Open",
      tone: "teal" as const,
      details: "Professional astro-turf practice nets with automatic multi-speed bowling machine, speed radar, and kit bags."
    },
    {
      id: "badminton-1",
      name: "Badminton Court A",
      subCategory: "Badminton Court",
      gameType: "Outdoor Games",
      meta: "BWF Synthetic Mat · Tournament Lighting",
      price: "₹600/hr",
      location: "Sports Pavilion",
      state: "Open",
      tone: "teal" as const,
      details: "BWF-standard shock-absorbent synthetic mat court with anti-glare tournament lighting and Yonex equipment rental."
    },
    {
      id: "golf-1",
      name: "Executive Golf Putting Green",
      subCategory: "Golf",
      gameType: "Outdoor Games",
      meta: "9-Hole Championship Putting · Pro Equipment",
      price: "₹1,500/hr",
      location: "Garden Greens Course",
      state: "Open",
      tone: "teal" as const,
      details: "9-hole undulating championship putting green with Titleist Scotty Cameron putters, practice balls, and caddie assistance."
    }
  ];

  const wellnessAmenities = [
    {
      id: "spa-1",
      name: "Luxury Spa & Hydrotherapy",
      subCategory: "Spa",
      gameType: "Wellness",
      meta: "Holistic treatments · Hot Spring Soak",
      price: "₹3,500/session",
      location: "Lotus Sanctuary",
      state: "Waitlist",
      tone: "amber" as const,
      details: "A quiet ritual of warm mineral water, steam therapy, and restorative massage overlooking the cove."
    },
    {
      id: "yoga-1",
      name: "Outdoor Yoga & Meditation Studio",
      subCategory: "Wellness",
      gameType: "Wellness",
      meta: "Morning Vinyasa & Sunset Soundbath",
      price: "Complimentary",
      location: "Zen Garden Deck",
      state: "Available",
      tone: "teal" as const,
      details: "Sunrise and sunset wellness classes conducted by certified yoga masters overlooking the ocean."
    },
    {
      id: "pool-resort-1",
      name: "Infinity Pool & Ocean Daybeds",
      subCategory: "Pool",
      gameType: "Wellness",
      meta: "Panoramic Cliffside · Cocktail Service",
      price: "Complimentary",
      location: "Cliffside Pool Deck",
      state: "Open",
      tone: "teal" as const,
      details: "Cliffside heated infinity pool with swim-up bar, private sun loungers, and complimentary towel service."
    }
  ];

  const confirmBooking = (item: any) => {
    const newRecord: GuestReservationRecord = {
      id: `RES-${Math.floor(1000 + Math.random() * 9000)}`,
      venueId: item.id,
      venueName: item.name,
      category: item.gameType === "Wellness" ? "Wellness" : item.gameType === "Indoor Games" ? "Sports" : "Activity",
      iconType: item.gameType === "Wellness" ? "sparkles" : "target",
      guests: 2,
      timeSlot: "15:00 (Today Slot)",
      date: "Today · 26 Sep 2026",
      seatingArea: item.location,
      occasion: "Resort Leisure",
      specialRequests: "Standard amenity booking reserved",
      price: item.price,
      location: item.location,
      status: "Confirmed"
    };
    const updated = [newRecord, ...allReservations.filter(r => r.venueId !== item.id)];
    saveStoredGuestReservations(updated);
    setAllReservations(updated);
    toast.success(`Booking Confirmed for ${item.name}!`, {
      description: `Category: ${item.gameType} · ${item.subCategory} | Fee: ${item.price} | Location: ${item.location}`
    });
    setBookingItem(null);
  };

  return (
    <main className="sr-content">
      <div className="sr-phone-wrap">
        <div className="sr-phone-card">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button className="sr-button-quiet" onClick={() => setPage("guest-home")}>
                  <ArrowLeft size={17} />
                </button>
                <div>
                  <div className="sr-kicker text-[#d5b582]">Sunridge Cove</div>
                  <h1 className="mt-1 font-serif text-3xl">Explore amenities</h1>
                </div>
              </div>
              <button
                onClick={() => setPage("reservations")}
                className="flex items-center gap-1.5 rounded-xl border border-[#d5b582]/30 bg-[#d5b582]/10 px-3 py-1.5 text-xs font-semibold text-[#d5b582] hover:bg-[#d5b582]/20"
              >
                <CalendarDays size={13} />
                <span>My Bookings ({allReservations.length})</span>
              </button>
            </div>

            {/* Live Weather Advisory for Amenities */}
            {weather && (
              <div className="mt-4 flex items-center justify-between rounded-xl border border-[#8fd6c2]/20 bg-[#8fd6c2]/[.06] p-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">🌤️</span>
                  <div>
                    <div className="font-semibold text-[#8fd6c2]">
                      Live Goa Weather: {weather.current.temperature_c}°C · {weather.current.condition}
                    </div>
                    <div className="sr-muted text-[11px] mt-0.5">
                      {weather.current.condition.toLowerCase().includes("rain")
                        ? "Indoor games (Snooker, Pool, Carrom) are ideal today!"
                        : "Optimal conditions for Outdoor Courts (Cricket, Badminton, Golf)."}
                    </div>
                  </div>
                </div>
                <StatusChip tone="teal">Live</StatusChip>
              </div>
            )}

            {/* Category Filter Tabs */}
            <div className="mt-6 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {(["All", "Food & Drinks", "Indoor Games", "Outdoor Games", "Wellness"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    selectedCategory === cat
                      ? "bg-[#d5b582] text-[#122020] shadow-md"
                      : "border border-white/10 bg-white/[.04] text-[#ebe7dc] hover:bg-white/[.08]"
                  }`}
                >
                  {cat === "Food & Drinks" ? "🍽️ Food & Drinks" : cat === "Indoor Games" ? "🎱 Indoor Games" : cat === "Outdoor Games" ? "⛳ Outdoor Games" : cat === "Wellness" ? "🌿 Wellness" : "✨ All"}
                </button>
              ))}
            </div>

            {/* Booking Modal / Dialog for All Amenities (Dining, Sports Playing Time, Wellness) */}
            {bookingItem && (
              <TableReservationModal
                item={bookingItem}
                existingReservation={tableReservations[bookingItem.id]}
                onClose={() => setBookingItem(null)}
                onConfirm={(res) => {
                  const isSports = bookingItem.gameType === "Indoor Games" || bookingItem.gameType === "Outdoor Games" || bookingItem.category === "Sports" || bookingItem.category === "Activity" || bookingItem.id === "snooker-1" || bookingItem.id === "pool-1" || bookingItem.id === "carrom-1" || bookingItem.id === "cricket-1" || bookingItem.id === "badminton-1" || bookingItem.id === "golf-1";
                  const isWellness = bookingItem.gameType === "Wellness" || bookingItem.category === "Wellness" || bookingItem.id === "spa-1" || bookingItem.id === "yoga-1" || bookingItem.id === "pool-resort-1";
                  const isBar = bookingItem.subCategory === "Bar" || bookingItem.category === "Bar";

                  const newRecord: GuestReservationRecord = {
                    id: res.id,
                    venueId: res.venueId,
                    venueName: res.venueName,
                    category: isBar ? "Bar" : isSports ? "Sports" : isWellness ? "Wellness" : "Dining",
                    iconType: isBar ? "wine" : isSports ? "target" : isWellness ? "sparkles" : "utensils",
                    guests: res.guests,
                    timeSlot: res.timeSlot,
                    date: "Today · 26 Sep 2026",
                    seatingArea: res.seatingArea,
                    occasion: res.occasion,
                    specialRequests: res.specialRequests,
                    price: bookingItem.price,
                    location: bookingItem.location,
                    status: "Confirmed"
                  };
                  const updated = [newRecord, ...allReservations.filter(r => r.venueId !== res.venueId)];
                  saveStoredGuestReservations(updated);
                  setAllReservations(updated);
                  setBookingItem(null);

                  if (isSports) {
                    toast.success(`Playing Slot Booked: ${res.venueName}!`, {
                      description: `Playing Time: ${res.timeSlot} · ${res.guests} ${res.guests === 1 ? 'Player' : 'Players'} · ${res.seatingArea}`
                    });
                  } else if (isWellness) {
                    toast.success(`Wellness Ritual Booked: ${res.venueName}!`, {
                      description: `Ritual Time: ${res.timeSlot} · ${res.guests} ${res.guests === 1 ? 'Guest' : 'Guests'} · ${res.seatingArea}`
                    });
                  } else {
                    toast.success(`Table Reserved: ${res.venueName}!`, {
                      description: `Dining Time: ${res.timeSlot} · ${res.guests} ${res.guests === 1 ? 'Guest' : 'Guests'} · ${res.seatingArea}`
                    });
                  }
                }}
                onCancelReservation={(venueId) => {
                  const updated = allReservations.filter(r => r.venueId !== venueId);
                  saveStoredGuestReservations(updated);
                  setAllReservations(updated);
                  setBookingItem(null);
                  toast.info("Reservation Cancelled", {
                    description: "Your booking for today has been cancelled."
                  });
                }}
              />
            )}

            {/* Amenities List Grouped with Sub-sections */}
            <div className="mt-6 space-y-6">
              {/* SECTION: FOOD & DRINKS (RESTAURANT & BAR) */}
              {(selectedCategory === "All" || selectedCategory === "Food & Drinks") && (
                <div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-[#d5b582]">🍽️ Food & Drinks</span>
                      <span className="text-xs text-[#a8bfb8]">(Restaurant, Lounge Bar, Brasserie)</span>
                    </div>
                    <StatusChip tone="teal">{foodAndDrinks.length} Venues</StatusChip>
                  </div>

                  <div className="mt-3.5 space-y-3.5">
                    {foodAndDrinks.map((item) => (
                      <div
                        key={item.id}
                        className={`group relative rounded-2xl border p-4 transition-all hover:bg-white/[.05] shadow-sm ${
                          tableReservations[item.id]
                            ? "border-emerald-500/40 bg-emerald-950/[.12]"
                            : "border-white/8 bg-white/[.025] hover:border-[#d5b582]/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3.5">
                            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#d5b582]/12 text-[#d5b582] border border-[#d5b582]/25 shadow-inner">
                              {item.subCategory === "Bar" ? <Wine size={22} /> : <Utensils size={22} />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="rounded bg-[#d5b582]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#d5b582]">
                                  {item.subCategory}
                                </span>
                                <h4 className="text-base font-semibold text-[#fcf5e8]">{item.name}</h4>
                              </div>
                              <div className="mt-1 text-xs sm:text-sm text-[#c8d9d2] leading-relaxed">{item.meta}</div>
                              <div className="mt-2 flex items-center gap-2 text-xs text-[#d5b582]">
                                <span className="font-semibold">{item.price}</span>
                                <span>·</span>
                                <span className="text-[#a4c0ba]">{item.location}</span>
                              </div>
                            </div>
                          </div>
                          <StatusChip tone={tableReservations[item.id] ? "teal" : item.tone}>
                            {tableReservations[item.id] ? "Table Booked" : item.state}
                          </StatusChip>
                        </div>

                        {/* Active Same-Day Reservation Indicator */}
                        {tableReservations[item.id] && (
                          <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-500/35 bg-emerald-500/[.10] px-3.5 py-2.5 text-xs text-emerald-200 animate-in fade-in">
                            <div className="flex items-center gap-2">
                              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                              <span className="font-semibold text-emerald-300">
                                Dining Time: Reserved Today at {tableReservations[item.id].timeSlot} ({tableReservations[item.id].guests} {tableReservations[item.id].guests === 1 ? "Guest" : "Guests"} · {tableReservations[item.id].seatingArea})
                              </span>
                            </div>
                            <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-500/30">
                              {tableReservations[item.id].id}
                            </span>
                          </div>
                        )}

                        <div className="mt-3.5 flex items-center justify-between border-t border-white/6 pt-2.5">
                          <span className="text-xs text-[#9eb6b0]">
                            {tableReservations[item.id]
                              ? `Reserved for ${tableReservations[item.id].guests} guests · Click button to modify`
                              : "Complimentary table seating for in-house guests"}
                          </span>
                          <div className="flex items-center gap-2">
                            {item.id === "dining-1" && (
                              <button
                                className="flex items-center gap-1.5 rounded-lg border border-[#d5b582]/40 bg-white/[.04] px-3 py-1.5 text-xs font-semibold text-[#fcf5e8] transition-all hover:bg-white/[.09] hover:border-[#d5b582] shadow-sm"
                                onClick={() => setShowCoveMenu(true)}
                              >
                                <BookOpen size={13} className="text-[#d5b582]" />
                                <span>View Menu</span>
                              </button>
                            )}
                            {item.id === "bar-1" && (
                              <button
                                className="flex items-center gap-1.5 rounded-lg border border-[#d5b582]/40 bg-white/[.04] px-3 py-1.5 text-xs font-semibold text-[#fcf5e8] transition-all hover:bg-white/[.09] hover:border-[#d5b582] shadow-sm"
                                onClick={() => setShowBarMenu(true)}
                              >
                                <Wine size={13} className="text-[#d5b582]" />
                                <span>View Bar Menu</span>
                              </button>
                            )}
                            {item.id === "brasserie-1" && (
                              <button
                                className="flex items-center gap-1.5 rounded-lg border border-[#d5b582]/40 bg-white/[.04] px-3 py-1.5 text-xs font-semibold text-[#fcf5e8] transition-all hover:bg-white/[.09] hover:border-[#d5b582] shadow-sm"
                                onClick={() => setShowVerandahMenu(true)}
                              >
                                <Coffee size={13} className="text-[#d5b582]" />
                                <span>View Menu</span>
                              </button>
                            )}
                            {item.id === "pureveg-1" && (
                              <button
                                className="flex items-center gap-1.5 rounded-lg border border-[#8fd6c2]/50 bg-[#8fd6c2]/[.08] px-3 py-1.5 text-xs font-semibold text-[#8fd6c2] transition-all hover:bg-[#8fd6c2]/20 hover:border-[#8fd6c2] shadow-sm"
                                onClick={() => setShowRasoiMenu(true)}
                              >
                                <BookOpen size={13} className="text-[#8fd6c2]" />
                                <span>View Pure Veg Menu</span>
                              </button>
                            )}
                            <button
                              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all shadow-sm ${
                                tableReservations[item.id]
                                  ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500 hover:text-[#122020] font-bold"
                                  : "bg-[#d5b582]/20 text-[#d5b582] hover:bg-[#d5b582] hover:text-[#122020]"
                              }`}
                              onClick={() => setBookingItem(item)}
                            >
                              {tableReservations[item.id]
                                ? `✓ Reserved: Today @ ${tableReservations[item.id].timeSlot.split(' ')[0]} (${tableReservations[item.id].guests}p)`
                                : item.subCategory === "Bar" ? "Reserve Lounge" : "Reserve Table"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION: INDOOR GAMES */}
              {(selectedCategory === "All" || selectedCategory === "Indoor Games") && (
                <div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-[#d5b582]">🎱 Indoor Games</span>
                      <span className="text-xs text-[#a8bfb8]">(Snooker, Pool, Carrom)</span>
                    </div>
                    <StatusChip tone="teal">{indoorGames.length} Activities</StatusChip>
                  </div>

                  <div className="mt-3.5 space-y-3.5">
                    {indoorGames.map((game) => (
                      <div
                        key={game.id}
                        className={`group relative rounded-2xl border p-4 transition-all hover:bg-white/[.05] shadow-sm ${
                          tableReservations[game.id]
                            ? "border-emerald-500/40 bg-emerald-950/[.12]"
                            : "border-white/8 bg-white/[.025] hover:border-[#d5b582]/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3.5">
                            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#d5b582]/12 text-[#d5b582] border border-[#d5b582]/25 shadow-inner">
                              <Sparkles size={22} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="rounded bg-[#d5b582]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#d5b582]">
                                  {game.subCategory}
                                </span>
                                <h4 className="text-base font-semibold text-[#fcf5e8]">{game.name}</h4>
                              </div>
                              <div className="mt-1 text-xs sm:text-sm text-[#c8d9d2] leading-relaxed">{game.meta}</div>
                              <div className="mt-2 flex items-center gap-2 text-xs text-[#d5b582]">
                                <span className="font-semibold">{game.price}</span>
                                <span>·</span>
                                <span className="text-[#a4c0ba]">{game.location}</span>
                              </div>
                            </div>
                          </div>
                          <StatusChip tone={tableReservations[game.id] ? "teal" : game.tone}>
                            {tableReservations[game.id] ? "Slot Booked" : game.state}
                          </StatusChip>
                        </div>

                        {/* Active Same-Day Reservation Indicator */}
                        {tableReservations[game.id] && (
                          <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-500/35 bg-emerald-500/[.10] px-3.5 py-2.5 text-xs text-emerald-200 animate-in fade-in">
                            <div className="flex items-center gap-2">
                              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                              <span className="font-semibold text-emerald-300">
                                Playing Time: Reserved Today at {tableReservations[game.id].timeSlot} ({tableReservations[game.id].guests} {tableReservations[game.id].guests === 1 ? "Player" : "Players"} · {tableReservations[game.id].seatingArea})
                              </span>
                            </div>
                            <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-500/30">
                              {tableReservations[game.id].id}
                            </span>
                          </div>
                        )}

                        <div className="mt-3.5 flex items-center justify-between border-t border-white/6 pt-2.5">
                          <span className="text-xs text-[#9eb6b0]">
                            {tableReservations[game.id]
                              ? `Playing slot reserved for ${tableReservations[game.id].guests} players · Click button to modify`
                              : "Instant playing slot reservation"}
                          </span>
                          <button
                            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all shadow-sm ${
                              tableReservations[game.id]
                                ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500 hover:text-[#122020] font-bold"
                                : "bg-[#d5b582]/20 text-[#d5b582] hover:bg-[#d5b582] hover:text-[#122020]"
                            }`}
                            onClick={() => setBookingItem(game)}
                          >
                            {tableReservations[game.id]
                              ? `✓ Playing Time: @ ${tableReservations[game.id].timeSlot.split(' ')[0]} (${tableReservations[game.id].guests}p)`
                              : "Book Playing Slot"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION: OUTDOOR GAMES */}
              {(selectedCategory === "All" || selectedCategory === "Outdoor Games") && (
                <div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-[#8fd6c2]">🏏 Outdoor Games</span>
                      <span className="text-xs text-[#a8bfb8]">(Cricket, Badminton, Golf)</span>
                    </div>
                    <StatusChip tone="teal">{outdoorGames.length} Sports</StatusChip>
                  </div>

                  <div className="mt-3.5 space-y-3.5">
                    {outdoorGames.map((game) => (
                      <div
                        key={game.id}
                        className={`group relative rounded-2xl border p-4 transition-all hover:bg-white/[.05] shadow-sm ${
                          tableReservations[game.id]
                            ? "border-emerald-500/40 bg-emerald-950/[.12]"
                            : "border-white/8 bg-white/[.025] hover:border-[#8fd6c2]/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3.5">
                            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#8fd6c2]/12 text-[#8fd6c2] border border-[#8fd6c2]/25 shadow-inner">
                              <Target size={22} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="rounded bg-[#8fd6c2]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#8fd6c2]">
                                  {game.subCategory}
                                </span>
                                <h4 className="text-base font-semibold text-[#fcf5e8]">{game.name}</h4>
                              </div>
                              <div className="mt-1 text-xs sm:text-sm text-[#c8d9d2] leading-relaxed">{game.meta}</div>
                              <div className="mt-2 flex items-center gap-2 text-xs text-[#8fd6c2]">
                                <span className="font-semibold">{game.price}</span>
                                <span>·</span>
                                <span className="text-[#a4c0ba]">{game.location}</span>
                              </div>
                            </div>
                          </div>
                          <StatusChip tone={tableReservations[game.id] ? "teal" : game.tone}>
                            {tableReservations[game.id] ? "Court Booked" : game.state}
                          </StatusChip>
                        </div>

                        {/* Active Same-Day Reservation Indicator */}
                        {tableReservations[game.id] && (
                          <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-500/35 bg-emerald-500/[.10] px-3.5 py-2.5 text-xs text-emerald-200 animate-in fade-in">
                            <div className="flex items-center gap-2">
                              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                              <span className="font-semibold text-emerald-300">
                                Playing Time: Reserved Today at {tableReservations[game.id].timeSlot} ({tableReservations[game.id].guests} {tableReservations[game.id].guests === 1 ? "Player" : "Players"} · {tableReservations[game.id].seatingArea})
                              </span>
                            </div>
                            <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-500/30">
                              {tableReservations[game.id].id}
                            </span>
                          </div>
                        )}

                        <div className="mt-3.5 flex items-center justify-between border-t border-white/6 pt-2.5">
                          <span className="text-xs text-[#9eb6b0]">
                            {tableReservations[game.id]
                              ? `Court reserved for ${tableReservations[game.id].guests} players · Click button to modify`
                              : "Complimentary equipment provided"}
                          </span>
                          <button
                            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all shadow-sm ${
                              tableReservations[game.id]
                                ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500 hover:text-[#122020] font-bold"
                                : "bg-[#8fd6c2]/20 text-[#8fd6c2] hover:bg-[#8fd6c2] hover:text-[#122020]"
                            }`}
                            onClick={() => setBookingItem(game)}
                          >
                            {tableReservations[game.id]
                              ? `✓ Playing Time: @ ${tableReservations[game.id].timeSlot.split(' ')[0]} (${tableReservations[game.id].guests}p)`
                              : "Book Pitch / Court"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION: WELLNESS & SPA */}
              {(selectedCategory === "All" || selectedCategory === "Wellness") && (
                <div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-[#e9bc73]">🌿 Wellness & Leisure</span>
                      <span className="text-xs text-[#a8bfb8]">(Spa, Yoga, Daybeds)</span>
                    </div>
                    <StatusChip tone="amber">Popular</StatusChip>
                  </div>

                  <div className="mt-3.5 space-y-3.5">
                    {wellnessAmenities.map((item) => (
                      <div
                        key={item.id}
                        className={`group relative rounded-2xl border p-4 transition-all hover:bg-white/[.05] shadow-sm ${
                          tableReservations[item.id]
                            ? "border-emerald-500/40 bg-emerald-950/[.12]"
                            : "border-white/8 bg-white/[.025] hover:border-[#e9bc73]/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3.5">
                            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#e9bc73]/12 text-[#e9bc73] border border-[#e9bc73]/25 shadow-inner">
                              <Sparkles size={22} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="rounded bg-[#e9bc73]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#e9bc73]">
                                  {item.subCategory}
                                </span>
                                <h4 className="text-base font-semibold text-[#fcf5e8]">{item.name}</h4>
                              </div>
                              <div className="mt-1 text-xs sm:text-sm text-[#c8d9d2] leading-relaxed">{item.meta}</div>
                              <div className="mt-2 flex items-center gap-2 text-xs text-[#e9bc73]">
                                <span className="font-semibold">{item.price}</span>
                                <span>·</span>
                                <span className="text-[#a4c0ba]">{item.location}</span>
                              </div>
                            </div>
                          </div>
                          <StatusChip tone={tableReservations[item.id] ? "teal" : item.tone}>
                            {tableReservations[item.id] ? "Ritual Booked" : item.state}
                          </StatusChip>
                        </div>

                        {/* Active Same-Day Reservation Indicator */}
                        {tableReservations[item.id] && (
                          <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-500/35 bg-emerald-500/[.10] px-3.5 py-2.5 text-xs text-emerald-200 animate-in fade-in">
                            <div className="flex items-center gap-2">
                              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                              <span className="font-semibold text-emerald-300">
                                Ritual Time: Reserved Today at {tableReservations[item.id].timeSlot} ({tableReservations[item.id].guests} {tableReservations[item.id].guests === 1 ? "Guest" : "Guests"} · {tableReservations[item.id].seatingArea})
                              </span>
                            </div>
                            <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-500/30">
                              {tableReservations[item.id].id}
                            </span>
                          </div>
                        )}

                        <div className="mt-3.5 flex items-center justify-between border-t border-white/6 pt-2.5">
                          <span className="text-xs text-[#9eb6b0]">
                            {tableReservations[item.id]
                              ? `Ritual scheduled for ${tableReservations[item.id].guests} guests · Click button to modify`
                              : "Lotus Sanctuary access"}
                          </span>
                          <button
                            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all shadow-sm ${
                              tableReservations[item.id]
                                ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500 hover:text-[#122020] font-bold"
                                : "bg-[#e9bc73]/20 text-[#e9bc73] hover:bg-[#e9bc73] hover:text-[#122020]"
                            }`}
                            onClick={() => {
                              if (item.state === "Waitlist" && !tableReservations[item.id]) {
                                setPage("amenity-detail");
                              } else {
                                setBookingItem(item);
                              }
                            }}
                          >
                            {tableReservations[item.id]
                              ? `✓ Ritual Time: @ ${tableReservations[item.id].timeSlot.split(' ')[0]} (${tableReservations[item.id].guests}p)`
                              : item.state === "Waitlist" ? "Join Waitlist" : "Reserve Ritual"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <GuestBottom active="amenities" setPage={setPage} />
        </div>
      </div>
      {showCoveMenu && (
        <CoveMenuModal
          onClose={() => setShowCoveMenu(false)}
          onReserve={() => {
            setShowCoveMenu(false);
            setBookingItem(foodAndDrinks[0]);
          }}
        />
      )}
      {showBarMenu && (
        <BarMenuModal
          onClose={() => setShowBarMenu(false)}
          onReserve={() => {
            setShowBarMenu(false);
            setBookingItem(foodAndDrinks[1]);
          }}
        />
      )}
      {showVerandahMenu && (
        <VerandahMenuModal
          onClose={() => setShowVerandahMenu(false)}
          onReserve={() => {
            setShowVerandahMenu(false);
            setBookingItem(foodAndDrinks.find(f => f.id === "brasserie-1") || foodAndDrinks[2]);
          }}
        />
      )}
      {showRasoiMenu && (
        <RasoiRoyalMenuModal
          onClose={() => setShowRasoiMenu(false)}
          onReserve={() => {
            setShowRasoiMenu(false);
            setBookingItem(foodAndDrinks.find(f => f.id === "pureveg-1") || foodAndDrinks[3]);
          }}
        />
      )}
    </main>
  );
}
function GuestMyReservations({ setPage }: { setPage: (p: Page) => void }) {
  const [reservations, setReservations] = useState<GuestReservationRecord[]>(getStoredGuestReservations);
  const [selectedFilter, setSelectedFilter] = useState<"All" | "Dining & Bars" | "Wellness" | "Sports">("All");
  const [editingReservation, setEditingReservation] = useState<GuestReservationRecord | null>(null);
  const [showCoveMenu, setShowCoveMenu] = useState(false);
  const [showBarMenu, setShowBarMenu] = useState(false);
  const [showVerandahMenu, setShowVerandahMenu] = useState(false);
  const [showRasoiMenu, setShowRasoiMenu] = useState(false);

  useEffect(() => {
    const handleUpdate = () => setReservations(getStoredGuestReservations());
    window.addEventListener("sr_reservations_updated", handleUpdate);
    return () => window.removeEventListener("sr_reservations_updated", handleUpdate);
  }, []);

  const filteredReservations = useMemo(() => {
    if (selectedFilter === "All") return reservations;
    if (selectedFilter === "Dining & Bars") return reservations.filter(r => r.category === "Dining" || r.category === "Bar");
    if (selectedFilter === "Wellness") return reservations.filter(r => r.category === "Wellness");
    if (selectedFilter === "Sports") return reservations.filter(r => r.category === "Sports" || r.category === "Activity");
    return reservations;
  }, [reservations, selectedFilter]);

  const diningCount = useMemo(() => reservations.filter(r => r.category === "Dining" || r.category === "Bar").length, [reservations]);
  const wellnessCount = useMemo(() => reservations.filter(r => r.category === "Wellness").length, [reservations]);
  const sportsCount = useMemo(() => reservations.filter(r => r.category === "Sports" || r.category === "Activity").length, [reservations]);

  const handleCancel = (id: string, name: string) => {
    const updated = reservations.filter(r => r.id !== id);
    saveStoredGuestReservations(updated);
    setReservations(updated);
    toast.info(`Reservation for ${name} has been cancelled.`);
  };

  const handleUpdateReservation = (updatedRes: TableReservation) => {
    const updated = reservations.map(r => {
      if (r.id === updatedRes.id || r.venueId === updatedRes.venueId) {
        return {
          ...r,
          guests: updatedRes.guests,
          timeSlot: updatedRes.timeSlot,
          seatingArea: updatedRes.seatingArea,
          occasion: updatedRes.occasion,
          specialRequests: updatedRes.specialRequests
        };
      }
      return r;
    });
    saveStoredGuestReservations(updated);
    setReservations(updated);
    setEditingReservation(null);
    toast.success(`Reservation updated for ${updatedRes.venueName}!`, {
      description: `New time: ${updatedRes.timeSlot} · ${updatedRes.guests} Guests`
    });
  };

  const openVenueMenu = (venueId: string) => {
    if (venueId === "dining-1") setShowCoveMenu(true);
    else if (venueId === "bar-1") setShowBarMenu(true);
    else if (venueId === "brasserie-1") setShowVerandahMenu(true);
    else if (venueId === "pureveg-1") setShowRasoiMenu(true);
    else setShowCoveMenu(true);
  };

  return (
    <main className="sr-content">
      <div className="sr-phone-wrap">
        <div className="sr-phone-card">
          <div className="p-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button className="sr-button-quiet" onClick={() => setPage("guest-home")}>
                  <ArrowLeft size={17} />
                </button>
                <div>
                  <div className="sr-kicker text-[#d5b582]">Room 101 · Authenticated Guest</div>
                  <h1 className="mt-1 font-serif text-3xl">My Reservations</h1>
                </div>
              </div>
              <button
                onClick={() => setPage("amenities")}
                className="flex items-center gap-1.5 rounded-xl border border-[#d5b582]/40 bg-[#d5b582]/15 px-3 py-1.5 text-xs font-bold text-[#d5b582] hover:bg-[#d5b582] hover:text-[#122020] transition-all shadow-sm"
              >
                <Plus size={13} />
                <span>Book New</span>
              </button>
            </div>

            {/* Today's Schedule Overview Banner */}
            <div className="mt-4 rounded-2xl border border-[#d5b582]/30 bg-gradient-to-r from-[#d5b582]/15 via-[#1a2e2b] to-[#122020] p-4 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#d5b582]">
                    📅 Today's Itinerary · 26 Sep (Day 2 of 5)
                  </div>
                  <div className="mt-1 text-base font-semibold text-[#fcf5e8]">
                    {reservations.length === 0
                      ? "No bookings scheduled for today"
                      : `${reservations.length} Active ${reservations.length === 1 ? "Booking" : "Bookings"} Today`}
                  </div>
                </div>
                <StatusChip tone="teal" pulse={reservations.length > 0}>
                  {reservations.length > 0 ? "Confirmed" : "Ready"}
                </StatusChip>
              </div>
              {reservations.length > 0 && (
                <div className="mt-2.5 pt-2.5 border-t border-white/8 flex items-center gap-2 text-xs text-[#c4ded6]">
                  <Clock3 size={13} className="text-[#d5b582] shrink-0" />
                  <span>
                    Next: <strong className="text-[#fcf5e8]">{reservations[0].timeSlot}</strong> · {reservations[0].venueName}
                  </span>
                </div>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="mt-5 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: "All", label: `All Today (${reservations.length})` },
                { id: "Dining & Bars", label: `🍽️ Dining & Bars (${diningCount})` },
                { id: "Wellness", label: `🌿 Wellness (${wellnessCount})` },
                { id: "Sports", label: `🎱 Sports (${sportsCount})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedFilter(tab.id as any)}
                  className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    selectedFilter === tab.id
                      ? "bg-[#d5b582] text-[#122020] shadow-md font-bold"
                      : "border border-white/10 bg-white/[.04] text-[#ebe7dc] hover:bg-white/[.08]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Reservations List */}
            <div className="mt-5 space-y-4">
              {filteredReservations.length === 0 ? (
                <div className="sr-empty-state rounded-2xl border border-white/8 bg-white/[.02] p-8 text-center my-4">
                  <CalendarDays size={28} className="mx-auto text-[#d5b582]/60" />
                  <h3 className="mt-3 font-serif text-xl text-[#fcf5e8]">No Reservations in this Category</h3>
                  <p className="sr-muted mt-1 text-xs max-w-xs mx-auto">
                    You haven't reserved any slots for {selectedFilter} today. Explore our luxury amenities to reserve now.
                  </p>
                  <button
                    className="sr-button mt-4 mx-auto text-xs"
                    onClick={() => setPage("amenities")}
                  >
                    <Plus size={14} /> Explore & Reserve Amenities
                  </button>
                </div>
              ) : (
                filteredReservations.map((res) => {
                  const isSportsRes = res.category === "Sports" || res.category === "Activity";
                  const isWellnessRes = res.category === "Wellness";
                  const isBarRes = res.category === "Bar";

                  return (
                    <div
                      key={res.id}
                      className="rounded-2xl border border-[#d5b582]/30 bg-gradient-to-br from-white/[.04] to-white/[.01] p-4.5 shadow-md transition-all hover:border-[#d5b582]/60"
                    >
                      {/* Top Row: Time Badge, Venue Name & Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="flex items-center gap-1.5 rounded-lg bg-[#d5b582] px-2.5 py-1 font-mono text-xs font-bold text-[#122020] shadow-sm">
                              <Clock3 size={13} />
                              <span>{isSportsRes ? `Playing Time: ${res.timeSlot}` : isWellnessRes ? `Ritual Time: ${res.timeSlot}` : `Dining Time: ${res.timeSlot}`}</span>
                            </span>
                            <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold text-[#c7d9d3]">
                              {isSportsRes ? "🏆 Sports & Game Slot" : isWellnessRes ? "🌿 Wellness Ritual" : isBarRes ? "🍸 Lounge Bar" : "🍽️ Restaurant Table"}
                            </span>
                          </div>
                          <h3 className="mt-2 font-serif text-lg font-semibold text-[#fcf5e8]">
                            {res.venueName}
                          </h3>
                          <div className="mt-1 flex items-center gap-2 text-xs text-[#8ca6a1]">
                            <MapPin size={13} className="text-[#d5b582]" />
                            <span>{res.location}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <StatusChip tone="teal" pulse>
                            {res.status} Today
                          </StatusChip>
                          <span className="font-mono text-[10px] text-[#8ca6a1]">#{res.id}</span>
                        </div>
                      </div>

                      {/* Booking Details Matrix */}
                      <div className="mt-3.5 rounded-xl border border-white/6 bg-black/20 p-3 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="sr-muted text-[10px] uppercase tracking-wider block">
                            {isSportsRes ? "Number of Players" : isWellnessRes ? "Number of Guests" : "Party Size"}
                          </span>
                          <span className="font-semibold text-[#fcf5e8] mt-0.5 block">
                            👥 {res.guests} {isSportsRes ? (res.guests === 1 ? "Player" : "Players") : (res.guests === 1 ? "Guest" : "Guests")}
                          </span>
                        </div>
                        <div>
                          <span className="sr-muted text-[10px] uppercase tracking-wider block">
                            {isSportsRes ? "Court / Table Setup" : isWellnessRes ? "Treatment Suite" : "Seating Area"}
                          </span>
                          <span className="font-semibold text-[#fcf5e8] mt-0.5 block truncate">
                            {isSportsRes ? "🏟️ " : isWellnessRes ? "🪷 " : "🪑 "}{res.seatingArea}
                          </span>
                        </div>
                        {res.occasion && res.occasion !== "None" && res.occasion !== "Casual Dining" && (
                          <div className="col-span-2 border-t border-white/6 pt-2">
                            <span className="sr-muted text-[10px] uppercase tracking-wider block">
                              {isSportsRes ? "Match / Session Type" : isWellnessRes ? "Wellness Ritual Focus" : "Special Occasion"}
                            </span>
                            <span className="font-medium text-[#d5b582] mt-0.5 block">
                              ✨ {res.occasion}
                            </span>
                          </div>
                        )}
                        {res.specialRequests && (
                          <div className="col-span-2 border-t border-white/6 pt-2">
                            <span className="sr-muted text-[10px] uppercase tracking-wider block">
                              {isSportsRes ? "Player Gear & Custom Notes" : isWellnessRes ? "Treatment & Health Notes" : "Custom Requests"}
                            </span>
                            <span className="text-[#d4ded7] text-[11px] mt-0.5 block italic">
                              "{res.specialRequests}"
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/8 pt-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingReservation(res)}
                            className="rounded-lg border border-[#d5b582]/40 bg-[#d5b582]/10 px-3 py-1.5 text-xs font-semibold text-[#d5b582] hover:bg-[#d5b582] hover:text-[#122020] transition-colors"
                          >
                            ✏️ {isSportsRes ? "Modify Playing Time" : isWellnessRes ? "Modify Ritual Time" : "Modify Dining Time"}
                          </button>
                          <button
                            onClick={() => handleCancel(res.id, res.venueName)}
                            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500 hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          {(res.category === "Dining" || res.category === "Bar") && (
                            <button
                              onClick={() => openVenueMenu(res.venueId)}
                              className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-medium text-[#c4ded6] hover:bg-white/10"
                            >
                              📖 View Menu
                            </button>
                          )}
                          <button
                            onClick={() => {
                              toast.success(`Buggy requested to ${res.venueName}!`, {
                                description: "Pickup from Room 101 dispatched to driver."
                              });
                              setPage("buggy");
                            }}
                            className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-medium text-[#8fd6c2] hover:bg-[#8fd6c2]/20"
                          >
                            🚗 Buggy
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Action to Book More */}
            <div className="mt-6 text-center">
              <button
                className="sr-button-quiet text-xs font-semibold"
                onClick={() => setPage("amenities")}
              >
                + Explore other dining & sports amenities
              </button>
            </div>
          </div>
          <GuestBottom active="reservations" setPage={setPage} />
        </div>
      </div>

      {/* Editing Modal */}
      {editingReservation && (
        <TableReservationModal
          item={{
            id: editingReservation.venueId,
            name: editingReservation.venueName,
            category: editingReservation.category,
            gameType: (editingReservation.category === "Sports" || editingReservation.category === "Activity") ? "Indoor Games" : editingReservation.category === "Wellness" ? "Wellness" : "Food & Drinks",
            subCategory: editingReservation.category === "Bar" ? "Bar" : editingReservation.category === "Sports" ? "Sports" : editingReservation.category === "Wellness" ? "Wellness" : "Restaurant",
            location: editingReservation.location,
            price: editingReservation.price || "À la carte"
          }}
          existingReservation={{
            id: editingReservation.id,
            venueId: editingReservation.venueId,
            venueName: editingReservation.venueName,
            guests: editingReservation.guests,
            timeSlot: editingReservation.timeSlot,
            seatingArea: editingReservation.seatingArea,
            occasion: editingReservation.occasion,
            specialRequests: editingReservation.specialRequests,
            reservedAt: editingReservation.date
          }}
          onClose={() => setEditingReservation(null)}
          onConfirm={handleUpdateReservation}
          onCancelReservation={() => {
            handleCancel(editingReservation.id, editingReservation.venueName);
            setEditingReservation(null);
          }}
        />
      )}

      {/* Menus */}
      {showCoveMenu && (
        <CoveMenuModal
          onClose={() => setShowCoveMenu(false)}
          onReserve={() => {
            setShowCoveMenu(false);
            setPage("amenities");
          }}
        />
      )}
      {showBarMenu && (
        <BarMenuModal
          onClose={() => setShowBarMenu(false)}
          onReserve={() => {
            setShowBarMenu(false);
            setPage("amenities");
          }}
        />
      )}
      {showVerandahMenu && (
        <VerandahMenuModal
          onClose={() => setShowVerandahMenu(false)}
          onReserve={() => {
            setShowVerandahMenu(false);
            setPage("amenities");
          }}
        />
      )}
      {showRasoiMenu && (
        <RasoiRoyalMenuModal
          onClose={() => setShowRasoiMenu(false)}
          onReserve={() => {
            setShowRasoiMenu(false);
            setPage("amenities");
          }}
        />
      )}
    </main>
  );
}

function AmenityGuest({name,meta,state,tone,onClick}:{name:string;meta:string;state:string;tone:any;onClick:()=>void}) { return <button onClick={onClick} className="flex w-full items-center gap-3 rounded-xl border border-white/8 bg-white/[.025] p-3 text-left"><div className="h-16 w-16 overflow-hidden rounded-lg bg-gradient-to-br from-[#806a4d] to-[#272b25]"><div className="grid h-full place-items-center text-[#d5b582]"><Sparkles size={19}/></div></div><div className="min-w-0 flex-1"><div className="text-sm font-semibold">{name}</div><div className="sr-muted mt-1 text-[10px]">{meta}</div></div><StatusChip tone={tone}>{state}</StatusChip></button>; }

function Connected({demo,setPage}:{demo:DemoState;setPage:(p:Page)=>void}) { return <main className="sr-content"><SectionHeader eyebrow="One operating layer" title="Connected Intelligence" description="See how one signal becomes coordinated action across the resort." action={<button className="sr-button" onClick={()=>setPage("decisions")}>Open Intelligence Center <ArrowRight size={14}/></button>}/><div className="sr-surface sr-graph p-5"><div className="absolute left-5 top-5 flex items-center gap-2"><StatusChip tone="teal" pulse>Live chain</StatusChip><span className="sr-dim text-[10px]">Triggered {demo.connected?"just now":"3 min ago"}</span></div><div className="sr-graph-line" style={{left:"22%",top:"49%",width:"54%",transform:"rotate(-15deg)"}}/><div className="sr-graph-line" style={{left:"22%",top:"50%",width:"54%",transform:"rotate(15deg)"}}/><div className="sr-graph-line" style={{left:"23%",top:"50%",width:"54%",transform:"rotate(0deg)"}}/><GraphNode x="15%" y="50%" icon={Wrench} label="Maintenance" active={demo.connected}/><GraphNode x="37%" y="25%" icon={TicketCheck} label="Spa unavailable" active={demo.connected}/><GraphNode x="61%" y="50%" icon={CalendarDays} label="Scheduler" active={demo.connected}/><GraphNode x="37%" y="75%" icon={Sparkles} label="Alternatives" active={demo.connected}/><GraphNode x="85%" y="50%" icon={Bot} label="Concierge" active={demo.connected}/><div className="absolute bottom-5 left-5 text-[10px] text-[#6f8983]">A single source of truth · explainable by design</div></div><div className="mt-5 grid gap-5 lg:grid-cols-[.8fr_1.2fr]"><div className="sr-surface p-5"><div className="sr-kicker">Chain summary</div><h2 className="mt-2 font-serif text-[23px]">Maintenance → guest outcome</h2><div className="mt-5 space-y-4">{([{n:"01",t:"Maintenance",d:"Spa maintenance event detected",tone:"red",icon:Wrench},{n:"02",t:"Scheduler",d:"Paused offers + recalculated queue",tone:"amber",icon:CalendarDays},{n:"03",t:"Alternatives",d:"Matched 3 context-aware options",tone:"teal",icon:Sparkles},{n:"04",t:"Concierge",d:"Guest-facing next step ready",tone:"blue",icon:Bot}] as {n:string;t:string;d:string;tone:string;icon:any}[]).map((item)=><div key={item.n} className="flex gap-3"><div className="font-mono text-[10px] text-[#66817b]">{item.n}</div><div className={`mt-0.5 rounded-md p-1.5 ${item.tone==="red"?"bg-[#d95f58]/10 text-[#ef9a8e]" : item.tone==="amber"?"bg-[#e0ac53]/10 text-[#e9bc73]":item.tone==="blue"?"bg-[#609bd8]/10 text-[#a9c9e9]":"bg-[#65b899]/10 text-[#8fd6c2]"}`}><Icon icon={item.icon} size={13}/></div><div><div className="text-xs font-semibold">{item.t}</div><div className="sr-muted mt-1 text-[10px]">{item.d}</div></div></div>)}</div></div><div className="sr-surface p-5"><div className="flex items-center justify-between"><div><div className="sr-kicker">Decision trace</div><h2 className="mt-2 font-serif text-[23px]">What the system did</h2></div><StatusChip tone="teal">Explainable</StatusChip></div><div className="mt-5 grid gap-3 md:grid-cols-3"><div className="sr-surface-soft p-4"><div className="sr-label">Guest impact</div><div className="mt-2 text-lg font-semibold text-[#8fd6c2]">Session activity only</div><div className="sr-muted mt-1 text-[10px]">Experience preserved</div></div><div className="sr-surface-soft p-4"><div className="sr-label">Time to react</div><div className="mt-2 text-lg font-semibold">Session event</div><div className="sr-muted mt-1 text-[10px]">From signal to action</div></div><div className="sr-surface-soft p-4"><div className="sr-label">Confidence</div><div className="mt-2 text-lg font-semibold text-[#8fd6c2]">Analyzer output</div><div className="sr-muted mt-1 text-[10px]">Recommendation fit</div></div></div><button className="sr-button sr-button-secondary mt-5" onClick={()=>setPage("decisions")}><Activity size={14}/> See all actions in decision stream</button></div></div></main>; }
function GraphNode({x,y,icon,label,active}:{x:string;y:string;icon:any;label:string;active?:boolean}) { return <div className={`sr-node ${active?"active":""}`} style={{left:x,top:y}}><div className="sr-node-dot"><Icon icon={icon} size={18}/></div><div className="sr-node-label">{label}</div></div>; }

function Forecast({setPage}:{setPage:(p:Page)=>void}) { return <main className="sr-content"><SectionHeader eyebrow="Revenue intelligence" title="Forecast & Pricing" description="A calm view of demand, pricing signals and staffing pressure." action={<button className="sr-button sr-button-secondary" onClick={()=>toast("Forecast export prepared")}><Download size={14}/> Export view</button>}/><div className="sr-grid sr-grid-3"><Stat label="7-day demand" value="High" delta="Weekend peak Friday" tone="amber" icon={TrendingUp}/><Stat label="Rate opportunity" value="+8.5%" delta="Recommended Fri–Sat" icon={CreditCard}/><Stat label="Staff pressure" value="Moderate" delta="Housekeeping +1 shift" tone="blue" icon={Users}/></div><div className="sr-surface mt-5 p-5"><div className="flex items-center justify-between"><div><div className="sr-kicker">Occupancy intelligence</div><h2 className="mt-2 font-serif text-[23px]">Forecast connections</h2></div><div className="flex gap-2"><StatusChip>Actual</StatusChip><StatusChip tone="blue">Forecast</StatusChip></div></div><div className="mt-8 flex items-end gap-2" style={{height:250}}>{[56,60,66,71,76,84,88,91,86,80,75,82,90,95,98,92,87,84,89,93,96].map((v,i)=><div className="relative flex h-full flex-1 items-end" key={i}><div className={`w-full rounded-t ${i>10?"bg-[#5e8ca0]/70":"bg-[#70bda5]"}`} style={{height:`${v}%`}}/><div className="absolute bottom-[-25px] left-1/2 -translate-x-1/2 text-[9px] text-[#718a85]">{i%3===0?`D${i+1}`:""}</div></div>)}</div><div className="mt-10 grid gap-3 md:grid-cols-3"><div className="sr-surface-soft p-4"><div className="sr-label">Fri · 28 Sep</div><div className="mt-2 text-xl font-semibold">93.4%</div><div className="mt-1 text-[10px] text-[#e9bc73]">Demand spike detected</div></div><div className="sr-surface-soft p-4"><div className="sr-label">Pricing recommendation</div><div className="mt-2 text-xl font-semibold">Pending backend data</div><div className="mt-1 text-[10px] text-[#8fd6c2]">Avg. daily rate · +8.5%</div></div><div className="sr-surface-soft p-4"><div className="sr-label">Sentiment</div><div className="mt-2 text-xl font-semibold">4.8 / 5</div><div className="mt-1 text-[10px] text-[#a9c9e9]">No quality trade-off forecast</div></div></div></div></main>; }

function Operations({setPage}:{setPage:(p:Page)=>void}) { return <main className="sr-content"><SectionHeader eyebrow="Resort-wide operations" title="Operations Center" description="Live status across departments, people and guest movement." action={<button className="sr-button" onClick={()=>setPage("emergency") }><ShieldAlert size={14}/> Emergency controls</button>}/><div className="sr-grid sr-grid-3"><Stat label="Teams online" value="42 / 46" delta="No staffing gaps" icon={Users}/><Stat label="Tasks in motion" value="28" delta="6 completed this hour" tone="blue" icon={Activity}/><Stat label="Buggy fleet" value="8 / 10" delta="2 charging" icon={ArrowRight}/></div><div className="mt-5 grid gap-5 md:grid-cols-2"><div className="sr-surface p-5"><div className="sr-kicker">Department status</div><h2 className="mt-2 font-serif text-[23px]">The resort is moving</h2><div className="mt-5 space-y-4">{[["Front office","On plan","teal",92],["Housekeeping","On plan","teal",86],["Engineering","1 priority","amber",72],["Guest services","On plan","teal",94]].map(([n,s,t,v])=><div key={n}><div className="flex justify-between text-xs"><span>{n}</span><span className={t==="amber"?"text-[#e9bc73]":"text-[#8fd6c2]"}>{s}</span></div><div className="mt-2"><MiniBar value={v as number} color={t==="amber"?"#d6a458":"#70bda5"}/></div></div>)}</div></div><div className="sr-surface p-5"><div className="sr-kicker">Live movement</div><h2 className="mt-2 font-serif text-[23px]">Guest transport</h2><div className="mt-5 space-y-3"><div className="sr-surface-soft flex items-center gap-3 p-3"><div className="rounded-lg bg-[#609bd8]/10 p-2 text-[#a9c9e9]"><ArrowRight size={15}/></div><div className="flex-1"><div className="text-xs font-semibold">Buggy B-04</div><div className="sr-muted mt-1 text-[10px]">Room 101 → Luxury Spa</div></div><StatusChip tone="blue">3 min ETA</StatusChip></div><div className="sr-surface-soft flex items-center gap-3 p-3"><div className="rounded-lg bg-[#8fd6c2]/10 p-2 text-[#8fd6c2]"><ArrowRight size={15}/></div><div className="flex-1"><div className="text-xs font-semibold">Buggy B-07</div><div className="sr-muted mt-1 text-[10px]">Lobby → Yoga Studio</div></div><StatusChip tone="teal">Arrived</StatusChip></div></div></div></div></main>; }
function Emergency({setPage}:{setPage:(p:Page)=>void}) { const [armed,setArmed]=useState(false); return <main className="sr-content"><SectionHeader eyebrow="Safety & response" title="Emergency Control" description="One calm interface for urgent moments. Broadcasts are staged until confirmed." action={<StatusChip tone="teal">All clear</StatusChip>}/><div className="sr-surface border-[#d95f58]/20 p-6"><div className="flex items-start gap-4"><div className="rounded-xl bg-[#d95f58]/10 p-3 text-[#ef9a8e]"><ShieldAlert size={22}/></div><div><div className="sr-kicker text-[#ef9a8e]">Manager emergency broadcast</div><h2 className="mt-2 font-serif text-2xl">Prepare a resort-wide message</h2><p className="sr-muted mt-2 max-w-xl text-xs leading-5">Use only for verified incidents. Guests and department heads will receive the message through their active channels.</p></div></div><div className="mt-7 grid gap-4 md:grid-cols-2"><div><label className="sr-label mb-2 block">Incident type</label><div className="sr-input flex items-center justify-between">Select incident <ChevronDown size={15}/></div></div><div><label className="sr-label mb-2 block">Audience</label><div className="sr-input flex items-center justify-between">All guests + staff <ChevronDown size={15}/></div></div></div><div className="mt-4"><label className="sr-label mb-2 block">Message</label><textarea className="sr-input min-h-28 py-3" defaultValue="This is a safety update from Sunridge Cove. Please remain in your current location while our team coordinates the next step."/></div><div className="mt-5 flex gap-2"><button className="sr-button sr-button-secondary" onClick={()=>toast("Broadcast preview ready")}>Preview message</button><button className="sr-button" onClick={()=>{setArmed(true);toast("Confirmation required before sending")}}><Radio size={14}/> {armed?"Confirm broadcast":"Stage broadcast"}</button></div></div><button className="sr-button-quiet mt-5" onClick={()=>setPage("command")}><ArrowLeft size={14}/> Return to command center</button></main>; }
function GenericPage({title,eyebrow,icon: I,description}:{title:string;eyebrow:string;icon:any;description:string}) { return <main className="sr-content"><SectionHeader eyebrow={eyebrow} title={title} description={description}/><div className="sr-surface grid min-h-[360px] place-items-center p-8 text-center"><div><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#8fd6c2]/10 text-[#8fd6c2]"><Icon icon={I} size={24}/></div><h2 className="mt-5 font-serif text-2xl">{title} is ready for your review</h2><p className="sr-muted mx-auto mt-2 max-w-md text-sm leading-6">This connected surface is part of the same Smart Resort 360 operating layer. Use the core demo flows to see it in context.</p><button className="sr-button sr-button-secondary mt-5" onClick={()=>toast("View refreshed") }><RefreshCw size={14}/> Refresh view</button></div></div></main>; }

function DemoDrawer({demo,setDemo,onClose,setRole,setPage}:{demo:DemoState;setDemo:React.Dispatch<React.SetStateAction<DemoState>>;onClose:()=>void;setRole:(r:Role)=>void;setPage:(p:Page)=>void}) { const run=(label:string,fn:()=>void)=>{fn();toast(label)}; return <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}><aside className="absolute right-0 top-0 h-full w-[min(410px,100%)] overflow-auto border-l border-white/10 bg-[#122020] p-6 shadow-2xl" onClick={e=>e.stopPropagation()}><div className="flex items-start justify-between"><div><div className="sr-kicker">Hackathon demo mode</div><h2 className="mt-2 font-serif text-2xl">Make the intelligence visible.</h2><p className="sr-muted mt-2 text-xs leading-5">Run the exact judge journey with deterministic transitions across roles.</p></div><button className="sr-button-quiet" onClick={onClose}><X size={17}/></button></div><div className="mt-7 rounded-xl border border-[#8fd6c2]/18 bg-[#8fd6c2]/[.06] p-4"><div className="sr-label">Current state</div><div className="mt-2 text-sm font-semibold text-[#c9ecde]">{demo.lastAction}</div><div className="sr-muted mt-2 text-[10px]">Task {demo.taskCreated?"created":"not created"} · Spa {demo.spaState} · Offer {demo.offerGuest||"none"}</div></div><div className="mt-6 space-y-2"><div className="sr-label mb-3">Hero workflows</div><DemoButton n="01" label="High-risk SPA_HEATER" detail="Open Manager → Maintenance" onClick={()=>run("Opened SPA_HEATER risk view",()=>{setRole("manager");setPage("maintenance");onClose()})} icon={Wrench}/><DemoButton n="02" label="Create preventive inspection" detail="Route TICKET-SPA-001 to Engineering Department" onClick={()=>run("Preventive task created",()=>{setDemo(d=>({...d,taskCreated:true,lastAction:"Preventive task created for SPA_HEATER"}));setRole("manager");setPage("maintenance")})} icon={Plus}/><DemoButton n="03" label="Staff receives TICKET-SPA-001" detail="Switch to Staff → Accept task" onClick={()=>run("Staff task opened",()=>{setDemo(d=>({...d,taskCreated:true}));setRole("staff");setPage("tasks");onClose()})} icon={Users}/><DemoButton n="04" label="Spa slot available" detail="Recalculate priority → offer Next queue entry" onClick={()=>run("Slot opened · Next queue entry offered",()=>{setDemo(d=>({...d,spaState:"available",offerGuest:"B",lastAction:"Spa slot opened; Next queue entry offered"}));setRole("manager");setPage("amenity")})} icon={TicketCheck}/><DemoButton n="05" label="Offer timeout" detail="Following queue entry receives the next offer" onClick={()=>run("Offer expired · Following queue entry is next",()=>{setDemo(d=>({...d,spaState:"available",offerGuest:"C",lastAction:"Next queue entry timed out; Following queue entry offered"}));setRole("manager");setPage("amenity")})} icon={Timer}/><DemoButton n="06" label="Guest asks for spa" detail="Show waitlist + alternatives" onClick={()=>run("Concierge opened",()=>{setDemo(d=>({...d,guestAsked:true,lastAction:"Concierge recommended alternatives"}));setRole("guest");setPage("concierge");onClose()})} icon={Bot}/><DemoButton n="07" label="Spa maintenance" detail="Connected chain → Concierge → guest" onClick={()=>run("Connected chain activated",()=>{setDemo(d=>({...d,spaState:"maintenance",connected:true,lastAction:"Spa maintenance triggered; alternatives sent"}));setRole("manager");setPage("connected")})} icon={GitBranch}/><DemoButton n="08" label="High occupancy tomorrow" detail="Update forecast, revenue + workforce" onClick={()=>run("High occupancy scenario active",()=>{setDemo(d=>({...d,highOccupancy:true,lastAction:"Tomorrow occupancy increased to 94%"}));setRole("manager");setPage("revenue")})} icon={TrendingUp}/><DemoButton n="09" label="Guest AC complaint" detail="Autonomous department head → Rahul" onClick={()=>run("Guest complaint routed to Engineering",()=>{setDemo(d=>({...d,guestComplaint:true,taskCreated:true,lastAction:"Guest AC complaint routed to Engineering"}));setRole("staff");setPage("tasks");onClose()})} icon={MessageCircle}/><DemoButton n="10" label="Geospatial GIS Map" detail="Radar, Buggy GPS & Zone Impact" onClick={()=>run("Geospatial Map opened",()=>{setRole("manager");setPage("ai-map");onClose()})} icon={Navigation}/><DemoButton n="11" label="Digital Twin What-If" detail="Interactive weather cascading simulator" onClick={()=>run("Digital Twin opened",()=>{setRole("manager");setPage("whatif");onClose()})} icon={GitBranch}/><DemoButton n="12" label="Real-World Social Signals" detail="Live traveler reactions & hashtags" onClick={()=>run("Social Signals Hub opened",()=>{setRole("manager");setPage("sentiment");onClose()})} icon={MessageCircle}/></div><div className="mt-7 border-t border-white/8 pt-5"><button className="sr-button sr-button-secondary w-full" onClick={()=>{setDemo(initialDemo);toast("Demo reset")}}><RefreshCw size={14}/> Reset demo</button></div></aside></div>; }
function DemoButton({n,label,detail,onClick,icon:I}:{n:string;label:string;detail:string;onClick:()=>void;icon:any}) { return <button onClick={onClick} className="flex w-full items-center gap-3 rounded-xl border border-white/8 bg-white/[.025] p-3 text-left hover:border-[#8fd6c2]/30 hover:bg-[#8fd6c2]/[.05]"><span className="font-mono text-[10px] text-[#6d8982]">{n}</span><div className="rounded-lg bg-[#8fd6c2]/10 p-2 text-[#8fd6c2]"><Icon icon={I} size={15}/></div><div className="min-w-0 flex-1"><div className="text-xs font-semibold">{label}</div><div className="sr-muted mt-1 text-[10px]">{detail}</div></div><ArrowRight size={14} className="text-[#6f8983]"/></button>; }

export default function Home() {
  const [mode,setMode]=useState<"entry"|"auth"|"app">("entry");
  const [role,setRole]=useState<Role>("manager");
  const [page,setPage]=useState<Page>("command");
  const [demo,setDemo]=useState<DemoState>(initialDemo);
  const [drawer,setDrawer]=useState(false);
  const [search,setSearch]=useState(false);
  const [weatherOpen,setWeatherOpen]=useState(false);

  const goRole=(r:Role)=>{
    setRole(r);
    setPage(r==="manager"?"command":r==="staff"?"staff-home":"guest-home");
    setMode("app");
  };

  const render=()=>{
    if(role==="manager") {
      switch(page as ManagerPage) {
        case "command":return <CommandCenter demo={demo} setDemo={setDemo} setPage={setPage} onOpenWeather={()=>setWeatherOpen(true)}/>;
        case "bookings":return <GenericPage title="Bookings" eyebrow="Reservation operations" icon={CalendarDays} description="Booking records will appear here when the backend adapter is connected."/>;
        case "decisions":return <main className="sr-content"><SectionHeader eyebrow="AI operating layer" title="Intelligence Center" description="Every recommendation is ranked, explained and ready for action."/><DecisionStream demo={demo} setPage={setPage} setDemo={setDemo}/></main>;
        case "maintenance":return <Maintenance demo={demo} setDemo={setDemo} setPage={setPage} setRole={setRole}/>;
        case "amenity":return <Amenity demo={demo} setDemo={setDemo} setPage={setPage}/>;
        case "forecast":return <Forecast setPage={setPage}/>;
        case "revenue":return <RevenueScreen setPage={setPage} demo={demo}/>;
        case "workforce":return <WorkforceScreen setPage={setPage} demo={demo}/>;
        case "sentiment":return <SentimentScreen setPage={setPage} demo={demo}/>;
        case "whatif":return <WhatIfScreen setPage={setPage} demo={demo} setDemo={setDemo}/>;
        case "property-health":return <PropertyHealthScreen setPage={setPage} demo={demo}/>;
        case "ai-map":return <AIIntelligenceScreen setPage={setPage} demo={demo}/>;
        case "connected":return <Connected demo={demo} setPage={setPage}/>;
        case "operations":return <Operations setPage={setPage}/>;
        case "emergency":return <Emergency setPage={setPage}/>;
        case "notifications":return <NotificationScreen setPage={setPage} demo={demo}/>;
        case "profile":return <ProfileScreen setPage={setPage} demo={demo}/>;
        default:return <SettingsScreen setPage={setPage} demo={demo}/>;
      }
    }
    if(role==="staff") {
      switch(page as StaffPage) {
        case "staff-home":return <StaffHome demo={demo} setDemo={setDemo} setPage={setPage}/>;
        case "tasks":return <StaffTasks demo={demo} setDemo={setDemo}/>;
        case "schedule":return <StaffScheduleScreen setPage={setPage} demo={demo}/>;
        case "dispatch":return <DispatchScreen setPage={setPage} demo={demo}/>;
        case "emergency":return <Emergency setPage={setPage}/>;
        case "notifications":return <StaffNotificationScreen setPage={setPage} demo={demo}/>;
        default:return <StaffNotificationScreen setPage={setPage} demo={demo}/>;
      }
    }
    switch(page as GuestPage) {
      case "guest-home":return <GuestHome setPage={setPage}/>;
      case "concierge":return <Concierge demo={demo} setDemo={setDemo} setPage={setPage}/>;
      case "amenities":return <GuestAmenities setPage={setPage}/>;
      case "amenity-detail":return <GuestAmenityDetail setPage={setPage} demo={demo}/>;
      case "reservations":return <GuestMyReservations setPage={setPage}/>;
      case "waitlist":return <GuestReservations setPage={setPage} demo={demo} setDemo={setDemo}/>;
      case "offer":return <GuestOffer setPage={setPage} demo={demo} setDemo={setDemo}/>;
      case "buggy":return <GuestBuggy setPage={setPage} demo={demo}/>;
      case "folio":return <GuestFolio setPage={setPage} demo={demo}/>;
      case "checkout":return <GuestCheckout setPage={setPage} demo={demo}/>;
      case "sos":return <GuestSOS setPage={setPage} demo={demo}/>;
      default:return <GuestProfile setPage={setPage} demo={demo}/>;
    }
  };

  if(mode==="entry")return <Entry onEnter={()=>setMode("auth")}/>;
  if(mode==="auth")return <Auth onLogin={goRole}/>;
  return (
    <>
      <AppShell
        role={role}
        setRole={setRole}
        page={page}
        setPage={setPage}
        onLogout={()=>{setMode("entry");setRole("manager");setPage("command")}}
        onDemo={()=>setDrawer(true)}
        onSearch={()=>setSearch(true)}
        onOpenWeather={()=>setWeatherOpen(true)}
      >
        {render()}
      </AppShell>
      {drawer && <DemoDrawer demo={demo} setDemo={setDemo} onClose={()=>setDrawer(false)} setRole={setRole} setPage={setPage}/>}
      {search && <SearchOverlay onClose={()=>setSearch(false)} setPage={setPage}/>}
      {weatherOpen && <WeatherModal onClose={()=>setWeatherOpen(false)} setPage={setPage} />}
    </>
  );
}
