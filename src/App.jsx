import { useState, useEffect, useRef, createContext, useContext } from 'react';
import { Search, ArrowRight, Trash2, Check, ChevronDown, Shield, RefreshCw,
         X, Link2, Lock, Bell, ChevronLeft, Send, MessageSquare,
         Sun, Moon, LogOut, User } from 'lucide-react';
import { supabase } from './supabase';

// ── Theme ─────────────────────────────────────────────────────────────────────
const ThemeCtx = createContext({});
const useC = () => useContext(ThemeCtx);

const LIGHT = {
  bg:'#f5f7fa', surface:'#ffffff', surface2:'#edf0f5', border:'#dde3ed',
  green:'#059669', greenDim:'rgba(5,150,105,0.08)', greenBorder:'rgba(5,150,105,0.3)',
  gold:'#d97706', goldDim:'rgba(217,119,6,0.08)', goldBorder:'rgba(217,119,6,0.3)',
  red:'#dc2626', redDim:'rgba(220,38,38,0.08)', redBorder:'rgba(220,38,38,0.3)',
  blue:'#2563eb', blueDim:'rgba(37,99,235,0.08)', blueBorder:'rgba(37,99,235,0.3)',
  purple:'#7c3aed', purpleDim:'rgba(124,58,237,0.08)', purpleBorder:'rgba(124,58,237,0.3)',
  text:'#1a2332', muted:'#94a3b8', subtle:'#475569',
};
const DARK = {
  bg:'#080d16', surface:'#0f1623', surface2:'#162030', border:'#1c2b3a',
  green:'#10b981', greenDim:'rgba(16,185,129,0.10)', greenBorder:'rgba(16,185,129,0.28)',
  gold:'#f59e0b', goldDim:'rgba(245,158,11,0.10)', goldBorder:'rgba(245,158,11,0.28)',
  red:'#f87171', redDim:'rgba(248,113,113,0.10)', redBorder:'rgba(248,113,113,0.28)',
  blue:'#60a5fa', blueDim:'rgba(96,165,250,0.10)', blueBorder:'rgba(96,165,250,0.25)',
  purple:'#a78bfa', purpleDim:'rgba(167,139,250,0.10)', purpleBorder:'rgba(167,139,250,0.25)',
  text:'#dde4ee', muted:'#4a6080', subtle:'#8ba3bf',
};

const PORTS = [
  // ATLANTA Field Office
  'Atlanta, GA (Hartsfield-Jackson)','Charlotte, NC','Nashville, TN','Memphis, TN',
  'Savannah, GA','Jacksonville, FL',
  // BALTIMORE Field Office
  'Baltimore/Washington (BWI), MD','Washington Dulles, VA','Richmond, VA','Norfolk, VA',
  // BOSTON Field Office
  'Boston, MA (Logan)','Portland, ME','Calais, ME','Houlton, ME','Burlington, VT',
  'Highgate Springs, VT','Providence, RI','Manchester, NH','Hartford, CT',
  // BUFFALO Field Office
  'Buffalo, NY (Niagara Falls)','Niagara Falls, NY','Rochester, NY','Syracuse, NY',
  'Ogdensburg, NY','Alexandria Bay, NY','Champlain, NY','Massena, NY',
  // CHICAGO Field Office
  "Chicago O'Hare, IL",'Indianapolis, IN','Louisville, KY','Cincinnati, OH','Columbus, OH',
  'Cleveland, OH','Minneapolis, MN','Milwaukee, WI','Kansas City, MO','St. Louis, MO',
  'Omaha, NE','Des Moines, IA',
  // DETROIT Field Office
  'Detroit, MI (Metropolitan)','Port Huron, MI','Sault Ste. Marie, MI','Flint, MI','Grand Rapids, MI',
  // EL PASO Field Office
  'El Paso, TX','El Paso, TX (Airport)','El Paso, TX (Ysleta/Zaragoza)','Santa Teresa, NM',
  'Presidio, TX','Fabens, TX','Fort Hancock, TX','Albuquerque, NM',
  // HOUSTON Field Office
  'Houston, TX (IAH)','Houston, TX (Hobby)','Galveston, TX','Port Arthur, TX',
  'Corpus Christi, TX','Austin, TX','Dallas/Fort Worth, TX','San Antonio, TX',
  // LAREDO Field Office
  'Laredo, TX','Laredo, TX (Colombia Bridge)','Eagle Pass, TX','Del Rio, TX',
  'Roma, TX','Rio Grande City, TX','Piedras Negras, TX',
  // LOS ANGELES Field Office
  'Los Angeles, CA (LAX)','Los Angeles, CA (Seaport)','Long Beach, CA','Las Vegas, NV',
  'Ontario, CA','Phoenix, AZ','Denver, CO','Salt Lake City, UT','Reno, NV',
  // MIAMI Field Office
  'Miami, FL (MIA)','Miami, FL (Seaport)','Fort Lauderdale, FL','West Palm Beach, FL',
  'Orlando, FL','Port Everglades, FL','Port Canaveral, FL',
  // NEW ORLEANS Field Office
  'New Orleans, LA','New Orleans, LA (Airport)','Baton Rouge, LA','Mobile, AL','Gulfport, MS',
  // NEW YORK Field Office
  'JFK, NY','Newark, NJ','Philadelphia, PA','Pittsburgh, PA','Harrisburg, PA','New York, NY (Seaport)',
  // PORTLAND Field Office
  'Portland, OR','Eugene, OR','Medford, OR','Astoria, OR','Longview, WA',
  // SAN DIEGO Field Office
  'San Diego, CA (San Ysidro)','San Diego, CA (Otay Mesa)','San Diego, CA (Airport)',
  'Calexico, CA (East)','Calexico, CA (West)','Tecate, CA','Andrade, CA',
  // SAN FRANCISCO Field Office
  'San Francisco, CA (SFO)','Oakland, CA','Sacramento, CA','Fresno, CA','San Jose, CA',
  'Stockton, CA','Anchorage, AK','Juneau, AK','Fairbanks, AK','Honolulu, HI','Maui, HI',
  // SAN JUAN Field Office
  'San Juan, PR','Ponce, PR','Mayaguez, PR','Fajardo, PR','St. Thomas, USVI','St. Croix, USVI',
  // SEATTLE Field Office
  'Seattle, WA (SeaTac)','Seattle, WA (Seaport)','Tacoma, WA','Bellingham, WA','Blaine, WA',
  'Sumas, WA','Spokane, WA','Oroville, WA','Danville, WA','Lynden, WA','Point Roberts, WA',
  // TAMPA Field Office
  'Tampa, FL','Fort Myers, FL','Sarasota, FL','Key West, FL',
  // TUCSON Field Office
  'Tucson, AZ','Nogales, AZ','Douglas, AZ','Lukeville, AZ','Naco, AZ','Sasabe, AZ','Yuma, AZ',
  // SOUTHWEST BORDER additional
  'Hidalgo/Pharr, TX','McAllen, TX','Brownsville, TX',
].sort();

const LOCK_MS = 48 * 60 * 60 * 1000;
const POLL_MS = 15 * 1000;
const ADMIN = 'kevinsschmidt';

// ── Helpers ───────────────────────────────────────────────────────────────────
const uuid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const formatDate = iso => new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
const formatMsgTime = iso => new Date(iso).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true});
function formatTime(iso){
  const ms=Date.now()-new Date(iso).getTime();
  if(ms<60000) return 'just now';
  if(ms<3600000) return `${Math.floor(ms/60000)}m ago`;
  if(ms<86400000) return `${Math.floor(ms/3600000)}h ago`;
  return formatDate(iso);
}
function formatCountdown(expiresAt){
  const ms=new Date(expiresAt).getTime()-Date.now();
  if(ms<=0) return null;
  const h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000);
  return h>=24?`${Math.floor(h/24)}d ${h%24}h left`:`${h}h ${m}m left`;
}
const getChainKey = officers => officers.map(o=>o.id).sort().join('|');

