"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  api, DashboardState, ScoredSignal, TrendForecast,
  AlertItem as AlertType, DomainSummary,
  DOMAIN_COLORS, DOMAIN_ICONS, getDomainClass,
} from "@/lib/api";
import AgenticMissionView from "@/components/AgenticMissionView";
import IdeaMelaView from "@/components/IdeaMelaView";
import NameItView from "@/components/NameItView";
import StartBuddyView from "@/components/StartBuddyView";
import SignalDetail from "@/components/SignalDetail";
import TechRadar from "@/components/TechRadar";
import dynamic from "next/dynamic";

const NeuralNetwork = dynamic(() => import("@/components/NeuralNetwork"), { ssr: false, loading: () => <div className="landing-fallback" /> });

/* ───────────────────── helpers ───────────────────── */
type Tab = "dashboard" | "signals" | "trends" | "tools" | "alerts" | "radar";
type ToolTab = "ideamela" | "nameit" | "startbuddy" | "mission";

// Plain-English labels
const MATURITY_LABEL: Record<string,string> = {
  adopt:"✅ Ready to Use", trial:"🔬 Worth Testing",
  assess:"👀 Watch Closely", hold:"⏸ On Hold",
  early:"🌱 Early Stage", emerging:"📈 Emerging",
  scaling:"🚀 Scaling", saturated:"📊 Mature",
};
const MATURITY_BADGE: Record<string,string> = {
  adopt:"adopt", trial:"trial", assess:"assess", hold:"hold",
  early:"early", emerging:"emerging", scaling:"scaling", saturated:"saturated",
};
const STRENGTH_LABEL: Record<string,{label:string;cls:string;dot:string}> = {
  signal:      { label:"🟢 Strong Signal",   cls:"strong",   dot:"strong"   },
  weak_signal: { label:"🟡 Moderate Signal", cls:"moderate", dot:"moderate" },
  noise:       { label:"🔴 Low Signal",      cls:"weak",     dot:"weak"     },
};
const DOMAIN_BADGE_CLASS: Record<string,string> = {
  "Artificial Intelligence":"ai",
  "Cybersecurity":"cyber","AR/VR":"arvr","Robotics":"robot","IoT":"iot",
};
const DOMAIN_SHORT: Record<string,string> = {
  "Artificial Intelligence":"AI","Cybersecurity":"Cyber",
  "AR/VR":"AR/VR","Robotics":"Robotics","IoT":"IoT",
};
const DOMAIN_CSS_KEY: Record<string,string> = {
  "Artificial Intelligence":"ai","Cybersecurity":"cyber",
  "AR/VR":"arvr","Robotics":"robot","IoT":"iot",
};
const SEV_CFG: Record<string,{icon:string;cls:string}> = {
  critical:{icon:"🚨",cls:"high"}, high:{icon:"⚡",cls:"high"},
  warning:{icon:"⚠️",cls:"warning"}, info:{icon:"ℹ️",cls:"info"},
};

function pct(v:number,decimals=0){ return `${(v*100).toFixed(decimals)}%`; }
function scoreColor(v:number){
  if(v>=0.75) return "var(--emerald)";
  if(v>=0.45) return "var(--amber)";
  return "var(--rose)";
}