async function hashPassword(username, password){
  const data = new TextEncoder().encode(username.toLowerCase()+password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

function dbToListing(row){
  return {
    id:row.id, name:row.name, currentPort:row.current_port,
    desiredPorts:row.desired_ports, contact:row.contact,
    notes:row.notes||'', gsLevel:row.gs_level||'',
    status:row.status||'', userId:row.user_id||'', createdAt:row.created_at,
  };
}
function dbToLocks(rows){
  const locks={},now=Date.now();
  for(const r of rows){
    if(new Date(r.expires_at).getTime()<=now) continue;
    if(!locks[r.chain_key]) locks[r.chain_key]={};
    locks[r.chain_key][r.officer_id]={lockedAt:r.locked_at,expiresAt:r.expires_at};
  }
  return locks;
}
function computeChains(ls){
  const two=[],threeKeys=new Set(),three=[];
  for(let i=0;i<ls.length;i++)
    for(let j=i+1;j<ls.length;j++){
      const [a,b]=[ls[i],ls[j]];
      if(a.desiredPorts.includes(b.currentPort)&&b.desiredPorts.includes(a.currentPort)) two.push([a,b]);
    }
  for(let i=0;i<ls.length;i++)
    for(let j=0;j<ls.length;j++){if(j===i)continue;
      for(let k=0;k<ls.length;k++){if(k===i||k===j)continue;
        const [a,b,c]=[ls[i],ls[j],ls[k]];
        if(a.desiredPorts.includes(b.currentPort)&&b.desiredPorts.includes(c.currentPort)&&c.desiredPorts.includes(a.currentPort)){
          const key=[a.id,b.id,c.id].sort().join('|');
          if(!threeKeys.has(key)){threeKeys.add(key);three.push([a,b,c]);}
        }
      }
    }
  return {two,three};
}
function computeQueuePositions(listings){
  const pos={};
  for(const l of listings){
    pos[l.id]={};
    for(const port of l.desiredPorts){
      const ahead=listings.filter(o=>o.id!==l.id&&o.desiredPorts.includes(port)&&new Date(o.createdAt)<new Date(l.createdAt)).length;
      pos[l.id][port]=ahead+1;
    }
  }
  return pos;
}
const sortByPriority=arr=>[...arr].sort((a,b)=>Math.min(...a.map(o=>new Date(o.createdAt)))-Math.min(...b.map(o=>new Date(o.createdAt))));
function fireNativeNotif(title, body, onClick){
  if('Notification' in window&&Notification.permission==='granted'){
    try{
      const n=new Notification(`CBPO Swap Board: ${title}`,{body});
      if(onClick) n.onclick=()=>{window.focus();onClick();};
    }catch(e){}
  }
}

function playMessageSound(){
  try{
    const ctx=new (window.AudioContext||window.webkitAudioContext)();
    const o=ctx.createOscillator();
    const g=ctx.createGain();
    o.connect(g);g.connect(ctx.destination);
    o.frequency.setValueAtTime(880,ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(660,ctx.currentTime+0.1);
    g.gain.setValueAtTime(0.3,ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.3);
    o.start(ctx.currentTime);o.stop(ctx.currentTime+0.3);
  }catch(e){}
}
const NOTIF_META={
  match_found:{icon:'🔗',color:'gold'},
  lock_placed:{icon:'🔒',color:'blue'},
  all_locked:{icon:'✅',color:'green'},
  lock_expired:{icon:'⏰',color:'muted'},
  new_message:{icon:'💬',color:'purple'},
};

// ── CSS ───────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Inter:wght@400;500;600&display=swap');
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
  html,body{overscroll-behavior:none;}
  body{margin:0;}
  ::-webkit-scrollbar{width:3px;}
  ::-webkit-scrollbar-thumb{border-radius:2px;}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.55}}
  @keyframes bellRing{0%,100%{transform:rotate(0)}20%{transform:rotate(-15deg)}40%{transform:rotate(15deg)}60%{transform:rotate(-10deg)}80%{transform:rotate(10deg)}}
  .fade-in{animation:fadeIn 0.18s ease}
  .slide-up{animation:slideUp 0.2s ease}
  .tab{transition:color 0.15s,border-color 0.15s;}
  .bell-ring{animation:bellRing 0.5s ease;}
  input,textarea,select{font-family:'Inter',sans-serif;}
  input::placeholder,textarea::placeholder{color:#94a3b8;}
`;

const inp = C => ({
  width:'100%', background:C.surface2, border:`1px solid ${C.border}`,
  borderRadius:8, color:C.text, padding:'10px 14px', fontSize:16,
});

// ── Small Components ──────────────────────────────────────────────────────────
function PortTag({label,onRemove}){
  const C=useC();
  return(
    <span style={{display:'inline-flex',alignItems:'center',gap:4,background:C.greenDim,border:`1px solid ${C.greenBorder}`,borderRadius:5,padding:'2px 8px',fontSize:12,color:C.green,fontFamily:"'Inter',sans-serif"}}>
      {label}{onRemove&&<X size={9} style={{cursor:'pointer',opacity:0.7}} onClick={onRemove}/>}
    </span>
  );
}

function LockProgress({locked,total}){
  const C=useC();
  return(
    <div style={{display:'flex',gap:3}}>
      {Array.from({length:total}).map((_,i)=>(
        <div key={i} style={{height:3,flex:1,borderRadius:2,background:i<locked?C.green:C.border,transition:'background 0.3s'}}/>
      ))}
    </div>
  );
}

function Dropdown({label,value,options,onSelect,placeholder,multi=false,selected=[]}){
  const C=useC();
  const [open,setOpen]=useState(false);
  const [search,setSearch]=useState('');
  const ref=useRef();
  useEffect(()=>{
    const fn=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener('mousedown',fn);
    return()=>document.removeEventListener('mousedown',fn);
  },[]);
  const filtered=options.filter(p=>p.toLowerCase().includes(search.toLowerCase()));
  const displayVal=multi?(selected.length?`${selected.length} port${selected.length>1?'s':''} selected`:placeholder):(value||placeholder);
  return(
    <div style={{position:'relative'}} ref={ref}>
      {label&&<label style={{display:'block',fontSize:11,fontWeight:600,color:C.muted,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em'}}>{label}</label>}
      <button onClick={()=>{setOpen(!open);setSearch('');}} style={{...inp(C),textAlign:'left',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',color:(multi?selected.length:value)?C.text:C.muted}}>
        <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{displayVal}</span>
        <ChevronDown size={13} style={{flexShrink:0,marginLeft:8,color:C.muted,transform:open?'rotate(180deg)':'none',transition:'transform 0.15s'}}/>
      </button>
      {open&&(
        <div className="fade-in" style={{position:'absolute',top:'calc(100% + 4px)',left:0,right:0,background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,zIndex:300,overflow:'hidden',boxShadow:'0 8px 28px rgba(0,0,0,0.15)'}}>
          <div style={{padding:8,borderBottom:`1px solid ${C.border}`}}>
            <input autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." style={{...inp(C),padding:'7px 10px',fontSize:14}}/>
          </div>
          <div style={{maxHeight:220,overflowY:'auto'}}>
            {filtered.length===0&&<div style={{padding:14,fontSize:13,color:C.muted,textAlign:'center'}}>No results</div>}
            {filtered.map(p=>{
              const isSel=multi?selected.includes(p):value===p;
              return(
                <div key={p} onClick={()=>{onSelect(p);setOpen(false);}}
                  style={{padding:'9px 14px',fontSize:13,cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',color:isSel?C.green:C.text,background:'transparent'}}>
                  {p}{isSel&&<Check size={12} color={C.green}/>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Auth Screen ───────────────────────────────────────────────────────────────
function AuthScreen({onAuth}){
  const C=useC();
  const [mode,setMode]=useState('login');
  const [username,setUsername]=useState('');
  const [password,setPassword]=useState('');
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);

  async function handleSubmit(){
    if(!username.trim()||!password.trim()){setError('Fill in all fields');return;}
    if(password.length<6){setError('Password must be at least 6 characters');return;}
    setLoading(true);setError('');
    try{
      const hash=await hashPassword(username.trim(),password);
      if(mode==='login'){
        const {data,error:err}=await supabase.from('users').select('*').eq('username',username.trim().toLowerCase()).eq('password_hash',hash).maybeSingle();
        if(err||!data){setError('Invalid username or password');setLoading(false);return;}
        onAuth(data);
      } else {
        const {data:existing}=await supabase.from('users').select('id').eq('username',username.trim().toLowerCase()).maybeSingle();
        if(existing){setError('Username already taken');setLoading(false);return;}
        const newUser={id:uuid(),username:username.trim().toLowerCase(),password_hash:hash};
        const {error:insertErr}=await supabase.from('users').insert([newUser]);
        if(insertErr){setError('Registration failed. Try again.');setLoading(false);return;}
        onAuth(newUser);
      }
    }catch(e){setError('Something went wrong');setLoading(false);}
  }

  return(
    <div style={{minHeight:'100vh',background:C.bg,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,fontFamily:"'Inter',sans-serif"}}>
      <style>{css}</style>
      <div style={{marginBottom:28,display:'flex',flexDirection:'column',alignItems:'center'}}>
        <div style={{background:'#000',borderRadius:18,width:76,height:76,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16,boxShadow:'0 4px 20px rgba(0,0,0,0.15)'}}>
          <Shield size={38} color="silver"/>
        </div>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:26,fontWeight:800,letterSpacing:'0.06em',color:C.text,lineHeight:1}}>CBPO SWAP BOARD</div>
        <div style={{fontSize:13,color:C.muted,marginTop:6}}>Duty Station Exchange Network</div>
      </div>
      <div style={{width:'100%',maxWidth:360,background:C.surface,borderRadius:14,padding:24,border:`1px solid ${C.border}`,boxShadow:'0 4px 24px rgba(0,0,0,0.07)'}}>
        <div style={{display:'flex',background:C.surface2,borderRadius:8,padding:3,marginBottom:22}}>
          {['login','register'].map(m=>(
            <button key={m} onClick={()=>{setMode(m);setError('');}}
              style={{flex:1,padding:'8px',border:'none',borderRadius:6,cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:"'Inter',sans-serif",
                background:mode===m?C.surface:'transparent',color:mode===m?C.text:C.muted,
                boxShadow:mode===m?'0 1px 3px rgba(0,0,0,0.08)':'none',transition:'all 0.15s'}}>
              {m==='login'?'Log In':'Register'}
            </button>
          ))}
        </div>
        <div style={{marginBottom:14}}>
          <label style={{display:'block',fontSize:11,fontWeight:600,color:C.muted,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em'}}>Username</label>
          <input value={username} onChange={e=>setUsername(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter')handleSubmit();}}
            placeholder="Enter username" autoCapitalize="none" autoCorrect="off"
            style={{...inp(C)}}/>
        </div>
        <div style={{marginBottom:20}}>
          <label style={{display:'block',fontSize:11,fontWeight:600,color:C.muted,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em'}}>Password</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter')handleSubmit();}}
            placeholder="Min. 6 characters"
            style={{...inp(C)}}/>
        </div>
        {error&&<div style={{background:C.redDim,border:`1px solid ${C.redBorder}`,borderRadius:7,padding:'8px 12px',fontSize:13,color:C.red,marginBottom:16}}>{error}</div>}
        <button onClick={handleSubmit} disabled={loading}
          style={{width:'100%',border:'none',borderRadius:8,color:'#fff',padding:'13px',fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:"'Inter',sans-serif",
            background:loading?C.muted:C.green,transition:'background 0.2s'}}>
          {loading?'Please wait…':mode==='login'?'Log In':'Create Account'}
        </button>
        <div style={{textAlign:'center',marginTop:14,fontSize:12,color:C.muted}}>
          {mode==='login'?'No account? ':'Already have one? '}
          <button onClick={()=>{setMode(mode==='login'?'register':'login');setError('');}}
            style={{background:'none',border:'none',color:C.blue,cursor:'pointer',fontSize:12,fontWeight:600,padding:0,fontFamily:"'Inter',sans-serif"}}>
            {mode==='login'?'Register here':'Log in here'}
          </button>
        </div>
        {mode==='login'&&(
          <div style={{textAlign:'center',marginTop:10,fontSize:12}}>
            <button onClick={()=>setMode('forgot')}
              style={{background:'none',border:'none',color:C.muted,cursor:'pointer',fontSize:12,padding:0,fontFamily:"'Inter',sans-serif",textDecoration:'underline'}}>
              Forgot password?
            </button>
          </div>
        )}
        {mode==='forgot'&&(
          <div style={{marginTop:12,background:C.goldDim,border:`1px solid ${C.goldBorder}`,borderRadius:8,padding:'10px 14px',fontSize:12,color:C.gold,lineHeight:1.5}}>
            Contact the admin to reset your password. Go to Settings → Contact Admin after logging in, or reach out directly.
            <div style={{marginTop:8}}>
              <button onClick={()=>setMode('login')} style={{background:'none',border:'none',color:C.gold,cursor:'pointer',fontSize:12,fontWeight:600,padding:0,fontFamily:"'Inter',sans-serif",textDecoration:'underline'}}>
                Back to login
              </button>
            </div>
          </div>
        )}
      </div>
      <div style={{marginTop:20,fontSize:11,color:C.muted,textAlign:'center'}}>
        Unofficial peer tool — not affiliated with CBP
      </div>
    </div>
  );
}

// ── Welcome Screen (post prompt) ──────────────────────────────────────────────
function WelcomeScreen({user,onPost,onBrowse}){
  const C=useC();
  return(
    <div style={{minHeight:'100vh',background:C.bg,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:32,fontFamily:"'Inter',sans-serif"}}>
      <style>{css}</style>
      <div style={{background:'#000',borderRadius:18,width:72,height:72,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:20}}>
        <Shield size={36} color="silver"/>
      </div>
      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:800,letterSpacing:'0.06em',color:C.text,marginBottom:8}}>CBPO SWAP BOARD</div>
      <div style={{fontSize:14,color:C.muted,marginBottom:6,textAlign:'center'}}>Welcome, <strong style={{color:C.text}}>{user.username}</strong>!</div>
      <div style={{fontSize:13,color:C.muted,textAlign:'center',lineHeight:1.6,marginBottom:36,maxWidth:300}}>
        Post your current station and where you want to go. We'll match you automatically.
      </div>
      <button onClick={onPost}
        style={{width:'100%',maxWidth:300,border:'none',borderRadius:14,color:'#fff',padding:'18px',fontSize:18,fontWeight:700,cursor:'pointer',fontFamily:"'Inter',sans-serif",
          background:C.green,boxShadow:`0 6px 24px ${C.greenBorder}`,marginBottom:16,letterSpacing:'0.02em'}}>
        + Post Your Swap
      </button>
      <button onClick={onBrowse}
        style={{background:'none',border:'none',color:C.muted,fontSize:14,cursor:'pointer',fontFamily:"'Inter',sans-serif",padding:'8px'}}>
        Browse board first
      </button>
    </div>
  );
}

// ── Settings Panel ────────────────────────────────────────────────────────────
function SettingsPanel({user,onClose,dark,onToggleDark,onLogout,onContactAdmin,isAdmin}){
  const C=useC();
  return(
    <div style={{position:'fixed',inset:0,zIndex:500,display:'flex',flexDirection:'column',background:C.bg,fontFamily:"'Inter',sans-serif"}}>
      <style>{css}</style>
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
        <div style={{height:'env(safe-area-inset-top)',background:C.surface}}/>
        <div style={{padding:'12px 18px',display:'flex',alignItems:'center',gap:12}}>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:C.muted,padding:4,display:'flex',alignItems:'center'}}>
            <ChevronLeft size={20} color={C.muted}/>
          </button>
          <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:700,letterSpacing:'0.05em',color:C.text}}>SETTINGS</span>
        </div>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:16}}>
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:14,marginBottom:14,display:'flex',alignItems:'center',gap:12}}>
          <div style={{background:C.greenDim,border:`1px solid ${C.greenBorder}`,borderRadius:'50%',width:40,height:40,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <User size={18} color={C.green}/>
          </div>
          <div>
            <div style={{fontWeight:600,fontSize:15,color:C.text}}>{user.username}</div>
            <div style={{fontSize:12,color:C.muted,marginTop:2}}>Logged in</div>
          </div>
        </div>
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:'14px 16px',marginBottom:14,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            {dark?<Moon size={17} color={C.blue}/>:<Sun size={17} color={C.gold}/>}
            <span style={{fontSize:14,fontWeight:500,color:C.text}}>{dark?'Dark Mode':'Light Mode'}</span>
          </div>
          <button onClick={onToggleDark}
            style={{width:46,height:26,borderRadius:13,border:'none',cursor:'pointer',position:'relative',transition:'background 0.2s',background:dark?C.green:C.border,padding:0}}>
            <div style={{position:'absolute',top:3,left:dark?21:3,width:20,height:20,borderRadius:'50%',background:'white',transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/>
          </button>
        </div>
        {!isAdmin&&(
        <button onClick={onContactAdmin}
          style={{width:'100%',background:C.blueDim,border:`1px solid ${C.blueBorder}`,borderRadius:10,padding:'14px',display:'flex',alignItems:'center',justifyContent:'center',gap:8,cursor:'pointer',fontFamily:"'Inter',sans-serif",marginBottom:12}}>
          <MessageSquare size={16} color={C.blue}/>
          <span style={{fontSize:14,fontWeight:600,color:C.blue}}>Contact Admin</span>
        </button>
        )}
        <button onClick={onLogout}
          style={{width:'100%',background:C.redDim,border:`1px solid ${C.redBorder}`,borderRadius:10,padding:'14px',display:'flex',alignItems:'center',justifyContent:'center',gap:8,cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>
          <LogOut size={16} color={C.red}/>
          <span style={{fontSize:14,fontWeight:600,color:C.red}}>Log Out</span>
        </button>
      </div>
    </div>
  );
}

// ── Notification Panel ────────────────────────────────────────────────────────
function NotifPanel({notifs,onClose,onMarkAllRead,onClearAll,notifPerm,onRequestPerm,onOpenChat}){
  const C=useC();
  const unread=notifs.filter(n=>!n.read).length;
  return(
    <div style={{position:'fixed',inset:0,zIndex:500,display:'flex',flexDirection:'column',background:C.bg,fontFamily:"'Inter',sans-serif"}}>
      <style>{css}</style>
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
        <div style={{height:'env(safe-area-inset-top)',background:C.surface}}/>
        <div style={{padding:'12px 18px',display:'flex',alignItems:'center',gap:12}}>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:C.muted,padding:4,display:'flex',alignItems:'center'}}>
            <ChevronLeft size={20} color={C.muted}/>
          </button>
          <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:700,letterSpacing:'0.05em',color:C.text}}>NOTIFICATIONS</span>
          {unread>0&&<span style={{background:C.redDim,border:`1px solid ${C.redBorder}`,borderRadius:20,padding:'2px 8px',fontSize:11,fontWeight:700,color:C.red}}>{unread} new</span>}
          <div style={{marginLeft:'auto',display:'flex',gap:8}}>
            {notifs.length>0&&<button onClick={onMarkAllRead} style={{background:'none',border:'none',cursor:'pointer',color:C.muted,fontSize:12,fontFamily:"'Inter',sans-serif"}}>Mark read</button>}
            {notifs.length>0&&<button onClick={onClearAll} style={{background:'none',border:'none',cursor:'pointer',color:C.muted,fontSize:12,fontFamily:"'Inter',sans-serif"}}>Clear</button>}
          </div>
        </div>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:16}}>
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:14,marginBottom:16}}>
          <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>🔔 Push Notifications</div>
          {notifPerm==='granted'?<div style={{fontSize:13,color:C.green,display:'flex',alignItems:'center',gap:6}}><Check size={13}/>Enabled</div>
          :notifPerm==='denied'?<div style={{fontSize:13,color:C.red}}>Blocked — enable in browser settings</div>
          :<button onClick={onRequestPerm} style={{width:'100%',background:C.blueDim,border:`1px solid ${C.blueBorder}`,borderRadius:7,color:C.blue,fontSize:13,fontWeight:600,padding:'9px',cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>Enable Browser Notifications</button>}
        </div>
        {notifs.length===0?(
          <div style={{textAlign:'center',padding:'40px 20px',color:C.muted}}>
            <div style={{fontSize:32,marginBottom:10}}>🔔</div>
            <div style={{fontWeight:600,marginBottom:4,color:C.text}}>No notifications yet</div>
            <div style={{fontSize:13}}>You'll be alerted on matches, locks, and messages</div>
          </div>
        ):(
          notifs.map(n=>{
            const meta=NOTIF_META[n.type]||{icon:'📋',color:'muted'};
            const color=C[meta.color]||C.muted;
            return(
              <div key={n.id} onClick={()=>{if(n.chainKey){onClose();onOpenChat(n.chainKey);}}}
                style={{background:n.read?C.surface:C.greenDim,border:`1px solid ${n.read?C.border:C.greenBorder}`,borderRadius:9,padding:'12px 14px',marginBottom:8,display:'flex',gap:12,alignItems:'flex-start',cursor:n.chainKey?'pointer':'default'}}>
                <span style={{fontSize:20,flexShrink:0}}>{meta.icon}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
                    <span style={{fontSize:13,fontWeight:600,color}}>{n.title}</span>
                    <span style={{fontSize:11,color:C.muted,flexShrink:0,marginLeft:8}}>{formatTime(n.createdAt)}</span>
                  </div>
                  <div style={{fontSize:12,color:C.subtle,lineHeight:1.5}}>{n.body}</div>
                </div>
                {!n.read&&<div style={{width:7,height:7,borderRadius:'50%',background:C.green,flexShrink:0,marginTop:4}}/>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Chat Panel ────────────────────────────────────────────────────────────────
function ChatPanel({chainKey,officers,messages,loading,currentUser,myListing,onSend,onClose}){
  const C=useC();
  const [text,setText]=useState('');
  const [sending,setSending]=useState(false);
  const bottomRef=useRef();
  const inputRef=useRef();
  const isParticipant=myListing&&officers.some(o=>o.id===myListing.id);

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:'smooth'});},[messages]);
  useEffect(()=>{inputRef.current?.focus();},[]);

  async function handleSend(){
    if(!text.trim()||sending||!isParticipant) return;
    setSending(true);
    await onSend(text.trim());
    setText('');
    setSending(false);
  }

  return(
    <div style={{position:'fixed',inset:0,zIndex:600,display:'flex',flexDirection:'column',background:C.bg,fontFamily:"'Inter',sans-serif"}}>
      <style>{css}</style>
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
        <div style={{height:'env(safe-area-inset-top)',background:C.surface}}/>
        <div style={{padding:'12px 16px',display:'flex',alignItems:'center',gap:10}}>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:C.muted,padding:4,display:'flex',alignItems:'center'}}>
            <ChevronLeft size={20} color={C.muted}/>
          </button>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:700,letterSpacing:'0.05em',color:C.text}}>💬 MATCH CHAT</div>
            <div style={{fontSize:11,color:C.muted,marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
              {officers.map(o=>o.currentPort.split(',')[0]).join(' ↔ ')}
            </div>
          </div>
        </div>
      </div>
      {!isParticipant&&(
        <div style={{background:C.goldDim,borderBottom:`1px solid ${C.goldBorder}`,padding:'8px 16px',fontSize:12,color:C.gold}}>
          👁 Read-only — you are not part of this match
        </div>
      )}
      <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:2}}>
        {loading?(
          <div style={{textAlign:'center',padding:40,color:C.muted}}><RefreshCw size={18} style={{animation:'spin 0.8s linear infinite'}}/></div>
        ):messages.length===0?(
          <div style={{textAlign:'center',padding:40,color:C.muted}}>
            <div style={{fontSize:28,marginBottom:8}}>💬</div>
            <div style={{fontWeight:600,marginBottom:4,color:C.text}}>No messages yet</div>
            <div style={{fontSize:12}}>{isParticipant?'Start coordinating below':'Nothing yet'}</div>
          </div>
        ):(
          messages.map((msg,i)=>{
            const isMe=currentUser&&msg.senderId===currentUser.id;
            const showName=i===0||messages[i-1].senderId!==msg.senderId;
            const showTime=i===messages.length-1||messages[i+1].senderId!==msg.senderId;
            return(
              <div key={msg.id} className="slide-up" style={{display:'flex',flexDirection:'column',alignItems:isMe?'flex-end':'flex-start',marginTop:showName&&i>0?10:2}}>
                {showName&&!isMe&&<div style={{fontSize:11,fontWeight:600,color:C.subtle,marginBottom:3,marginLeft:4}}>{msg.senderName}</div>}
                <div style={{maxWidth:'78%',padding:'9px 13px',borderRadius:isMe?'14px 14px 4px 14px':'14px 14px 14px 4px',
                  background:isMe?C.greenDim:C.surface2,
                  border:`1px solid ${isMe?C.greenBorder:C.border}`,
                  fontSize:14,color:C.text,lineHeight:1.5,wordBreak:'break-word'}}>
                  {msg.text}
                </div>
                {showTime&&<div style={{fontSize:10,color:C.muted,marginTop:3,marginLeft:isMe?0:4,marginRight:isMe?4:0}}>{formatMsgTime(msg.createdAt)}</div>}
              </div>
            );
          })
        )}
        <div ref={bottomRef}/>
      </div>
      <div style={{padding:'10px 12px',borderTop:`1px solid ${C.border}`,background:C.surface,display:'flex',gap:8,alignItems:'flex-end',flexShrink:0,paddingBottom:'max(10px, env(safe-area-inset-bottom))'}}>
        {isParticipant?(
          <>
            <textarea ref={inputRef} value={text} onChange={e=>setText(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend();}}}
              placeholder="Type a message… (Enter to send)" rows={1}
              style={{...inp(C),resize:'none',padding:'10px 13px',lineHeight:1.5,flex:1,maxHeight:100,overflowY:'auto'}}/>
            <button onClick={handleSend} disabled={!text.trim()||sending}
              style={{background:text.trim()?C.green:'rgba(100,100,100,0.2)',border:'none',borderRadius:10,color:'#fff',padding:'10px 14px',cursor:text.trim()?'pointer':'default',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'background 0.15s'}}>
              <Send size={16}/>
            </button>
          </>
        ):(
          <div style={{flex:1,textAlign:'center',fontSize:13,color:C.muted,padding:'8px 0'}}>
            Read-only — not a participant in this match
          </div>
        )}
      </div>
    </div>
  );
}

// ── Match Card (formerly Chain Card) ─────────────────────────────────────────
function MatchCard({officers,type,chainLocks={},onLock,onUnlock,myListing,currentUser,priorityRank,unreadMsgs=0,onOpenChat,isAdmin=false}){
  const C=useC();
  const now=Date.now();
  const lockState=officers.map(o=>{
    const lock=chainLocks[o.id];
    const active=lock&&new Date(lock.expiresAt).getTime()>now;
    return{officer:o,lock,active};
  });
  const lockedCount=lockState.filter(s=>s.active).length;
  const allLocked=lockedCount===officers.length;
  const isMyMatch=myListing&&officers.some(o=>o.id===myListing.id);
  const isParticipant=isMyMatch;
  const rankColor=priorityRank===1?C.green:priorityRank===2?C.gold:C.muted;
  const rankBg=priorityRank===1?C.greenDim:priorityRank===2?C.goldDim:'transparent';
  const rankBorder=priorityRank===1?C.greenBorder:priorityRank===2?C.goldBorder:C.border;

  return(
    <div className="fade-in" style={{background:allLocked?C.greenDim:C.surface,border:`1px solid ${allLocked?C.greenBorder:isMyMatch?C.blueBorder:type===3?C.goldBorder:C.border}`,borderRadius:10,marginBottom:12,overflow:'hidden'}}>
      <div style={{padding:'12px 14px 10px',borderBottom:`1px solid ${allLocked?C.greenBorder:C.border}`}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <Link2 size={11} color={type===3?C.gold:C.green}/>
            <span style={{fontSize:11,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:type===3?C.gold:C.green}}>
              {type===2?'Direct 2-Way Match':'3-Way Chain Match'}
            </span>
            {isMyMatch&&<span style={{fontSize:10,fontWeight:700,color:C.blue,background:C.blueDim,border:`1px solid ${C.blueBorder}`,borderRadius:3,padding:'1px 5px'}}>YOURS</span>}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontSize:10,fontWeight:800,color:rankColor,background:rankBg,border:`1px solid ${rankBorder}`,borderRadius:4,padding:'2px 7px'}}>
              {priorityRank===1?'⭐ #1':`#${priorityRank}`}
            </span>
            <span style={{fontSize:11,color:allLocked?C.green:C.muted,fontWeight:allLocked?700:400}}>{lockedCount}/{officers.length} 🔒</span>
          </div>
        </div>
        <div style={{display:'flex',gap:3}}>
          {Array.from({length:officers.length}).map((_,i)=>(
            <div key={i} style={{height:3,flex:1,borderRadius:2,background:i<lockedCount?C.green:C.border,transition:'background 0.3s'}}/>
          ))}
        </div>
      </div>
      {allLocked&&(
        <div style={{padding:'10px 14px',background:C.greenDim,borderBottom:`1px solid ${C.greenBorder}`,display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:20}}>✅</span>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:C.green}}>All parties locked in</div>
            <div style={{fontSize:11,color:C.subtle,marginTop:1}}>Use the chat below to coordinate, then initiate HR</div>
          </div>
        </div>
      )}
      <div style={{padding:'10px 14px',display:'flex',flexDirection:'column',gap:6}}>
        {lockState.map(({officer,lock,active},i)=>{
          const countdown=active?formatCountdown(lock.expiresAt):null;
          const soonExpire=active&&(new Date(lock.expiresAt).getTime()-now)<4*3600000;
          const isMyRow=currentUser&&officer.userId===currentUser.id;
          return(
            <div key={officer.id}>
              <div style={{background:active?C.greenDim:C.surface2,border:`1px solid ${active?C.greenBorder:'transparent'}`,borderRadius:8,padding:'10px 12px',transition:'background 0.2s'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:isMyRow?8:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:7}}>
                    <div style={{width:7,height:7,borderRadius:'50%',background:active?C.green:C.muted,flexShrink:0}}/>
                    <div>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <span style={{fontSize:12,color:C.red,fontWeight:600}}>{officer.currentPort.split(',')[0]}</span>
                        <ArrowRight size={10} color={C.muted}/>
                        <span style={{fontSize:12,color:C.green}}>{officers[(i+1)%officers.length].currentPort.split(',')[0]}</span>
                      </div>
                      <div style={{fontSize:10,color:C.muted,marginTop:2}}>⏳ Since {formatDate(officer.createdAt)}</div>
                      {(isParticipant||isAdmin)&&<div style={{fontSize:11,color:C.subtle,marginTop:1}}>📬 {officer.contact}</div>}
                    </div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:3}}>
                    {officer.gsLevel&&<span style={{fontSize:10,fontWeight:700,color:C.purple,background:C.purpleDim,border:`1px solid ${C.purpleBorder}`,borderRadius:3,padding:'1px 5px'}}>{officer.gsLevel}</span>}
                    {officer.status&&<span style={{fontSize:10,fontWeight:700,color:C.gold,background:C.goldDim,border:`1px solid ${C.goldBorder}`,borderRadius:3,padding:'1px 5px'}}>{officer.status}</span>}
                  </div>
                </div>
                {isMyRow&&(
                  active?(
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8}}>
                      <div style={{display:'flex',alignItems:'center',gap:5}}>
                        <Lock size={10} color={soonExpire?C.gold:C.green}/>
                        <span style={{fontSize:11,color:soonExpire?C.gold:C.green,fontWeight:500}}>{countdown||'Expiring…'}</span>
                      </div>
                      <button onClick={()=>{if(window.confirm('Release your lock?'))onUnlock(officer.id);}}
                        style={{background:'none',border:`1px solid ${C.border}`,borderRadius:5,color:C.muted,fontSize:11,padding:'3px 9px',cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>
                        Release
                      </button>
                    </div>
                  ):(
                    <button onClick={()=>{if(window.confirm('Lock in? This signals you are ready to proceed. Hold expires in 48 hours.'))onLock(officer.id);}}
                      style={{width:'100%',marginTop:8,background:C.greenDim,border:`1px solid ${C.greenBorder}`,borderRadius:6,color:C.green,fontSize:12,fontWeight:600,padding:'7px',cursor:'pointer',fontFamily:"'Inter',sans-serif",display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                      <Lock size={11}/>Lock In (My Confirmation)
                    </button>
                  )
                )}
                {!isMyRow&&active&&(
                  <div style={{marginTop:6,fontSize:11,color:C.green,display:'flex',alignItems:'center',gap:4}}>
                    <Lock size={10}/>{countdown||'Locked in'}
                  </div>
                )}
                {!isMyRow&&!active&&(
                  <div style={{marginTop:6,fontSize:11,color:C.muted}}>Awaiting their confirmation…</div>
                )}
              </div>
              {i<officers.length-1&&<div style={{display:'flex',justifyContent:'center',padding:'3px 0'}}><ArrowRight size={12} color={C.muted}/></div>}
            </div>
          );
        })}
      </div>
      {(isParticipant||isAdmin)&&(
      <div style={{padding:'0 14px 12px'}}>
        <button onClick={onOpenChat}
          style={{width:'100%',background:C.blueDim,border:`1px solid ${C.blueBorder}`,borderRadius:8,color:C.blue,fontSize:13,fontWeight:600,padding:'9px',cursor:'pointer',fontFamily:"'Inter',sans-serif",display:'flex',alignItems:'center',justifyContent:'center',gap:7}}>
          <MessageSquare size={14}/>Open Match Chat
          {unreadMsgs>0&&<span style={{background:C.red,color:'#fff',borderRadius:20,padding:'1px 7px',fontSize:11,fontWeight:700,marginLeft:4}}>{unreadMsgs} new</span>}
        </button>
      </div>
      )}
    </div>
  );
}

// ── Support Chat ──────────────────────────────────────────────────────────────
function SupportChat({session,messages,loading,currentUser,isAdmin,onSend,onClose,onDeleteMessage}){
  const C=useC();
  const [text,setText]=useState('');
  const [sending,setSending]=useState(false);
  const bottomRef=useRef();
  const inputRef=useRef();

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:'smooth'});},[messages]);
  useEffect(()=>{inputRef.current?.focus();},[]);

  async function handleSend(){
    if(!text.trim()||sending) return;
    setSending(true);
    await onSend(text.trim());
    setText('');
    setSending(false);
  }

  return(
    <div style={{position:'fixed',inset:0,zIndex:600,display:'flex',flexDirection:'column',background:C.bg,fontFamily:"'Inter',sans-serif"}}>
      <style>{css}</style>
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
        <div style={{height:'env(safe-area-inset-top)',background:C.surface}}/>
        <div style={{padding:'12px 16px',display:'flex',alignItems:'center',gap:10}}>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:C.muted,padding:4,display:'flex',alignItems:'center'}}>
            <ChevronLeft size={20} color={C.muted}/>
          </button>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:700,letterSpacing:'0.05em',color:C.text}}>
              {isAdmin?`💬 ${session.username}`:'💬 Contact Admin'}
            </div>
            <div style={{fontSize:11,color:C.muted,marginTop:1}}>
              {isAdmin?'Support conversation':'Direct message to admin'}
            </div>
          </div>
        </div>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:2}}>
        {loading?(
          <div style={{textAlign:'center',padding:40,color:C.muted}}><RefreshCw size={18} style={{animation:'spin 0.8s linear infinite'}}/></div>
        ):messages.length===0?(
          <div style={{textAlign:'center',padding:40,color:C.muted}}>
            <div style={{fontSize:28,marginBottom:8}}>💬</div>
            <div style={{fontWeight:600,marginBottom:4,color:C.text}}>{isAdmin?'No messages yet':'Contact Admin'}</div>
            <div style={{fontSize:12}}>{isAdmin?'This user has not sent any messages yet':'Send a message and the admin will reply as soon as possible'}</div>
          </div>
        ):(
          messages.map((msg,i)=>{
            const isMe=currentUser&&msg.senderId===currentUser.id;
            const showName=i===0||messages[i-1].senderId!==msg.senderId;
            const showTime=i===messages.length-1||messages[i+1].senderId!==msg.senderId;
            return(
              <div key={msg.id} className="slide-up" style={{display:'flex',flexDirection:'column',alignItems:isMe?'flex-end':'flex-start',marginTop:showName&&i>0?10:2}}>
                {showName&&!isMe&&<div style={{fontSize:11,fontWeight:600,color:C.subtle,marginBottom:3,marginLeft:4}}>{isAdmin?msg.senderName:'Admin'}</div>}
                <div style={{maxWidth:'78%',padding:'9px 13px',borderRadius:isMe?'14px 14px 4px 14px':'14px 14px 14px 4px',
                  background:isMe?C.greenDim:C.surface2,border:`1px solid ${isMe?C.greenBorder:C.border}`,
                  fontSize:14,color:C.text,lineHeight:1.5,wordBreak:'break-word'}}>
                  {msg.text}
                </div>
                {showTime&&<div style={{fontSize:10,color:C.muted,marginTop:3,marginLeft:isMe?0:4,marginRight:isMe?4:0}}>{formatMsgTime(msg.createdAt)}</div>}
              </div>
            );
          })
        )}
        <div ref={bottomRef}/>
      </div>
      <div style={{padding:'10px 12px',borderTop:`1px solid ${C.border}`,background:C.surface,display:'flex',gap:8,alignItems:'flex-end',flexShrink:0,paddingBottom:'max(10px,env(safe-area-inset-bottom))'}}>
        <textarea ref={inputRef} value={text} onChange={e=>setText(e.target.value)}
          onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend();}}}
          placeholder={isAdmin?`Reply to ${session.username}…`:'Type your message… (Enter to send)'} rows={1}
          style={{...inp(C),resize:'none',padding:'10px 13px',lineHeight:1.5,flex:1,maxHeight:100,overflowY:'auto'}}/>
        <button onClick={handleSend} disabled={!text.trim()||sending}
          style={{background:text.trim()?C.green:'rgba(100,100,100,0.2)',border:'none',borderRadius:10,color:'#fff',padding:'10px 14px',cursor:text.trim()?'pointer':'default',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'background 0.15s'}}>
          <Send size={16}/>
        </button>
      </div>
    </div>
  );
}