/* ───────────────────── theme hook ─────────────────── */
function useTheme(){
  const [theme,setTheme]=useState<"light"|"dark">("dark");
  useEffect(()=>{
    const s=(typeof window!=="undefined"&&localStorage.getItem("ft-theme")) as "light"|"dark"|null;
    const sys=typeof window!=="undefined"&&window.matchMedia("(prefers-color-scheme:light)").matches?"light":"dark";
    const t=s||sys; setTheme(t);
    document.documentElement.setAttribute("data-theme",t);
  },[]);
  const toggle=()=>setTheme(p=>{
    const n=p==="dark"?"light":"dark";
    localStorage.setItem("ft-theme",n);
    document.documentElement.setAttribute("data-theme",n);
    return n;
  });
  return {theme,toggle};
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════
   PREMIUM ANIMATED LANDING PAGE
   ═══════════════════════════════════════════════════ */
type AuthMode = "signin" | "signup" | "forgot" | "reset";

function LandingAuthView({onAuthSuccess}:{onAuthSuccess:()=>void}) {
  const [authMode,setAuthMode] = useState<AuthMode>("signin");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [confirmPwd,setConfirmPwd] = useState("");
  const [resetCode,setResetCode] = useState("");
  const [newPwd,setNewPwd] = useState("");
  const [confirmNewPwd,setConfirmNewPwd] = useState("");
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");
  const [success,setSuccess] = useState("");
  const [canvasReady,setCanvasReady] = useState(false);
  const [titleVisible,setTitleVisible] = useState(false);
  const [cardVisible,setCardVisible] = useState(false);
  const [showPwd,setShowPwd] = useState(false);
  const [particles,setParticles] = useState<{x:number;y:number;size:number;opacity:number;speed:number;delay:number}[]>([]);
  const [orbs,setOrbs] = useState<{x:number;y:number;size:number;color:string;dur:number}[]>([]);
  const [stars,setStars] = useState<{x:number;y:number;s:number;d:number}[]>([]);

  useEffect(()=>{
    setCanvasReady(true);
    const t1=setTimeout(()=>setTitleVisible(true),400);
    const t2=setTimeout(()=>setCardVisible(true),1100);
    setParticles(Array.from({length:40},()=>({
      x:Math.random()*100, y:Math.random()*100,
      size:1+Math.random()*3, opacity:0.08+Math.random()*0.35,
      speed:12+Math.random()*22, delay:Math.random()*15,
    })));
    setOrbs([
      {x:15,y:20,size:55,color:"rgba(99,102,241,0.12)",dur:18},
      {x:80,y:70,size:45,color:"rgba(139,92,246,0.10)",dur:22},
      {x:60,y:10,size:35,color:"rgba(6,182,212,0.08)",dur:16},
      {x:10,y:75,size:40,color:"rgba(16,185,129,0.07)",dur:25},
      {x:90,y:30,size:30,color:"rgba(236,72,153,0.06)",dur:20},
    ]);
    setStars(Array.from({length:80},()=>({
      x:Math.random()*100, y:Math.random()*100,
      s:0.5+Math.random()*1.5, d:1+Math.random()*4,
    })));
    return()=>{ clearTimeout(t1); clearTimeout(t2); };
  },[]);

  const pwdStrength = (p:string)=>{
    if(!p) return 0;
    let s=0;
    if(p.length>=6) s++;
    if(p.length>=10) s++;
    if(/[A-Z]/.test(p)) s++;
    if(/[0-9!@#$%^&*]/.test(p)) s++;
    return s;
  };
  const strength=pwdStrength(authMode==="reset"?newPwd:password);
  const strengthColors=["","#EF4444","#F59E0B","#FDE047","#10B981"];
  const strengthLabels=["","Weak","Fair","Good","Strong"];
  function clearForm(){ setError(""); setSuccess(""); setPassword(""); setConfirmPwd(""); setResetCode(""); setNewPwd(""); setConfirmNewPwd(""); }
  function goMode(m:AuthMode){ clearForm(); setAuthMode(m); }

  const handleForgotRequest=async(e:React.FormEvent)=>{
    e.preventDefault(); setError(""); setSuccess(""); setLoading(true);
    try{
      const res=await fetch("http://localhost:8010/api/auth/forgot-password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email})});
      const d=await res.json();
      if(!res.ok) throw new Error(d.detail||"Failed to send reset code");
      setSuccess("Reset code sent! Check your terminal logs.");
      setAuthMode("reset");
    }catch(err:any){ setError(err.message); }
    finally{ setLoading(false); }
  };

  const handleResetPassword=async(e:React.FormEvent)=>{
    e.preventDefault(); setError("");
    if(newPwd!==confirmNewPwd){ setError("Passwords do not match."); return; }
    if(newPwd.length<6){ setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try{
      const res=await fetch("http://localhost:8010/api/auth/reset-password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,code:resetCode,new_password:newPwd})});
      const d=await res.json();
      if(!res.ok) throw new Error(d.detail||"Reset failed");
      localStorage.setItem("ft-auth-token",d.access_token);
      if(d.user?.email) localStorage.setItem("ft-profile",JSON.stringify({name:d.user.email.split("@")[0],email:d.user.email,phone:"",linkedin:"",pfp:""}));
      onAuthSuccess();
    }catch(err:any){ setError(err.message); }
    finally{ setLoading(false); }
  };

  const handleSignIn=async(e:React.FormEvent)=>{
    e.preventDefault(); setError(""); setLoading(true);
    try{
      const res=await fetch("http://localhost:8010/api/auth/signin",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});
      const d=await res.json();
      if(!res.ok) throw new Error(d.detail||"Authentication failed");
      localStorage.setItem("ft-auth-token",d.access_token);
      if(d.user?.email) localStorage.setItem("ft-profile",JSON.stringify({name:d.user.email.split("@")[0],email:d.user.email,phone:"",linkedin:"",pfp:""}));
      onAuthSuccess();
    }catch(err:any){ setError(err.message); }
    finally{ setLoading(false); }
  };

  const handleSignUp=async(e:React.FormEvent)=>{
    e.preventDefault(); setError("");
    if(password!==confirmPwd){ setError("Passwords do not match."); return; }
    if(password.length<6){ setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try{
      const res=await fetch("http://localhost:8010/api/auth/signup",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password,name:email.split("@")[0]})});
      const d=await res.json();
      if(!res.ok) throw new Error(d.detail||"Sign up failed");
      localStorage.setItem("ft-auth-token",d.access_token);
      if(d.user?.email) localStorage.setItem("ft-profile",JSON.stringify({name:d.user.email.split("@")[0],email:d.user.email,phone:"",linkedin:"",pfp:""}));
      onAuthSuccess();
    }catch(err:any){ setError(err.message); }
    finally{ setLoading(false); }
  };

  const tabMode=authMode==="forgot"||authMode==="reset"?"signin":authMode;

  return (
    <div className="ft-landing">
      {stars.map((s,i)=>(<div key={`s${i}`} className="ft-star" style={{left:`${s.x}%`,top:`${s.y}%`,width:s.s,height:s.s,animationDuration:`${s.d}s`,animationDelay:`${i*0.05}s`}}/>))}
      {orbs.map((o,i)=>(<div key={`o${i}`} className="ft-orb" style={{left:`${o.x}%`,top:`${o.y}%`,width:`${o.size}vw`,height:`${o.size}vw`,background:`radial-gradient(circle,${o.color} 0%,transparent 70%)`,animationDuration:`${o.dur}s`,animationDelay:`${i*2}s`}}/>))}
      {particles.map((p,i)=>(<div key={`p${i}`} className="ft-particle" style={{left:`${p.x}%`,top:`${p.y}%`,width:p.size,height:p.size,opacity:p.opacity,animationDuration:`${p.speed}s`,animationDelay:`${p.delay}s`}}/>))}
      {canvasReady && <NeuralNetwork />}
      <div className="ft-overlay-top"/>
      <div className="ft-overlay-bottom"/>
      <div className="ft-overlay-vignette"/>
      <div className="ft-scanlines"/>

      <div className="ft-content">
        <div className={`ft-logo-badge ${titleVisible?"ft-fade-in":""}`}>
          <span className="ft-logo-dot"/><span className="ft-logo-text">FUTURETRACE INTELLIGENCE PLATFORM</span><span className="ft-logo-dot"/>
        </div>
        <div className={`ft-hero-title ${titleVisible?"ft-slide-up":""}`}>
          <span className="ft-title-glow">Future</span><span className="ft-title-accent">Tr@ce</span>
        </div>
        <div className={`ft-hero-sub ${titleVisible?"ft-fade-in":""}`} style={{animationDelay:"0.3s"}}>
          Next-Generation A.I. Domain Intelligence Platform
        </div>
        <div className={`ft-pills ${titleVisible?"ft-fade-in":""}`} style={{animationDelay:"0.55s"}}>
          {["🧬 Signal Detection","📡 Live Trends","🤖 Agentic AI","🔭 Tech Radar","⚡ Live Intel"].map((t,i)=>(
            <span key={i} className="ft-pill">{t}</span>
          ))}
        </div>
        <div className={`ft-auth-card ${cardVisible?"ft-card-reveal":""}`}>
          {authMode!=="forgot"&&authMode!=="reset"&&(
            <div className="ft-card-tabs">
              <button id="ft-tab-signin" className={`ft-card-tab ${tabMode==="signin"?"ft-tab-active":""}`} onClick={()=>goMode("signin")}>Sign In</button>
              <button id="ft-tab-signup" className={`ft-card-tab ${tabMode==="signup"?"ft-tab-active":""}`} onClick={()=>goMode("signup")}>Create Account</button>
              <div className="ft-tab-indicator" style={{transform:`translateX(${tabMode==="signin"?"0":"100%"})`}}/>
            </div>
          )}
          {(authMode==="forgot"||authMode==="reset")&&(
            <div className="ft-card-header-alt">
              <button className="ft-back-btn" onClick={()=>goMode("signin")}>← Back to Sign In</button>
              <span>{authMode==="forgot"?"Recover Access":"Set New Password"}</span>
            </div>
          )}
          {error&&<div className="ft-auth-error" id="ft-error-msg"><span>⚠</span><span>{error}</span></div>}
          {success&&<div className="ft-auth-success" id="ft-success-msg"><span>✓</span><span>{success}</span></div>}

          {authMode==="signin"&&(
            <form onSubmit={handleSignIn} className="ft-form" id="ft-signin-form">
              <div className="ft-field"><label className="ft-label">Email Address</label>
                <div className="ft-input-wrap"><span className="ft-input-icon">✉</span>
                  <input id="ft-email-input" type="email" required className="ft-input" placeholder="operative@domain.com" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/>
                </div>
              </div>
              <div className="ft-field">
                <div className="ft-label-row"><label className="ft-label">Password</label>
                  <button type="button" className="ft-forgot-link" id="ft-forgot-btn" onClick={()=>goMode("forgot")}>Forgot password?</button>
                </div>
                <div className="ft-input-wrap"><span className="ft-input-icon">🔒</span>
                  <input id="ft-password-input" type={showPwd?"text":"password"} required className="ft-input" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password"/>
                  <button type="button" className="ft-eye-btn" onClick={()=>setShowPwd(p=>!p)} tabIndex={-1}>{showPwd?"🙈":"👁"}</button>
                </div>
              </div>
              <button type="submit" id="ft-signin-btn" className="ft-cta-btn" disabled={loading}>
                {loading?<><span className="ft-spinner"/><span>Authenticating...</span></>:<><span>Initialize Uplink</span><span className="ft-btn-arrow">→</span></>}
              </button>
              <div className="ft-auth-divider"><span>or</span></div>
              <div className="ft-auth-switch">New to FutureTr@ce?{" "}<button type="button" id="ft-goto-signup" className="ft-link-btn" onClick={()=>goMode("signup")}>Create account →</button></div>
            </form>
          )}

          {authMode==="signup"&&(
            <form onSubmit={handleSignUp} className="ft-form" id="ft-signup-form">
              <div className="ft-field"><label className="ft-label">Email Address</label>
                <div className="ft-input-wrap"><span className="ft-input-icon">✉</span>
                  <input id="ft-signup-email" type="email" required className="ft-input" placeholder="operative@domain.com" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/>
                </div>
              </div>
              <div className="ft-field"><label className="ft-label">Password</label>
                <div className="ft-input-wrap"><span className="ft-input-icon">🔒</span>
                  <input id="ft-signup-password" type={showPwd?"text":"password"} required className="ft-input" placeholder="Minimum 6 characters" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password"/>
                  <button type="button" className="ft-eye-btn" onClick={()=>setShowPwd(p=>!p)} tabIndex={-1}>{showPwd?"🙈":"👁"}</button>
                </div>
                {password&&(<div className="ft-pwd-strength">{[1,2,3,4].map(n=>(<div key={n} className="ft-pwd-bar" style={{background:strength>=n?strengthColors[strength]:"rgba(255,255,255,0.1)"}}/>))}<span className="ft-pwd-label" style={{color:strengthColors[strength]||"rgba(255,255,255,0.3)"}}>{strengthLabels[strength]}</span></div>)}
              </div>
              <div className="ft-field"><label className="ft-label">Confirm Password</label>
                <div className="ft-input-wrap"><span className="ft-input-icon">🛡</span>
                  <input id="ft-signup-confirm" type={showPwd?"text":"password"} required className="ft-input" placeholder="Re-enter password" value={confirmPwd} onChange={e=>setConfirmPwd(e.target.value)} autoComplete="new-password"/>
                </div>
              </div>
              <button type="submit" id="ft-signup-btn" className="ft-cta-btn" disabled={loading}>
                {loading?<><span className="ft-spinner"/><span>Creating Account...</span></>:<><span>Launch Access</span><span className="ft-btn-arrow">⚡</span></>}
              </button>
              <div className="ft-auth-divider"><span>or</span></div>
              <div className="ft-auth-switch">Already have access?{" "}<button type="button" id="ft-goto-signin" className="ft-link-btn" onClick={()=>goMode("signin")}>Sign in →</button></div>
            </form>
          )}

          {authMode==="forgot"&&(
            <form onSubmit={handleForgotRequest} className="ft-form" id="ft-forgot-form">
              <div className="ft-forgot-hint">Enter your email and we'll send a 6-digit reset code to the terminal logs.</div>
              <div className="ft-field"><label className="ft-label">Email Address</label>
                <div className="ft-input-wrap"><span className="ft-input-icon">✉</span>
                  <input id="ft-forgot-email" type="email" required className="ft-input" placeholder="operative@domain.com" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/>
                </div>
              </div>
              <button type="submit" id="ft-forgot-send-btn" className="ft-cta-btn" disabled={loading}>
                {loading?<><span className="ft-spinner"/><span>Sending Code...</span></>:<><span>Send Reset Code</span><span className="ft-btn-arrow">→</span></>}
              </button>
              <div className="ft-auth-switch" style={{marginTop:16}}>Remembered it?{" "}<button type="button" className="ft-link-btn" onClick={()=>goMode("signin")}>Sign in →</button></div>
            </form>
          )}

          {authMode==="reset"&&(
            <form onSubmit={handleResetPassword} className="ft-form" id="ft-reset-form">
              <div className="ft-forgot-hint">Enter the 6-digit code from the terminal, then set your new password.</div>
              <div className="ft-field"><label className="ft-label">Reset Code</label>
                <div className="ft-input-wrap"><span className="ft-input-icon">🔑</span>
                  <input id="ft-reset-code" type="text" required className="ft-input" maxLength={6} placeholder="000000" style={{letterSpacing:"4px",textAlign:"center",fontSize:18}} value={resetCode} onChange={e=>setResetCode(e.target.value.replace(/\D/g,""))}/>
                </div>
              </div>
              <div className="ft-field"><label className="ft-label">New Password</label>
                <div className="ft-input-wrap"><span className="ft-input-icon">🔒</span>
                  <input id="ft-new-pwd" type={showPwd?"text":"password"} required className="ft-input" placeholder="Minimum 6 characters" value={newPwd} onChange={e=>setNewPwd(e.target.value)} autoComplete="new-password"/>
                  <button type="button" className="ft-eye-btn" onClick={()=>setShowPwd(p=>!p)} tabIndex={-1}>{showPwd?"🙈":"👁"}</button>
                </div>
                {newPwd&&(<div className="ft-pwd-strength">{[1,2,3,4].map(n=>(<div key={n} className="ft-pwd-bar" style={{background:strength>=n?strengthColors[strength]:"rgba(255,255,255,0.1)"}}/>))}<span className="ft-pwd-label" style={{color:strengthColors[strength]||"rgba(255,255,255,0.3)"}}>{strengthLabels[strength]}</span></div>)}
              </div>
              <div className="ft-field"><label className="ft-label">Confirm New Password</label>
                <div className="ft-input-wrap"><span className="ft-input-icon">🛡</span>
                  <input id="ft-confirm-new-pwd" type={showPwd?"text":"password"} required className="ft-input" placeholder="Re-enter new password" value={confirmNewPwd} onChange={e=>setConfirmNewPwd(e.target.value)} autoComplete="new-password"/>
                </div>
              </div>
              <button type="submit" id="ft-reset-btn" className="ft-cta-btn" disabled={loading}>
                {loading?<><span className="ft-spinner"/><span>Resetting...</span></>:<><span>Reset & Sign In</span><span className="ft-btn-arrow">⚡</span></>}
              </button>
            </form>
          )}
        </div>

        <div className={`ft-footer ${cardVisible?"ft-fade-in":""}`} style={{animationDelay:"0.3s"}}>
          <span className="ft-footer-dot"/><span>Real-time Intelligence Engine · v2.0</span><span className="ft-footer-dot"/>
        </div>
      </div>
    </div>
  );
}

/* Profile data stored in localStorage */
type ProfileData = { name:string; email:string; phone:string; linkedin:string; pfp:string; };
type SettingsData = { autoRefresh:boolean; notifications:boolean; signalAlerts:boolean; };

function loadProfile():ProfileData{
  if(typeof window==="undefined") return {name:"Sanskriti User",email:"",phone:"",linkedin:"",pfp:""};
  try{ return JSON.parse(localStorage.getItem("ft-profile")||"null")||{name:"Sanskriti User",email:"",phone:"",linkedin:"",pfp:""}; }
  catch{ return {name:"Sanskriti User",email:"",phone:"",linkedin:"",pfp:""}; }
}
function loadSettings():SettingsData{
  if(typeof window==="undefined") return {autoRefresh:true,notifications:true,signalAlerts:true};
  try{ return JSON.parse(localStorage.getItem("ft-settings")||"null")||{autoRefresh:true,notifications:true,signalAlerts:true}; }
  catch{ return {autoRefresh:true,notifications:true,signalAlerts:true}; }
}

export default function Page(){
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const {theme,toggle}=useTheme();
  const [tab,setTab]=useState<Tab>("dashboard");
  const [toolTab,setToolTab]=useState<ToolTab>("ideamela");

  useEffect(()=>{
    if(typeof window!=="undefined" && localStorage.getItem("ft-auth-token")){
      setIsAuthenticated(true);
    }
  },[]);

  const [data,setData]=useState<DashboardState|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const [scanning,setScanning]=useState(false);
  const [selected,setSelected]=useState<ScoredSignal|null>(null);
  const [domainFilter,setDomainFilter]=useState<string|null>(null);
  const [missionGoal,setMissionGoal]=useState("");

  /* Profile & Settings state */
  const [profile,setProfile]=useState<ProfileData>(loadProfile);
  const [settings,setSettings]=useState<SettingsData>(loadSettings);
  const [showProfile,setShowProfile]=useState(false);
  const [showSettings,setShowSettings]=useState(false);
  const [showDrop,setShowDrop]=useState(false);

  const saveProfile=(p:ProfileData)=>{ setProfile(p); localStorage.setItem("ft-profile",JSON.stringify(p)); };
  const saveSettings=(s:SettingsData)=>{ setSettings(s); localStorage.setItem("ft-settings",JSON.stringify(s)); };

  const refresh=useCallback(async()=>{
    try{ const d=await api.getDashboard(); setData(d); setError(null); }
    catch{ setError("Cannot reach backend — make sure FastAPI is running on port 8010."); }
    finally{ setLoading(false); }
  },[]);

  useEffect(()=>{
    if(!isAuthenticated) return;
    refresh();
    const iv=settings.autoRefresh?setInterval(refresh,30000):null;
    return()=>{ if(iv) clearInterval(iv); };
  },[isAuthenticated,refresh,settings.autoRefresh]);

  const scan=async()=>{
    setScanning(true);
    try{ await api.runPipeline(); await refresh(); }
    catch(e){ console.error(e); }
    finally{ setScanning(false); }
  };

  const explore=(tech:string)=>{ setMissionGoal(tech); setToolTab("mission"); setTab("tools"); };

  // Auth guard — all hooks are above, so this is safe per React rules
  if(!isAuthenticated) {
    return <LandingAuthView onAuthSuccess={() => setIsAuthenticated(true)} />;
  }

  const signals=data?.top_signals||[];
  const strong=signals.filter(s=>s.classification==="signal").length;
  const moderate=signals.filter(s=>s.classification==="weak_signal").length;

  const TABS:[Tab,string,string,number|undefined][]=[
    ["dashboard","🏠","Dashboard",undefined],
    ["signals",  "📡","Signals",(strong+moderate)||undefined],
    ["trends",   "📈","Trends",undefined],
    ["radar",    "🎯","Radar",undefined],
    ["tools",    "🛠️","Tools",undefined],
    ["alerts",   "🔔","Alerts",data?.recent_alerts?.length||undefined],
  ];

  const initials=profile.name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2)||"F";

  return(
    <>
      {/* ── TOP NAV ── */}
      <nav className="top-nav">
        <div className="nav-brand">
          <div className="nav-brand-icon">F</div>
          <div>
            <div className="nav-brand-name">FutureTr@ce</div>
            <div className="nav-brand-tag">Intelligence Platform</div>
          </div>
        </div>
        <div className="nav-divider"/>
        <div className="nav-tabs">
          {TABS.map(([id,icon,label,badge])=>(
            <button key={id} className={`nav-tab${tab===id?" active":""}`} onClick={()=>setTab(id)}>
              {icon} {label}
              {badge!==undefined&&<span className="nav-badge">{badge}</span>}
            </button>
          ))}
        </div>
        <div className="nav-right">
          {!error&&!loading&&<span className="live-dot">Live</span>}
          <button className="refresh-btn" onClick={refresh}>↻ Refresh</button>
          <button className="scan-btn" onClick={scan} disabled={scanning}>
            {scanning
              ?<><span className="loading-dot"/><span className="loading-dot"/><span className="loading-dot"/></>
              :<>⚡ Scan Now</>}
          </button>
          {/* User Avatar + Dropdown */}
          <div className="user-menu-wrap">
            <button className="avatar-btn" onClick={()=>setShowDrop(p=>!p)} title="Your account">
              {profile.pfp
                ? <img src={profile.pfp} alt="pfp"/>
                : initials}
            </button>
            {showDrop&&(
              <>
                <div style={{position:"fixed",inset:0,zIndex:90}} onClick={(e)=>{e.stopPropagation(); setShowDrop(false);}}/>
                <div className="user-dropdown" style={{zIndex:100}}>
                  <div className="udrop-header">
                    <div className="udrop-name">{profile.name||"Sanskriti User"}</div>
                    <div className="udrop-email">{profile.email||"No email set"}</div>
                  </div>
                  <button className="udrop-item" onClick={(e)=>{
                    e.stopPropagation(); 
                    setShowDrop(false); setShowProfile(true);
                  }}>
                    <span className="udrop-icon">👤</span> My Profile
                  </button>
                  <button className="udrop-item" onClick={(e)=>{
                    e.stopPropagation(); 
                    setShowDrop(false); setShowSettings(true);
                  }}>
                    <span className="udrop-icon">⚙️</span> Settings
                  </button>
                  <div className="udrop-sep"/>
                  <button className="udrop-item danger" onClick={(e)=>{
                    e.stopPropagation();
                    setShowDrop(false);
                    if(confirm("Sign out of FutureTr@ce? Your local data will be kept.")){
                      localStorage.removeItem("ft-auth-token");
                      window.location.reload();
                    }
                  }}>
                    <span className="udrop-icon">🚪</span> Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── CONTENT ── */}
      <div className="page-wrap">
        <div className="view-pad">

          {/* Error */}
          {error&&(
            <div style={{background:"var(--rose-light)",border:"1px solid var(--rose)",borderRadius:"var(--radius)",
              padding:"14px 18px",marginBottom:24,display:"flex",gap:12,alignItems:"center"}}>
              <span style={{fontSize:20}}>⚠️</span>
              <div>
                <div style={{fontWeight:700,color:"var(--rose)"}}>Backend Not Connected</div>
                <div style={{fontSize:12.5,color:"var(--text-muted)",marginTop:2}}>{error}</div>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading&&!data&&(
            <div className="empty">
              <div className="empty-icon">⚡</div>
              <div className="empty-title">Connecting to Intelligence Engine…</div>
              <div className="loading-dots">
                <div className="loading-dot"/><div className="loading-dot"/><div className="loading-dot"/>
              </div>
            </div>
          )}

          {/* Views */}
          {!loading&&tab==="dashboard"&&(
            <DashboardView data={data} strong={strong} moderate={moderate}
              onViewDomain={(d)=>{setDomainFilter(d);setTab("signals");}}
              onExplore={explore} />
          )}
          {!loading&&tab==="signals"&&(
            <SignalsView signals={signals} domainFilter={domainFilter}
              setDomainFilter={setDomainFilter} onSelect={setSelected} onExplore={explore} />
          )}
          {!loading&&tab==="trends"&&<TrendsView forecasts={data?.trend_forecasts||[]} />}
          {!loading&&tab==="radar"&&(
            <RadarView items={data?.radar_items||[]} onExplore={explore} />
          )}
          {!loading&&tab==="tools"&&(
            <ToolsView sub={toolTab} setSub={setToolTab} initialGoal={missionGoal} />
          )}
          {!loading&&tab==="alerts"&&(
            <AlertsView alerts={data?.recent_alerts||[]} onExplore={explore} />
          )}

        </div>
      </div>

      {/* Signal detail modal */}
      {selected&&<SignalDetail signal={selected} onClose={()=>setSelected(null)} onExplore={explore}/>}

      {/* Profile Drawer */}
      {showProfile&&(
        <ProfileDrawer profile={profile} onSave={saveProfile} onClose={()=>setShowProfile(false)}/>
      )}

      {/* Settings Drawer */}
      {showSettings&&(
        <SettingsDrawer theme={theme} toggleTheme={toggle}
          settings={settings} onSave={saveSettings}
          onClose={()=>setShowSettings(false)}
          onSignOut={()=>{
            if(confirm("Sign out of FutureTr@ce? Your local data will be kept.")){
              localStorage.removeItem("ft-auth-token");
              window.location.reload();
            }
          }}
        />
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════
   DASHBOARD VIEW
   ═══════════════════════════════════════════════════ */
function DashboardView({data,strong,moderate,onViewDomain,onExplore}:{
  data:DashboardState|null; strong:number; moderate:number;
  onViewDomain:(d:string)=>void; onExplore:(t:string)=>void;
}){
  const domains=data?.domain_summaries||[];
  const domainData=domains.length?domains:[
    "Artificial Intelligence","Cybersecurity","AR/VR","Robotics","IoT"
  ].map(d=>({domain:d,color:DOMAIN_COLORS[d]||"#6366F1",total_signals:0,
    avg_opportunity_score:0.6,avg_risk_level:0.3,trend_direction:"stable",
    top_technologies:[],heatmap_data:[]}) as DomainSummary);

  return(
    <div className="fade-in">
      {/* KPIs */}
      <div className="kpi-grid">
        <KpiCard accent="blue" icon="🧬" label="Technologies Tracked"
          value={data?.total_technologies||0} sub="In the knowledge graph" />
        <KpiCard accent="emerald" icon="📡" label="Active Signals"
          value={strong+moderate} sub={`${strong} strong · ${moderate} moderate`} />
        <KpiCard accent="amber" icon="🌐" label="Domains Covered"
          value={domainData.length} sub="AI · Cyber · XR · Robotics · IoT" />
        <KpiCard accent="rose" icon="🔔" label="Alerts Today"
          value={data?.recent_alerts?.length||0} sub="Real-time monitoring active" />
      </div>

      {/* Domain Health */}
      <div className="section-head">
        <div>
          <div className="section-title">🌐 Domain Health Overview</div>
          <div className="section-sub">Click any domain to explore its signals</div>
        </div>
      </div>
      <div className="domain-grid" style={{marginBottom:28}}>
        {domainData.map((d,i)=>(
          <DomainCard key={i} domain={d} onClick={()=>onViewDomain(d.domain)} />
        ))}
      </div>

      {/* Bottom split */}
      <div className="overview-split">
        {/* Recent Signals */}
        <div>
          <div className="section-head">
            <div className="section-title">📡 Latest Signals</div>
          </div>
          <div className="signals-list">
            {(data?.top_signals||[]).slice(0,7).map((s,i)=>(
              <SignalRow key={s.id||i} sig={s} onExplore={()=>onExplore(s.technology)} />
            ))}
            {!data?.top_signals?.length&&<EmptyBox icon="📡" title="No signals yet" sub='Click "Scan Now" to fetch live signals.' />}
          </div>
        </div>
        {/* Alerts */}
        <div>
          <div className="section-head">
            <div className="section-title">🔔 Recent Alerts</div>
          </div>
          <div className="alert-list">
            {(data?.recent_alerts||[]).slice(0,5).map((a,i)=>(
              <AlertRow key={a.id||i} alert={a} onExplore={()=>onExplore(a.technology)} />
            ))}
            {!data?.recent_alerts?.length&&<EmptyBox icon="✅" title="All clear" sub="No alerts at the moment." />}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({accent,icon,label,value,sub}:{accent:string;icon:string;label:string;value:number;sub:string}){
  return(
    <div className={`kpi-card ${accent}`}>
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}

function DomainCard({domain,onClick}:{domain:DomainSummary;onClick:()=>void}){
  const key=DOMAIN_CSS_KEY[domain.domain]||"ai";
  const icon=DOMAIN_ICONS[domain.domain]||"📊";
  const opp=domain.avg_opportunity_score;
  const rising=domain.trend_direction==="rising";
  return(
    <div className={`domain-card ${key}`} onClick={onClick}>
      <span className="domain-icon">{icon}</span>
      <div className="domain-name">{domain.domain}</div>
      <div className="domain-meta">{domain.total_signals} signals · {rising?"📈 Rising":"📊 Stable"}</div>
      <div className="progress-bar">
        <div className="progress-fill" style={{width:pct(opp),background:domain.color}}/>
      </div>
      <div className="domain-stats">
        <span>Opportunity</span>
        <strong style={{color:domain.color}}>{pct(opp)}</strong>
      </div>
      <button className="view-link">View Signals →</button>
    </div>
  );
}

function SignalRow({sig,onExplore}:{sig:ScoredSignal;onExplore:()=>void}){
  const st=STRENGTH_LABEL[sig.classification]||STRENGTH_LABEL.signal;
  const bc=DOMAIN_BADGE_CLASS[sig.domain]||"ai";
  const score=sig.score.composite;
  return(
    <div className={`signal-card ${st.cls}`}>
      <div className={`sig-dot ${st.dot}`}/>
      <div className="sig-body">
        <div className="sig-name">{sig.technology}</div>
        <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
          <span className={`badge ${bc}`}>{DOMAIN_SHORT[sig.domain]||sig.domain}</span>
          <span className={`badge ${MATURITY_BADGE[sig.maturity]||"trial"}`}>
            {MATURITY_LABEL[sig.maturity]||sig.maturity}
          </span>
        </div>
      </div>
      <div className="sig-right">
        <div className="score-big" style={{color:scoreColor(score)}}>{pct(score,0)}</div>
        <div className="score-label">Signal Strength</div>
        <div className="score-bar">
          <div className="score-bar-fill" style={{width:pct(score),background:scoreColor(score)}}/>
        </div>
        <button className="sig-action" onClick={e=>{e.stopPropagation();onExplore();}}>Explore →</button>
      </div>
    </div>
  );
}

function AlertRow({alert,onExplore}:{alert:AlertType;onExplore:()=>void}){
  const cfg=SEV_CFG[alert.severity]||SEV_CFG.info;
  const t=new Date(alert.timestamp);
  const time=t.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
  return(
    <div className={`alert-card ${cfg.cls}`}
      style={{cursor:alert.technology?"pointer":"default"}}
      onClick={alert.technology?onExplore:undefined}>
      <span className="alert-icon">{cfg.icon}</span>
      <div className="alert-body">
        <div className="alert-title">{alert.title}</div>
        <div className="alert-msg">{alert.message}</div>
      </div>
      <span className="alert-time">{time}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SIGNALS VIEW
   ═══════════════════════════════════════════════════ */
function SignalsView({signals,onExplore,onSelect,domainFilter,setDomainFilter}:{
  signals:ScoredSignal[]; onExplore:(t:string)=>void; onSelect:(s:ScoredSignal)=>void;
  domainFilter:string|null; setDomainFilter:(d:string|null)=>void;
}){
  const [classF,setClassF]=useState("all");
  const [sort,setSort]=useState("strength");

  const domains=Array.from(new Set(signals.map(s=>s.domain)));

  let list=signals;
  if(classF!=="all") list=list.filter(s=>s.classification===classF);
  if(domainFilter)   list=list.filter(s=>s.domain===domainFilter);
  list=[...list].sort((a,b)=>{
    if(sort==="strength")    return b.score.composite-a.score.composite;
    if(sort==="opportunity") return b.opportunity_score-a.opportunity_score;
    if(sort==="risk")        return b.risk_level-a.risk_level;
    return 0;
  });

  return(
    <div className="fade-in">
      <div className="section-head">
        <div>
          <div className="section-title">📡 Signal Intelligence</div>
          <div className="section-sub">
            Showing <strong>{list.length}</strong> of {signals.length} signals across all domains
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <span className="filter-label">Strength</span>
        {([["all","All"],["signal","🟢 Strong"],["weak_signal","🟡 Moderate"]] as const).map(([v,l])=>(
          <button key={v} className={`chip${classF===v?" on":""}`} onClick={()=>setClassF(v)}>{l}</button>
        ))}
        <div className="filter-sep"/>
        <span className="filter-label">Domain</span>
        <button className={`chip${!domainFilter?" on":""}`} onClick={()=>setDomainFilter(null)}>All</button>
        {domains.map(d=>(
          <button key={d} className={`chip${domainFilter===d?" on":""}`}
            onClick={()=>setDomainFilter(domainFilter===d?null:d)}>
            {DOMAIN_ICONS[d]||"📊"} {DOMAIN_SHORT[d]||d}
          </button>
        ))}
        <div className="filter-sep"/>
        <span className="filter-label">Sort by</span>
        {([["strength","Signal Strength"],["opportunity","Opportunity"],["risk","Risk"]] as const).map(([v,l])=>(
          <button key={v} className={`chip${sort===v?" on":""}`} onClick={()=>setSort(v)}>{l}</button>
        ))}
      </div>

      {/* Signal cards */}
      <div className="signals-list">
        {list.map((s,i)=>(
          <div key={s.id||i}
            className={`signal-card ${STRENGTH_LABEL[s.classification]?.cls||"strong"}`}
            onClick={()=>onSelect(s)}>
            <div className={`sig-dot ${STRENGTH_LABEL[s.classification]?.dot||"strong"}`}/>
            <div className="sig-body">
              <div className="sig-name">{s.technology}</div>
              <div className="sig-meta">{s.title}</div>
              <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
                <span className={`badge ${DOMAIN_BADGE_CLASS[s.domain]||"ai"}`}>
                  {DOMAIN_SHORT[s.domain]||s.domain}
                </span>
                <span className={`badge ${MATURITY_BADGE[s.maturity]||"trial"}`}>
                  {MATURITY_LABEL[s.maturity]||s.maturity}
                </span>
                <span className={`badge ${STRENGTH_LABEL[s.classification]?.cls||"strong"}`}>
                  {STRENGTH_LABEL[s.classification]?.label||"Signal"}
                </span>
              </div>
              {s.explanation&&(
                <div className="sig-desc">{s.explanation}</div>
              )}
              {/* Two key stats */}
              <div style={{display:"flex",gap:20,marginTop:10}}>
                <div>
                  <div style={{fontSize:10.5,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:.5}}>Opportunity</div>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:15,fontWeight:600,color:"var(--emerald)"}}>{pct(s.opportunity_score)}</div>
                </div>
                <div>
                  <div style={{fontSize:10.5,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:.5}}>Risk Level</div>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:15,fontWeight:600,color:scoreColor(1-s.risk_level)}}>{pct(s.risk_level)}</div>
                </div>
              </div>
            </div>
            <div className="sig-right">
              <div className="score-big" style={{color:scoreColor(s.score.composite)}}>{pct(s.score.composite,0)}</div>
              <div className="score-label">Signal Strength</div>
              <div className="score-bar" style={{width:100}}>
                <div className="score-bar-fill" style={{width:pct(s.score.composite),background:scoreColor(s.score.composite)}}/>
              </div>
              <button className="sig-action" onClick={e=>{e.stopPropagation();onExplore(s.technology);}}>
                Explore →
              </button>
            </div>
          </div>
        ))}
        {!list.length&&<EmptyBox icon="🔍" title="No signals match your filters" sub="Try selecting a different domain or strength level." />}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TRENDS VIEW — Simple sparkline cards
   ═══════════════════════════════════════════════════ */
function TrendsView({forecasts}:{forecasts:TrendForecast[]}){
  if(!forecasts.length) return(
    <div className="fade-in">
      <EmptyBox icon="📈" title="Trend data loading…"
        sub='Click "Scan Now" to run the intelligence pipeline, or wait for the auto-refresh (every 30 seconds).' />
    </div>
  );

  return(
    <div className="fade-in">
      <div className="section-head">
        <div>
          <div className="section-title">📈 Technology Trends</div>
          <div className="section-sub">How each technology is growing over the past 14 days</div>
        </div>
      </div>
      <div className="trend-grid">
        {forecasts.map(f=>{
          const color=DOMAIN_COLORS[f.domain]||"#6366F1";
          const dir=f.velocity>0.6?"up":f.velocity>0.3?"same":"down";
          const dirLabel={"up":"📈 Rising","same":"📊 Stable","down":"📉 Declining"}[dir];
          const bc=DOMAIN_BADGE_CLASS[f.domain]||"ai";
          const vals=f.historical.map(d=>d.value);
          return(
            <div key={f.id} className="trend-card">
              <div className="trend-top">
                <div>
                  <div className="trend-name">{f.technology}</div>
                  <span className={`badge ${bc}`} style={{marginTop:4,display:"inline-flex"}}>
                    {DOMAIN_SHORT[f.domain]||f.domain}
                  </span>
                </div>
                <span className={`trend-dir ${dir}`}>{dirLabel}</span>
              </div>
              {/* Sparkline */}
              <div className="sparkline-wrap">
                <Sparkline values={vals} color={color} />
              </div>
              <div className="trend-stats">
                <div className="trend-stat">
                  <div className="trend-stat-label">Growth Speed</div>
                  <div className="trend-stat-val" style={{color:scoreColor(f.velocity)}}>{pct(f.velocity)}</div>
                </div>
                <div className="trend-stat">
                  <div className="trend-stat-label">7-Day Forecast</div>
                  <div className="trend-stat-val" style={{color:f.acceleration>=0?"var(--emerald)":"var(--rose)"}}>
                    {f.acceleration>=0?"+":""}{pct(f.acceleration,1)}
                  </div>
                </div>
                {f.breakout_detected&&(
                  <div className="trend-stat" style={{gridColumn:"1/-1",background:"var(--rose-light)"}}>
                    <div className="trend-stat-label">Status</div>
                    <div className="trend-stat-val" style={{fontSize:14,color:"var(--rose)"}}>⚡ Breakout Detected!</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Simple SVG sparkline */
function Sparkline({values,color}:{values:number[];color:string}){
  if(!values||values.length<2) return(
    <div style={{height:52,display:"flex",alignItems:"center",justifyContent:"center",
      color:"var(--text-faint)",fontSize:12}}>No data yet</div>
  );
  const max=Math.max(...values)||1;
  const min=Math.min(...values);
  const range=max-min||1;
  const W=300,H=52;
  const pts=values.map((v,i)=>({
    x:(i/(values.length-1))*W,
    y:H-2-((v-min)/range)*(H-4),
  }));
  const line=pts.map(p=>`${p.x},${p.y}`).join(" ");
  const area=`0,${H} ${line} ${W},${H}`;
  return(
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.18}/>
          <stop offset="100%" stopColor={color} stopOpacity={0}/>
        </linearGradient>
      </defs>
      <polyline points={area} fill={`url(#sg-${color.replace("#","")})`} stroke="none"/>
      <polyline points={line} fill="none" stroke={color} strokeWidth={2}
        vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r={4}
        fill={color} vectorEffect="non-scaling-stroke"/>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════
   RADAR VIEW
   ═══════════════════════════════════════════════════ */
function RadarView({items,onExplore}:{items:any[];onExplore:(t:string)=>void}){
  return(
    <div className="fade-in">
      <div className="section-head">
        <div>
          <div className="section-title">🎯 Technology Radar</div>
          <div className="section-sub">
            Visual map of all tracked technologies. Rings show readiness: <strong>Adopt</strong> (innermost, ready now) → <strong>Trial</strong> → <strong>Assess</strong> → <strong>Hold</strong> (outermost)
          </div>
        </div>
      </div>
      {/* Legend */}
      <div className="card" style={{marginBottom:18,padding:"14px 20px"}}>
        <div style={{display:"flex",gap:24,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:13,fontWeight:600,color:"var(--text-muted)"}}>How to read this:</span>
          {[
            {ring:"Adopt",color:"var(--emerald)",desc:"Ready to use now"},
            {ring:"Trial",color:"var(--blue)",desc:"Worth testing"},
            {ring:"Assess",color:"var(--amber)",desc:"Watch closely"},
            {ring:"Hold",color:"var(--text-muted)",desc:"Not recommended yet"},
          ].map(({ring,color,desc})=>(
            <span key={ring} style={{display:"flex",alignItems:"center",gap:7,fontSize:12.5}}>
              <span style={{width:10,height:10,borderRadius:"50%",background:color,display:"inline-block"}}/>
              <strong style={{color}}>{ring}</strong>
              <span style={{color:"var(--text-muted)"}}>{desc}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="card" style={{padding:12}}>
        <TechRadar items={items} onSelect={onExplore} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TOOLS VIEW
   ═══════════════════════════════════════════════════ */
function ToolsView({sub,setSub,initialGoal}:{sub:ToolTab;setSub:(t:ToolTab)=>void;initialGoal:string}){
  const TOOLS:[ToolTab,string,string,string][]=[
    ["ideamela",  "🎡","IdeaMela",  "Generate startup ideas from emerging tech"],
    ["nameit",    "🏷️","NameIt",    "Find the perfect brand name"],
    ["startbuddy","🤝","StartBuddy","Get a step-by-step launch roadmap"],
    ["mission",   "🕳️","Explore",   "Deep-dive any technology"],
  ];
  return(
    <div className="fade-in">
      <div className="section-head">
        <div className="section-title">🛠️ Intelligence Tools</div>
      </div>
      <div className="tools-tabs">
        {TOOLS.map(([id,icon,name,desc])=>(
          <button key={id} className={`tool-tab${sub===id?" on":""}`} onClick={()=>setSub(id)}>
            {icon} {name}
            <span style={{fontSize:11.5,color:"var(--text-muted)",fontWeight:400,marginLeft:2}}>— {desc}</span>
          </button>
        ))}
      </div>
      <div>
        {sub==="ideamela"   &&<IdeaMelaView />}
        {sub==="nameit"     &&<NameItView />}
        {sub==="startbuddy" &&<StartBuddyView />}
        {sub==="mission"    &&<AgenticMissionView initialGoal={initialGoal} />}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ALERTS VIEW
   ═══════════════════════════════════════════════════ */
function AlertsView({alerts,onExplore}:{alerts:AlertType[];onExplore:(t:string)=>void}){
  const counts:{[k:string]:number}={critical:0,high:0,warning:0,info:0};
  alerts.forEach(a=>{ if(counts[a.severity]!==undefined) counts[a.severity]++; });

  return(
    <div className="fade-in">
      <div className="section-head">
        <div>
          <div className="section-title">🔔 Alerts &amp; Notifications</div>
          <div className="section-sub">{alerts.length} alerts detected. Click any alert to explore the technology.</div>
        </div>
      </div>

      {/* Summary */}
      {alerts.length>0&&(
        <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
          {[
            {key:"critical",icon:"🚨",label:"Critical",color:"var(--rose)"},
            {key:"high",    icon:"⚡",label:"High",    color:"var(--rose)"},
            {key:"warning", icon:"⚠️",label:"Warning", color:"var(--amber)"},
            {key:"info",    icon:"ℹ️",label:"Info",    color:"var(--blue)"},
          ].filter(x=>counts[x.key]>0).map(x=>(
            <div key={x.key} style={{
              display:"flex",alignItems:"center",gap:8,
              padding:"8px 16px",borderRadius:"var(--radius-sm)",
              background:"var(--card-bg)",border:"1px solid var(--border)",
              boxShadow:"var(--shadow-card)"}}>
              <span style={{fontSize:16}}>{x.icon}</span>
              <span style={{fontFamily:"JetBrains Mono",fontSize:20,fontWeight:600,color:x.color}}>{counts[x.key]}</span>
              <span style={{fontSize:12.5,color:"var(--text-muted)"}}>{x.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="alert-list">
        {alerts.map((a,i)=>{
          const cfg=SEV_CFG[a.severity]||SEV_CFG.info;
          const t=new Date(a.timestamp);
          const time=t.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
          const date=t.toLocaleDateString([],{month:"short",day:"numeric"});
          const bc=DOMAIN_BADGE_CLASS[a.domain||""]||"ai";
          return(
            <div key={a.id||i} className={`alert-card ${cfg.cls}`}
              style={{cursor:a.technology?"pointer":"default"}}
              onClick={a.technology?()=>onExplore(a.technology):undefined}>
              <span className="alert-icon">{cfg.icon}</span>
              <div className="alert-body">
                <div className="alert-title">{a.title}</div>
                <div className="alert-msg">{a.message}</div>
                {a.domain&&(
                  <span className={`badge ${bc}`} style={{marginTop:8,display:"inline-flex"}}>{a.domain}</span>
                )}
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div className="alert-time">{time}</div>
                <div className="alert-time">{date}</div>
                {a.technology&&(
                  <div style={{
                    marginTop:8,fontSize:11.5,fontWeight:600,color:"var(--indigo)",
                    whiteSpace:"nowrap"}}>Explore →</div>
                )}
              </div>
            </div>
          );
        })}
        {!alerts.length&&<EmptyBox icon="✅" title="All Clear!" sub="No alerts at the moment. Everything is running smoothly." />}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════ */
function EmptyBox({icon,title,sub}:{icon:string;title:string;sub:string}){
  return(
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      <div className="empty-sub">{sub}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PROFILE DRAWER
   ═══════════════════════════════════════════════════ */
function ProfileDrawer({profile,onSave,onClose}:{
  profile:ProfileData; onSave:(p:ProfileData)=>void; onClose:()=>void;
}){
  const [data,setData]=useState(profile);
  const safeName = data.name || "Sanskriti User";
  const initials = safeName.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2)||"F";

  return(
    <>
      <div className="drawer-backdrop" onClick={onClose}/>
      <div className="drawer">
        <div className="drawer-head">
          <div className="drawer-title">👤 My Profile</div>
          <button className="drawer-close" onClick={onClose}>×</button>
        </div>
        <div className="drawer-body">
          
          <div className="pfp-wrap">
            <div className="pfp-ring">
              {data.pfp ? <img src={data.pfp} alt="Avatar"/> : initials}
            </div>
            <div style={{textAlign:"center"}}>
              <div className="pfp-name">{data.name||"Sanskriti User"}</div>
              <div className="pfp-sub">{data.email||"No email set"}</div>
            </div>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div className="form-field">
              <label className="form-label">Profile Image URL</label>
              <input className="form-input" type="url" value={data.pfp} 
                onChange={e=>setData({...data,pfp:e.target.value})} placeholder="https://example.com/photo.jpg" />
            </div>
            <div className="form-field">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={data.name} 
                onChange={e=>setData({...data,name:e.target.value})} placeholder="e.g. Jane Doe" />
            </div>
            <div className="form-field">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" value={data.email} 
                onChange={e=>setData({...data,email:e.target.value})} placeholder="you@company.com" />
            </div>
            <div className="form-field">
              <label className="form-label">Phone Number</label>
              <input className="form-input" type="tel" value={data.phone} 
                onChange={e=>setData({...data,phone:e.target.value})} placeholder="+1 (555) 000-0000" />
            </div>
            <div className="form-field">
              <label className="form-label">LinkedIn Profile</label>
              <input className="form-input" type="url" value={data.linkedin} 
                onChange={e=>setData({...data,linkedin:e.target.value})} placeholder="https://linkedin.com/in/..." />
            </div>
          </div>
        </div>
        <div className="drawer-footer">
          <button className="btn-secondary" style={{flex:1}} onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{flex:2}} onClick={()=>{onSave(data);onClose();}}>
            💾 Save Profile
          </button>
        </div>
      </div>
    </>
  );
}


/* ═══════════════════════════════════════════════════
   SETTINGS DRAWER
   ═══════════════════════════════════════════════════ */
function SettingsDrawer({theme,toggleTheme,settings,onSave,onClose,onSignOut}:{
  theme:"light"|"dark"; toggleTheme:()=>void;
  settings:SettingsData; onSave:(s:SettingsData)=>void; onClose:()=>void; onSignOut:()=>void;
}){
  const [data,setData]=useState(settings);
  const [showSignOut,setShowSignOut]=useState(false);

  return(
    <>
      <div className="drawer-backdrop" onClick={onClose}/>
      <div className="drawer">
        <div className="drawer-head">
          <div className="drawer-title">⚙️ Settings</div>
          <button className="drawer-close" onClick={onClose}>×</button>
        </div>
        
        <div className="drawer-body">
          {/* Theme */}
          <div className="settings-group">
            <div className="settings-group-label">Appearance</div>
            <div className="theme-selector">
              <div className={`theme-opt ${theme==="light"?"chosen":""}`} onClick={()=>{if(theme==="dark") toggleTheme();}}>
                <div className="theme-opt-icon">☀️</div>
                <div className="theme-opt-label">Light Mode</div>
              </div>
              <div className={`theme-opt ${theme==="dark"?"chosen":""}`} onClick={()=>{if(theme==="light") toggleTheme();}}>
                <div className="theme-opt-icon">🌙</div>
                <div className="theme-opt-label">Dark Mode</div>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="settings-group">
            <div className="settings-group-label">Intelligence Sync</div>
            
            <div className="settings-row">
              <div className="settings-row-info">
                <div className="settings-row-label">Auto-Refresh Dashboards</div>
                <div className="settings-row-sub">Pull new intelligence every 30 seconds</div>
              </div>
              <button className={`toggle-sw ${data.autoRefresh?"on":""}`} 
                onClick={()=>setData({...data,autoRefresh:!data.autoRefresh})} />
            </div>

            <div className="settings-row">
              <div className="settings-row-info">
                <div className="settings-row-label">System Notifications</div>
                <div className="settings-row-sub">Allow browser notifications for alerts</div>
              </div>
              <button className={`toggle-sw ${data.notifications?"on":""}`} 
                onClick={()=>setData({...data,notifications:!data.notifications})} />
            </div>

            <div className="settings-row">
              <div className="settings-row-info">
                <div className="settings-row-label">Critical Signal Alerts</div>
                <div className="settings-row-sub">Highlight breakout technologies instantly</div>
              </div>
              <button className={`toggle-sw ${data.signalAlerts?"on":""}`} 
                onClick={()=>setData({...data,signalAlerts:!data.signalAlerts})} />
            </div>
          </div>

          {/* Account */}
          <div className="settings-group" style={{marginTop:"auto"}}>
            <div className="settings-group-label">Account</div>
            
            {!showSignOut ? (
              <button className="btn-danger" onClick={()=>setShowSignOut(true)}>
                Sign Out / Reset Data
              </button>
            ) : (
              <div className="signout-confirm fade-in">
                <div style={{fontWeight:700,color:"var(--rose)",fontSize:14,marginBottom:6}}>Are you sure?</div>
                <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:14}}>
                  This will clear your local settings and log you out.
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button className="btn-secondary" style={{flex:1}} onClick={()=>setShowSignOut(false)}>Cancel</button>
                  <button className="btn-danger" style={{flex:1}} onClick={onSignOut}>Yes, Sign Out</button>
                </div>
              </div>
            )}
            
          </div>

        </div>
        <div className="drawer-footer">
          <button className="btn-secondary" style={{flex:1}} onClick={onClose}>Close</button>
          <button className="btn-primary" style={{flex:2}} onClick={()=>{onSave(data);onClose();}}>
            💾 Save Settings
          </button>
        </div>
      </div>
    </>
  );
}