// ── Support Inbox (admin only) ─────────────────────────────────────────────────
function SupportInbox({threads,currentUser,onOpen,onClose,onDeleteThread}){
  const C=useC();
  return(
    <div style={{position:'fixed',inset:0,zIndex:500,display:'flex',flexDirection:'column',background:C.bg,fontFamily:"'Inter',sans-serif"}}>
      <style>{css}</style>
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
        <div style={{height:'env(safe-area-inset-top)',background:C.surface}}/>
        <div style={{padding:'12px 18px',display:'flex',alignItems:'center',gap:12}}>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:C.muted,padding:4,display:'flex',alignItems:'center'}}>
            <ChevronLeft size={20} color={C.muted}/>
          </button>
          <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:700,letterSpacing:'0.05em',color:C.text}}>SUPPORT INBOX</span>
          <span style={{fontSize:11,color:C.muted,marginLeft:4}}>{threads.length} conversation{threads.length!==1?'s':''}</span>
        </div>
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        {threads.length===0?(
          <div style={{textAlign:'center',padding:60,color:C.muted}}>
            <div style={{fontSize:36,marginBottom:10}}>📭</div>
            <div style={{fontWeight:600,fontSize:15,color:C.text,marginBottom:4}}>No support messages</div>
            <div style={{fontSize:13}}>User messages will appear here</div>
          </div>
        ):(
          threads.map(t=>(
            <div key={t.chainKey} style={{padding:'14px 18px',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',gap:12}}>
              <div onClick={()=>onOpen(t.chainKey,t.username)} style={{display:'flex',alignItems:'center',gap:12,flex:1,cursor:'pointer',minWidth:0}}>
                <div style={{width:40,height:40,borderRadius:'50%',background:C.greenDim,border:`1px solid ${C.greenBorder}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <User size={18} color={C.green}/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:14,color:C.text}}>{t.username}</div>
                  <div style={{fontSize:12,color:C.muted,marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.latest.text}</div>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <div style={{fontSize:11,color:C.muted}}>{formatTime(t.latest.created_at)}</div>
                </div>
              </div>
              <button onClick={()=>{if(window.confirm(`Delete entire conversation with ${t.username}?`))onDeleteThread(t.chainKey);}}
                style={{background:'none',border:'none',cursor:'pointer',color:C.muted,padding:4,flexShrink:0}}>
                <Trash2 size={14}/>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Admin Panel (user management) ────────────────────────────────────────────
function AdminPanel({onClose,currentUser}){
  const C=useC();
  const [users,setUsers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [tempPass,setTempPass]=useState('');
  const [resetDone,setResetDone]=useState(false);

  useEffect(()=>{ loadUsers(); },[]);

  async function loadUsers(){
    setLoading(true);
    const {data}=await supabase.from('users').select('id,username,created_at').order('created_at',{ascending:false});
    setUsers((data||[]).filter(u=>u.username!==currentUser.username));
    setLoading(false);
  }

  async function deleteUser(u){
    if(!window.confirm(`Delete account for ${u.username}? This also removes their listing.`)) return;
    await supabase.from('listings').delete().eq('user_id',u.id);
    await supabase.from('users').delete().eq('id',u.id);
    setUsers(prev=>prev.filter(x=>x.id!==u.id));
  }

  async function resetPassword(u){
    const temp='cbpo'+Math.floor(1000+Math.random()*9000);
    const hash=await hashPassword(u.username,temp);
    await supabase.from('users').update({password_hash:hash}).eq('id',u.id);
    setTempPass(temp);
    setResetDone(true);
  }

  return(
    <div style={{position:'fixed',inset:0,zIndex:500,display:'flex',flexDirection:'column',background:C.bg,fontFamily:"'Inter',sans-serif"}}>
      <style>{css}</style>
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
        <div style={{height:'env(safe-area-inset-top)',background:C.surface}}/>
        <div style={{padding:'12px 18px',display:'flex',alignItems:'center',gap:12}}>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:C.muted,padding:4,display:'flex',alignItems:'center'}}>
            <ChevronLeft size={20} color={C.muted}/>
          </button>
          <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:700,letterSpacing:'0.05em',color:C.text}}>USER MANAGEMENT</span>
          <span style={{fontSize:11,color:C.muted}}>{users.length} users</span>
        </div>
      </div>
      {resetDone&&(
        <div style={{margin:16,background:C.greenDim,border:`1px solid ${C.greenBorder}`,borderRadius:10,padding:14}}>
          <div style={{fontSize:13,fontWeight:700,color:C.green,marginBottom:6}}>✓ Password Reset</div>
          <div style={{fontSize:13,color:C.text}}>Temp password: <strong style={{fontFamily:'monospace',fontSize:15}}>{tempPass}</strong></div>
          <div style={{fontSize:12,color:C.muted,marginTop:4}}>Share this with the user. They should change it after logging in.</div>
          <button onClick={()=>{setResetDone(false);setTempPass('');}}
            style={{marginTop:10,background:'none',border:`1px solid ${C.border}`,borderRadius:6,color:C.muted,fontSize:12,padding:'5px 12px',cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>
            Done
          </button>
        </div>
      )}
      <div style={{flex:1,overflowY:'auto'}}>
        {loading?(
          <div style={{textAlign:'center',padding:60,color:C.muted}}><RefreshCw size={18} style={{animation:'spin 0.8s linear infinite'}}/></div>
        ):users.length===0?(
          <div style={{textAlign:'center',padding:60,color:C.muted}}>
            <div style={{fontSize:32,marginBottom:10}}>👥</div>
            <div style={{fontWeight:600,color:C.text,marginBottom:4}}>No users yet</div>
            <div style={{fontSize:13}}>Registered users will appear here</div>
          </div>
        ):(
          users.map(u=>(
            <div key={u.id} style={{padding:'14px 18px',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:36,height:36,borderRadius:'50%',background:C.surface2,border:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <User size={16} color={C.muted}/>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:14,color:C.text}}>{u.username}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:2}}>Joined {formatDate(u.created_at)}</div>
              </div>
              <div style={{display:'flex',gap:6,flexShrink:0}}>
                <button onClick={()=>resetPassword(u)}
                  style={{background:C.blueDim,border:`1px solid ${C.blueBorder}`,borderRadius:6,color:C.blue,fontSize:11,fontWeight:600,padding:'5px 10px',cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>
                  Reset PW
                </button>
                <button onClick={()=>deleteUser(u)}
                  style={{background:C.redDim,border:`1px solid ${C.redBorder}`,borderRadius:6,color:C.red,fontSize:11,fontWeight:600,padding:'5px 10px',cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Post Form ─────────────────────────────────────────────────────────────────
function PostForm({currentUser,onPosted,onCancel}){
  const C=useC();
  const [form,setForm]=useState({currentPort:'',desiredPorts:[],contact:'',notes:'',gsLevel:'',status:''});
  const [postStatus,setPostStatus]=useState(null);

  async function submit(){
    if(!form.currentPort||!form.desiredPorts.length||!form.contact.trim()){
      setPostStatus('error');setTimeout(()=>setPostStatus(null),2500);return;
    }
    setPostStatus('saving');
    const row={id:uuid(),name:currentUser.username,current_port:form.currentPort,desired_ports:form.desiredPorts,contact:form.contact.trim(),notes:form.notes.trim(),gs_level:form.gsLevel,status:form.status,user_id:currentUser.id};
    const {error}=await supabase.from('listings').insert([row]);
    if(error){setPostStatus('error');setTimeout(()=>setPostStatus(null),2500);return;}
    setPostStatus('saved');
    setTimeout(()=>onPosted(),1200);
  }

  return(
    <div style={{padding:16,fontFamily:"'Inter',sans-serif"}}>
      <div style={{background:C.goldDim,border:`1px solid ${C.goldBorder}`,borderRadius:8,padding:'10px 14px',marginBottom:18,fontSize:12,color:C.gold,lineHeight:1.5}}>
        ⚠️ Contact info is only visible to officers matched with you. Do not post SSN or badge number.
      </div>
      <div style={{marginBottom:16}}>
        <label style={{display:'block',fontSize:11,fontWeight:600,color:C.muted,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em'}}>GS Level (Optional)</label>
        <select value={form.gsLevel} onChange={e=>setForm(f=>({...f,gsLevel:e.target.value}))}
          style={{...inp(C),cursor:'pointer',appearance:'none'}}>
          <option value=''>Select GS level...</option>
          {['GS-5','GS-6','GS-7','GS-8','GS-9','GS-10','GS-11','GS-12'].map(g=>(
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>
      <div style={{marginBottom:16}}>
        <label style={{display:'block',fontSize:11,fontWeight:600,color:C.muted,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em'}}>Status (Optional)</label>
        <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}
          style={{...inp(C),cursor:'pointer',appearance:'none'}}>
          <option value=''>Select status...</option>
          {['Pre-Academy','FLETC','Post-Academy','Officer'].map(s=>(
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div style={{marginBottom:16}}>
        <Dropdown label="Current Duty Station *" value={form.currentPort} options={PORTS} placeholder="Select your current port..."
          onSelect={p=>setForm(f=>({...f,currentPort:p,desiredPorts:f.desiredPorts.filter(d=>d!==p)}))}/>
      </div>
      <div style={{marginBottom:16}}>
        <Dropdown label={`Desired Station(s) *${form.desiredPorts.length?` — ${form.desiredPorts.length} selected`:''}`}
          options={PORTS.filter(p=>p!==form.currentPort)} placeholder="Select one or more..."
          multi selected={form.desiredPorts}
          onSelect={p=>setForm(f=>({...f,desiredPorts:f.desiredPorts.includes(p)?f.desiredPorts.filter(d=>d!==p):[...f.desiredPorts,p]}))}/>
        {form.desiredPorts.length>0&&(
          <div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:8}}>
            {form.desiredPorts.map(p=><PortTag key={p} label={p} onRemove={()=>setForm(f=>({...f,desiredPorts:f.desiredPorts.filter(d=>d!==p)}))}/>)}
          </div>
        )}
      </div>
      <div style={{marginBottom:16}}>
        <label style={{display:'block',fontSize:11,fontWeight:600,color:C.muted,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em'}}>Contact *</label>
        <input value={form.contact} onChange={e=>setForm(f=>({...f,contact:e.target.value}))} placeholder="Email, Teams handle, or phone" style={inp(C)}/>
      </div>
      <div style={{marginBottom:22}}>
        <label style={{display:'block',fontSize:11,fontWeight:600,color:C.muted,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em'}}>Notes (Optional)</label>
        <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="e.g. Flexible on timing, open to 3-way…" rows={3} style={{...inp(C),resize:'vertical',lineHeight:1.5}}/>
      </div>
      <button onClick={submit} disabled={postStatus==='saving'||postStatus==='saved'}
        style={{width:'100%',border:'none',borderRadius:8,color:'#fff',padding:'13px',fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:"'Inter',sans-serif",
          background:postStatus==='saved'?'#059669':postStatus==='error'?'#dc2626':C.green,transition:'background 0.2s',marginBottom:10}}>
        {postStatus==='saving'?'Posting…':postStatus==='saved'?'✓ Posted!':postStatus==='error'?'Fill required fields':'Post Swap Request'}
      </button>
      {onCancel&&(
        <button onClick={onCancel}
          style={{width:'100%',border:`1px solid ${C.border}`,borderRadius:8,color:C.muted,padding:'11px',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:"'Inter',sans-serif",background:'none'}}>
          Cancel
        </button>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App(){
  const [dark,setDark]=useState(()=>localStorage.getItem('cbpo-dark')==='true');
  const C=dark?DARK:LIGHT;

  const [user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem('cbpo-user'));}catch{return null;}});
  const [screen,setScreen]=useState('main'); // 'main' | 'post'

  const [tab,setTab]=useState('board');
  const [listings,setListings]=useState([]);
  const [locks,setLocks]=useState({});
  const [chains,setChains]=useState({two:[],three:[]});
  const [queuePos,setQueuePos]=useState({});
  const [loading,setLoading]=useState(true);
  const [filter,setFilter]=useState('');

  const [notifs,setNotifs]=useState(()=>{try{return JSON.parse(localStorage.getItem('cbpo-notifs'))||[];}catch{return [];}});
  const [notifPerm,setNotifPerm]=useState('default');
  const [notifPanel,setNotifPanel]=useState(false);
  const [settingsPanel,setSettingsPanel]=useState(false);
  const [bellRing,setBellRing]=useState(false);
  const lastRef=useRef({chainKeys:[],lockCounts:{},allLockedKeys:[],msgCounts:{},supportMsgCount:0});

  const [chatSession,setChatSession]=useState(null);
  const [chatMessages,setChatMessages]=useState([]);
  const [chatLoading,setChatLoading]=useState(false);
  const [unreadChats,setUnreadChats]=useState({});
  const [pendingChat,setPendingChat]=useState(null);
  const realtimeRef=useRef(null);

  // Support chat state
  const [supportSession,setSupportSession]=useState(null); // {chainKey, username}
  const [supportMessages,setSupportMessages]=useState([]);
  const [supportLoading,setSupportLoading]=useState(false);
  const [supportInbox,setSupportInbox]=useState(false);
  const [adminPanel,setAdminPanel]=useState(false);
  const [supportThreads,setSupportThreads]=useState([]); // admin inbox
  const [unreadSupport,setUnreadSupport]=useState(0);
  const supportRealtimeRef=useRef(null);

  const myListing=listings.find(l=>l.userId===user?.id)||null;
  const isAdmin=user?.username===ADMIN;

  // Auto-open chat if tapped from notification
  useEffect(()=>{
    if(pendingChat&&listings.length>0){
      const officers=[...chains.two,...chains.three].find(ofs=>getChainKey(ofs)===pendingChat);
      if(officers){openChat(pendingChat,officers);setPendingChat(null);}
    }
  },[pendingChat,listings,chains]);

  useEffect(()=>{
    if(user){init();if('Notification' in window)setNotifPerm(Notification.permission);}
  },[user]);

  useEffect(()=>{
    const c=computeChains(listings);
    setChains(c);
    setQueuePos(computeQueuePositions(listings));
    if(myListing)checkUnread([...c.two,...c.three],myListing.id);
  },[listings]);

  useEffect(()=>{
    if(!user) return;
    const id=setInterval(poll,POLL_MS);
    return()=>clearInterval(id);
  },[user,myListing,notifs]);

  useEffect(()=>{
    if(!user) return;
    const ch=supabase.channel('board')
      .on('postgres_changes',{event:'*',schema:'public',table:'listings'},()=>fetchListings())
      .on('postgres_changes',{event:'*',schema:'public',table:'locks'},()=>fetchLocks())
      .subscribe();
    return()=>supabase.removeChannel(ch);
  },[user]);

  async function init(){
    setLoading(true);
    await Promise.all([fetchListings(),fetchLocks()]);
    setLoading(false);
  }
  async function fetchListings(){const {data}=await supabase.from('listings').select('*').order('created_at');setListings((data||[]).map(dbToListing));}
  async function fetchLocks(){const {data}=await supabase.from('locks').select('*').gt('expires_at',new Date().toISOString());setLocks(dbToLocks(data||[]));}

  async function checkUnread(allChains,myId){
    const myChains=allChains.filter(officers=>officers.some(o=>o.id===myId));
    const newUnread={};
    for(const officers of myChains){
      const ck=getChainKey(officers);
      const {data:msgs}=await supabase.from('messages').select('id,sender_id,created_at').eq('chain_key',ck);
      if(!msgs?.length) continue;
      const {data:receipt}=await supabase.from('read_receipts').select('read_at').eq('chain_key',ck).eq('user_id',myId).maybeSingle();
      const lastRead=receipt?.read_at;
      const count=msgs.filter(m=>m.sender_id!==myId&&(!lastRead||new Date(m.created_at)>new Date(lastRead))).length;
      if(count>0)newUnread[ck]=count;
    }
    setUnreadChats(prev=>({...prev,...newUnread}));
  }

  async function poll(){
    if(!myListing) return;
    const {data:listData}=await supabase.from('listings').select('*').order('created_at');
    const ls=(listData||[]).map(dbToListing);
    const {data:lockData}=await supabase.from('locks').select('*').gt('expires_at',new Date().toISOString());
    const lk=dbToLocks(lockData||[]);
    const newChains=computeChains(ls);
    const now=Date.now(),myId=myListing.id;
    const myChains=[...newChains.two,...newChains.three].filter(o=>o.some(x=>x.id===myId));
    const last=lastRef.current;
    const newNotifItems=[];
    for(const officers of myChains){
      const ck=getChainKey(officers);
      const currActive=Object.values(lk[ck]||{}).filter(l=>new Date(l.expiresAt).getTime()>now);
      const currCount=currActive.length;
      const prevCount=last.lockCounts?.[ck]||0;
      const wasKnown=last.chainKeys?.includes(ck);
      if(!wasKnown)newNotifItems.push({type:'match_found',title:'New match found!',body:`Your listing matched a ${officers.length}-way swap. Check the Matches tab.`});
      if(wasKnown&&currCount>prevCount)newNotifItems.push({type:'lock_placed',title:'Match updated',body:`${currCount}/${officers.length} officers confirmed.`});
      if(currCount===officers.length&&!last.allLockedKeys?.includes(ck))newNotifItems.push({type:'all_locked',title:'All parties confirmed! 🎉',body:'Everyone is ready. Open the match chat to coordinate.'});
      const {data:msgs}=await supabase.from('messages').select('*').eq('chain_key',ck).order('created_at');
      if(msgs?.length){
        const prev=last.msgCounts?.[ck]||0;
        if(msgs.length>prev&&prev>0){
          const latest=msgs[msgs.length-1];
          if(latest.sender_id!==myId&&(!chatSession||chatSession.chainKey!==ck)){
            newNotifItems.push({type:'new_message',title:'New message in your match',body:`${latest.sender_name}: ${latest.text.slice(0,80)}${latest.text.length>80?'…':''}`,chainKey:ck});
            setUnreadChats(prev=>({...prev,[ck]:(prev[ck]||0)+msgs.length-prev}));
            playMessageSound();
          }
        }
        if(!last.msgCounts)last.msgCounts={};
        last.msgCounts[ck]=msgs.length;
      }
    }
    if(newNotifItems.length>0){
      const stamped=newNotifItems.map(n=>({...n,id:uuid(),createdAt:new Date().toISOString(),read:false}));
      const updated=[...stamped,...notifs];
      setNotifs(updated);
      localStorage.setItem('cbpo-notifs',JSON.stringify(updated));
      setBellRing(true);setTimeout(()=>setBellRing(false),600);
      for(const n of stamped){
        const onClick=n.chainKey?()=>setPendingChat(n.chainKey):null;
        fireNativeNotif(n.title,n.body,onClick);
      }
    }
    // Check support messages
    if(isAdmin){
      const {data:supportMsgs}=await supabase.from('messages').select('chain_key,sender_id,sender_name,text,created_at').ilike('chain_key','support-%').order('created_at',{ascending:false});
      if(supportMsgs?.length){
        const threads={};
        for(const m of supportMsgs){
          const ck=m.chain_key;
          if(!threads[ck]){
            // Extract username from chain_key: support-{userId} — use sender_name of non-admin msg
            const uname=m.sender_name===ADMIN?threads[ck]?.username||'Unknown':m.sender_name;
            threads[ck]={chainKey:ck,username:uname,latest:m,unread:0};
          } else {
            if(m.sender_name!==ADMIN) threads[ck].username=m.sender_name;
          }
        }
        setSupportThreads(Object.values(threads));
        const {data:receipts}=await supabase.from('read_receipts').select('chain_key,read_at').eq('user_id','admin-'+user.id);
        let totalUnread=0;
        for(const t of Object.values(threads)){
          const receipt=receipts?.find(r=>r.chain_key===t.chainKey);
          if(!receipt||new Date(t.latest.created_at)>new Date(receipt.read_at)) totalUnread++;
        }
        setUnreadSupport(totalUnread);
      }
    } else {
      // Check if admin replied to my support chat
      const mySupportKey='support-'+user.id;
      const {data:supportMsgs}=await supabase.from('messages').select('*').eq('chain_key',mySupportKey).order('created_at',{ascending:false}).limit(1);
      if(supportMsgs?.length){
        const latest=supportMsgs[0];
        const lastSupportCount=lastRef.current.supportMsgCount||0;
        if(latest.sender_id!==user.id){
          const {data:allMsgs}=await supabase.from('messages').select('id').eq('chain_key',mySupportKey);
          if((allMsgs?.length||0)>lastSupportCount&&lastSupportCount>0){
            newNotifItems.push({type:'new_message',title:'Admin replied to your message',body:latest.text.slice(0,80)});
            playMessageSound();
          }
          lastRef.current.supportMsgCount=allMsgs?.length||0;
        }
      }
    }

    lastRef.current={
      chainKeys:myChains.map(getChainKey),
      lockCounts:Object.fromEntries(myChains.map(o=>{const ck=getChainKey(o);return[ck,Object.values(lk[ck]||{}).filter(l=>new Date(l.expiresAt).getTime()>now).length];})),
      allLockedKeys:myChains.filter(o=>{const ck=getChainKey(o);return Object.values(lk[ck]||{}).filter(l=>new Date(l.expiresAt).getTime()>now).length===o.length;}).map(getChainKey),
      msgCounts:last.msgCounts||{},
    };
  }

  async function openChat(chainKey,officers){
    const isParticipant=myListing&&officers.some(o=>o.id===myListing.id);
    if(!isParticipant&&!isAdmin){
      alert('This chat is private between matched officers only.');
      return;
    }
    setChatSession({chainKey,officers});setChatLoading(true);
    const {data}=await supabase.from('messages').select('*').eq('chain_key',chainKey).order('created_at');
    const msgs=(data||[]).map(r=>({id:r.id,senderId:r.sender_id,senderName:r.sender_name,text:r.text,createdAt:r.created_at}));
    setChatMessages(msgs);
    setChatLoading(false);
    // Set known count so poll doesn't re-notify
    if(!lastRef.current.msgCounts) lastRef.current.msgCounts={};
    lastRef.current.msgCounts[chainKey]=data?.length||0;
    if(myListing){
      await supabase.from('read_receipts').upsert({chain_key:chainKey,user_id:myListing.id,read_at:new Date().toISOString()});
      setUnreadChats(prev=>({...prev,[chainKey]:0}));
    }
    if(realtimeRef.current)supabase.removeChannel(realtimeRef.current);
    realtimeRef.current=supabase.channel(`chat-${chainKey}`)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:`chain_key=eq.${chainKey}`},payload=>{
        const r=payload.new;
        setChatMessages(prev=>[...prev,{id:r.id,senderId:r.sender_id,senderName:r.sender_name,text:r.text,createdAt:r.created_at}]);
      }).subscribe();
  }
  function closeChat(){if(realtimeRef.current){supabase.removeChannel(realtimeRef.current);realtimeRef.current=null;}setChatSession(null);}
  async function sendMessage(text){
    if(!user||!chatSession) return;
    const msg={id:uuid(),chain_key:chatSession.chainKey,sender_id:user.id,sender_name:user.username,text,created_at:new Date().toISOString()};
    await supabase.from('messages').insert([msg]);
    await supabase.from('read_receipts').upsert({chain_key:chatSession.chainKey,user_id:user.id,read_at:new Date().toISOString()});
  }
  async function lockOfficer(ck,oid){
    const now=new Date(),expires=new Date(now.getTime()+LOCK_MS);
    await supabase.from('locks').upsert({chain_key:ck,officer_id:oid,locked_at:now.toISOString(),expires_at:expires.toISOString()});
    await fetchLocks();
  }
  async function unlockOfficer(ck,oid){
    await supabase.from('locks').delete().eq('chain_key',ck).eq('officer_id',oid);
    await fetchLocks();
  }
  async function removeListing(id){await supabase.from('listings').delete().eq('id',id);}

  async function openSupportChat(chainKey, username){
    setSupportSession({chainKey, username});
    setSupportLoading(true);
    const {data}=await supabase.from('messages').select('*').eq('chain_key',chainKey).order('created_at');
    setSupportMessages((data||[]).map(r=>({id:r.id,senderId:r.sender_id,senderName:r.sender_name,text:r.text,createdAt:r.created_at})));
    setSupportLoading(false);
    // Mark as read
    const readerId=isAdmin?'admin-'+user.id:user.id;
    await supabase.from('read_receipts').upsert({chain_key:chainKey,user_id:readerId,read_at:new Date().toISOString()});
    if(isAdmin) setUnreadSupport(prev=>Math.max(0,prev-1));
    // Realtime
    if(supportRealtimeRef.current) supabase.removeChannel(supportRealtimeRef.current);
    supportRealtimeRef.current=supabase.channel('support-'+chainKey)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:`chain_key=eq.${chainKey}`},payload=>{
        const r=payload.new;
        setSupportMessages(prev=>[...prev,{id:r.id,senderId:r.sender_id,senderName:r.sender_name,text:r.text,createdAt:r.created_at}]);
      }).subscribe();
  }

  function closeSupportChat(){
    if(supportRealtimeRef.current){supabase.removeChannel(supportRealtimeRef.current);supportRealtimeRef.current=null;}
    setSupportSession(null);
  }

  async function sendSupportMessage(text){
    if(!user||!supportSession||!text.trim()) return;
    const msg={id:uuid(),chain_key:supportSession.chainKey,sender_id:user.id,sender_name:user.username,text,created_at:new Date().toISOString()};
    const {error}=await supabase.from('messages').insert([msg]);
    if(error){console.error('Support message error:',error.message);alert('Failed to send: '+error.message);return;}
    const readerId=isAdmin?'admin-'+user.id:user.id;
    await supabase.from('read_receipts').upsert({chain_key:supportSession.chainKey,user_id:readerId,read_at:new Date().toISOString()});
  }

  async function loadSupportThreads(){
    if(!isAdmin) return;
    const {data:supportMsgs}=await supabase.from('messages').select('chain_key,sender_id,sender_name,text,created_at').ilike('chain_key','support-%').order('created_at',{ascending:false});
    if(supportMsgs?.length){
      const threads={};
      for(const m of supportMsgs){
        const ck=m.chain_key;
        if(!threads[ck]){
          threads[ck]={chainKey:ck,username:m.sender_name,latest:m};
        }
        if(m.sender_name!==ADMIN) threads[ck].username=m.sender_name;
      }
      setSupportThreads(Object.values(threads));
    }
  }

  async function deleteSupportMessage(msgId){
    await supabase.from('messages').delete().eq('id',msgId);
    setSupportMessages(prev=>prev.filter(m=>m.id!==msgId));
  }

  async function deleteSupportThread(chainKey){
    await supabase.from('messages').delete().eq('chain_key',chainKey);
    setSupportThreads(prev=>prev.filter(t=>t.chainKey!==chainKey));
  }

  function handleLogin(u){setUser(u);localStorage.setItem('cbpo-user',JSON.stringify(u));}
  function handleLogout(){setUser(null);localStorage.removeItem('cbpo-user');setListings([]);setLocks({});setNotifs([]);setSettingsPanel(false);}
  function toggleDark(){const nd=!dark;setDark(nd);localStorage.setItem('cbpo-dark',String(nd));}
  function markAllRead(){const u=notifs.map(n=>({...n,read:true}));setNotifs(u);localStorage.setItem('cbpo-notifs',JSON.stringify(u));}
  function clearAllNotifs(){setNotifs([]);localStorage.setItem('cbpo-notifs',JSON.stringify([]));}
  async function requestNotifPermission(){if('Notification' in window){const p=await Notification.requestPermission();setNotifPerm(p);}}

  const filtered=filter.trim()
    ?listings.filter(l=>l.currentPort.toLowerCase().includes(filter.toLowerCase())||l.desiredPorts.some(p=>p.toLowerCase().includes(filter.toLowerCase()))||(l.gsLevel&&l.gsLevel.toLowerCase().includes(filter.toLowerCase()))||(l.status&&l.status.toLowerCase().includes(filter.toLowerCase())))
    :listings;

  const totalMatches=chains.two.length+chains.three.length;
  const unreadCount=notifs.filter(n=>!n.read).length;
  const totalUnreadChat=Object.values(unreadChats).reduce((a,b)=>a+b,0);

  // ── Render: not logged in ──
  if(!user) return(
    <ThemeCtx.Provider value={C}>
      <AuthScreen onAuth={handleLogin}/>
    </ThemeCtx.Provider>
  );

  // ── Render: welcome / force post ──
  if(!myListing&&screen!=='main'&&screen!=='post'){
    return(
      <ThemeCtx.Provider value={C}>
        <WelcomeScreen user={user} onPost={()=>setScreen('post')} onBrowse={()=>setScreen('main')}/>
      </ThemeCtx.Provider>
    );
  }

  // ── Render: post form full screen ──
  if(screen==='post') return(
    <ThemeCtx.Provider value={C}>
      <div style={{minHeight:'100vh',background:C.bg,fontFamily:"'Inter',sans-serif"}}>
        <style>{css}</style>
        <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`}}>
          <div style={{height:'env(safe-area-inset-top)',background:C.surface}}/>
          <div style={{padding:'12px 18px',display:'flex',alignItems:'center',gap:12}}>
            <button onClick={()=>setScreen(myListing?'main':'welcome')} style={{background:'none',border:'none',cursor:'pointer',color:C.muted,padding:4,display:'flex',alignItems:'center'}}>
              <ChevronLeft size={20} color={C.muted}/>
            </button>
            <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:700,letterSpacing:'0.05em',color:C.text}}>POST YOUR SWAP</span>
          </div>
        </div>
        <PostForm currentUser={user} onPosted={()=>{fetchListings();setScreen('main');setTab('board');}} onCancel={()=>setScreen(myListing?'main':'welcome')}/>
      </div>
    </ThemeCtx.Provider>
  );

  // ── Render: overlays ──
  if(chatSession) return(
    <ThemeCtx.Provider value={C}>
      <ChatPanel chainKey={chatSession.chainKey} officers={chatSession.officers} messages={chatMessages}
        loading={chatLoading} currentUser={user} myListing={myListing} onSend={sendMessage} onClose={closeChat}/>
    </ThemeCtx.Provider>
  );
  if(settingsPanel) return(
    <ThemeCtx.Provider value={C}>
      <SettingsPanel user={user} onClose={()=>setSettingsPanel(false)} dark={dark} onToggleDark={toggleDark} onLogout={handleLogout}
        onContactAdmin={()=>{setSettingsPanel(false);openSupportChat('support-'+user.id,user.username);}}
        isAdmin={isAdmin}/>
    </ThemeCtx.Provider>
  );
  if(notifPanel) return(
    <ThemeCtx.Provider value={C}>
      <NotifPanel notifs={notifs} onClose={()=>setNotifPanel(false)} onMarkAllRead={markAllRead} onClearAll={clearAllNotifs}
        notifPerm={notifPerm} onRequestPerm={requestNotifPermission}
        onOpenChat={ck=>{setNotifPanel(false);setPendingChat(ck);}}/>
    </ThemeCtx.Provider>
  );

  // ── Render: admin panel ──
  if(adminPanel) return(
    <ThemeCtx.Provider value={C}>
      <AdminPanel onClose={()=>setAdminPanel(false)} currentUser={user}/>
    </ThemeCtx.Provider>
  );

  // ── Render: support chat ──
  if(supportSession) return(
    <ThemeCtx.Provider value={C}>
      <SupportChat session={supportSession} messages={supportMessages} loading={supportLoading}
        currentUser={user} isAdmin={isAdmin} onSend={sendSupportMessage} onClose={closeSupportChat}
        onDeleteMessage={deleteSupportMessage}/>
    </ThemeCtx.Provider>
  );

  // ── Render: support inbox (admin) ──
  if(supportInbox) return(
    <ThemeCtx.Provider value={C}>
      <SupportInbox threads={supportThreads} currentUser={user} onOpen={(ck,un)=>{setSupportInbox(false);openSupportChat(ck,un);}} onClose={()=>setSupportInbox(false)} onDeleteThread={deleteSupportThread}/>
    </ThemeCtx.Provider>
  );

  // ── Render: main app ──
  return(
    <ThemeCtx.Provider value={C}>
      <div style={{minHeight:'100vh',background:C.bg,fontFamily:"'Inter',sans-serif",color:C.text}}>
        <style>{css}</style>

        {/* Header */}
        <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,position:'sticky',top:0,zIndex:100}}>
          <div style={{height:'env(safe-area-inset-top)',background:C.surface}}/>
          <div style={{padding:'12px 18px',display:'flex',alignItems:'center',gap:12}}>
            <div style={{background:'#000',borderRadius:10,width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <Shield size={18} color="silver"/>
            </div>
            <div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:17,fontWeight:800,letterSpacing:'0.06em',lineHeight:1,color:C.text}}>CBPO SWAP BOARD</div>
              <div style={{fontSize:10,color:C.muted,marginTop:1,display:'flex',alignItems:'center',gap:4}}>
                @{user.username}
                {isAdmin&&<span style={{fontSize:9,fontWeight:700,color:'#fff',background:C.red,borderRadius:3,padding:'0px 4px'}}>ADMIN</span>}
              </div>
            </div>
            <div style={{marginLeft:'auto',display:'flex',gap:6,alignItems:'center'}}>
              {totalMatches>0&&<div style={{background:C.goldDim,border:`1px solid ${C.goldBorder}`,borderRadius:20,padding:'3px 9px',fontSize:11,fontWeight:700,color:C.gold}}>{totalMatches} MATCH{totalMatches!==1?'ES':''}</div>}
              {totalUnreadChat>0&&<div style={{background:C.purpleDim,border:`1px solid ${C.purpleBorder}`,borderRadius:20,padding:'3px 9px',fontSize:11,fontWeight:700,color:C.purple,display:'flex',alignItems:'center',gap:4}}><MessageSquare size={9}/>{totalUnreadChat}</div>}
              <button onClick={()=>setNotifPanel(true)} style={{background:'none',border:'none',cursor:'pointer',padding:4,position:'relative',display:'flex',color:unreadCount>0?C.green:C.muted}}>
                <Bell size={18} className={bellRing?'bell-ring':''}/>
                {unreadCount>0&&<span style={{position:'absolute',top:-2,right:-2,background:C.red,color:'#fff',borderRadius:'50%',width:16,height:16,fontSize:10,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>{unreadCount>9?'9+':unreadCount}</span>}
              </button>
              <button onClick={()=>setSettingsPanel(true)} style={{background:'none',border:'none',cursor:'pointer',padding:4,display:'flex',color:C.muted}}>
                <User size={18}/>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,display:'flex'}}>
          <button onClick={()=>setTab('board')} className="tab"
            style={{flex:1,background:'none',border:'none',borderBottom:tab==='board'?`2px solid ${C.green}`:'2px solid transparent',color:tab==='board'?C.green:C.muted,padding:'11px 6px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>
            Board ({listings.length})
          </button>
          <button onClick={()=>setTab('matches')} className="tab"
            style={{flex:1,background:'none',border:'none',borderBottom:tab==='matches'?`2px solid ${C.green}`:'2px solid transparent',color:tab==='matches'?C.green:C.muted,padding:'11px 6px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>
            Matches{totalMatches?` (${totalMatches})`:''}
          </button>
          {isAdmin&&(
            <button onClick={()=>{setSupportInbox(true);loadSupportThreads();}} className="tab"
              style={{flex:1,background:'none',border:'none',borderBottom:'2px solid transparent',color:C.purple,padding:'11px 6px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>
              Support{unreadSupport>0?` (${unreadSupport})`:''}
            </button>
          )}
          {isAdmin&&(
            <button onClick={()=>setAdminPanel(true)} className="tab"
              style={{flex:1,background:'none',border:'none',borderBottom:'2px solid transparent',color:C.red,padding:'11px 6px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>
              Users
            </button>
          )}
        </div>

        {/* BOARD */}
        {tab==='board'&&(
          <div>
            {/* Search + Post button */}
            <div style={{padding:'12px 16px',display:'flex',gap:8,alignItems:'center',borderBottom:`1px solid ${C.border}`,background:C.surface}}>
              <div style={{position:'relative',flex:1}}>
                <Search size={13} color={C.muted} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
                <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Search port or GS level…"
                  style={{...inp(C),paddingLeft:32,padding:'8px 12px 8px 32px',fontSize:14}}/>
              </div>
              {!myListing&&(
                <button onClick={()=>setScreen('post')}
                  style={{background:C.green,border:'none',borderRadius:8,color:'#fff',padding:'8px 14px',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'Inter',sans-serif",whiteSpace:'nowrap'}}>
                  + Post
                </button>
              )}
            </div>

            {/* No listing banner */}
            {!myListing&&(
              <div style={{margin:'12px 16px',background:C.blueDim,border:`1px solid ${C.blueBorder}`,borderRadius:9,padding:'12px 14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontSize:13,color:C.blue}}>You haven't posted a swap yet</div>
                <button onClick={()=>setScreen('post')} style={{background:C.blue,border:'none',borderRadius:6,color:'#fff',fontSize:12,fontWeight:600,padding:'5px 12px',cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>Post now</button>
              </div>
            )}

            {loading?(
              <div style={{textAlign:'center',padding:60,color:C.muted}}><RefreshCw size={20} style={{animation:'spin 0.8s linear infinite'}}/></div>
            ):filtered.length===0?(
              <div style={{textAlign:'center',padding:60,color:C.muted}}>
                <div style={{fontSize:36,marginBottom:10}}>📋</div>
                <div style={{fontWeight:600,fontSize:15,marginBottom:4,color:C.text}}>{filter?'No results':'No listings yet'}</div>
                <div style={{fontSize:13}}>{filter?'Try a different search':'Be the first to post'}</div>
              </div>
            ):(
              <div style={{background:C.surface}}>
                {/* Column headers */}
                <div style={{padding:'6px 16px',display:'flex',alignItems:'center',gap:8,background:C.surface2,borderBottom:`1px solid ${C.border}`}}>
                  <div style={{width:28,fontSize:10,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:'0.05em'}}>#</div>
                  <div style={{flex:1,fontSize:10,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:'0.05em'}}>Route & Details</div>
                </div>
                {filtered.map(l=>{
                  const isOwn=user&&l.userId===user.id;
                  const canDelete=isOwn||isAdmin;
                  const myQueueNums=Object.values(queuePos[l.id]||{});
                  const qNum=myQueueNums.length>0?Math.min(...myQueueNums):'?';
                  return(
                    <div key={l.id} style={{display:'flex',alignItems:'center',padding:'10px 16px',borderBottom:`1px solid ${C.border}`,background:isOwn?C.greenDim:'transparent'}}>
                      <div style={{width:28,fontSize:13,fontWeight:700,color:isOwn?C.green:C.muted,flexShrink:0}}>#{qNum}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:5,flexWrap:'wrap'}}>
                          <span style={{fontSize:13,fontWeight:600,color:C.red}}>{l.currentPort.split(',')[0]}</span>
                          <ArrowRight size={10} color={C.muted}/>
                          <span style={{fontSize:13,color:C.green}}>{l.desiredPorts.map(p=>p.split(',')[0]).join(', ')}</span>
                        </div>
                        {isAdmin&&<div style={{fontSize:12,color:C.text,fontWeight:500,marginTop:2}}>{l.name} · 📬 {l.contact}</div>}
                        <div style={{display:'flex',gap:6,marginTop:3,alignItems:'center',flexWrap:'wrap'}}>
                          {l.gsLevel&&<span style={{fontSize:10,fontWeight:700,color:C.purple}}>{l.gsLevel}</span>}
                          {l.status&&<span style={{fontSize:10,fontWeight:600,color:C.gold}}>{l.status}</span>}
                          
                          
                          <span style={{fontSize:10,color:C.muted}}>{formatDate(l.createdAt)}</span>
                        </div>
                      </div>
                      <div style={{display:'flex',gap:4,flexShrink:0}}>
                        {isOwn&&<button onClick={()=>setScreen('post')} style={{background:'none',border:`1px solid ${C.border}`,borderRadius:5,cursor:'pointer',color:C.muted,padding:'4px 8px',fontSize:11,fontFamily:"'Inter',sans-serif"}}>Edit</button>}
                        {canDelete&&<button onClick={()=>{if(window.confirm('Remove this listing?'))removeListing(l.id);}}
                          style={{background:'none',border:'none',cursor:'pointer',color:C.muted,padding:4}}>
                          <Trash2 size={13}/>
                        </button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MATCHES */}
        {tab==='matches'&&(
          <div style={{padding:16}}>
            {chains.two.length===0&&chains.three.length===0?(
              <div style={{textAlign:'center',padding:60,color:C.muted}}>
                <div style={{fontSize:36,marginBottom:10}}>🔗</div>
                <div style={{fontWeight:600,fontSize:15,marginBottom:4,color:C.text}}>No matches yet</div>
                <div style={{fontSize:13}}>Matches appear automatically when listings align</div>
              </div>
            ):(
              <>
                {sortByPriority([...chains.two,...chains.three]).map((officers,i)=>{
                  const ck=getChainKey(officers);
                  const type=officers.length;
                  return<MatchCard key={ck} officers={officers} type={type} chainLocks={locks[ck]||{}} myListing={myListing} currentUser={user}
                    priorityRank={i+1} unreadMsgs={unreadChats[ck]||0} isAdmin={isAdmin}
                    onLock={oid=>lockOfficer(ck,oid)} onUnlock={oid=>unlockOfficer(ck,oid)}
                    onOpenChat={()=>openChat(ck,officers)}/>;
                })}
              </>
            )}
          </div>
        )}

        <div style={{padding:'14px 18px',textAlign:'center',fontSize:11,color:C.muted,borderTop:`1px solid ${C.border}`,marginTop:16,paddingBottom:'max(14px, env(safe-area-inset-bottom))'}}>
          Unofficial peer tool — verify all swaps through official CBP HR channels.
        </div>
      </div>
    </ThemeCtx.Provider>
  );
}
