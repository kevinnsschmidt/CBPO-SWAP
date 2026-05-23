import { useState, useEffect, useRef } from 'react';
import { Search, ArrowRight, Trash2, Check, ChevronDown, Shield, RefreshCw,
         X, Link2, Lock, Bell, ChevronLeft, Send, MessageSquare } from 'lucide-react';
import { supabase } from './supabase';

// ── Constants ──────────────────────────────────────────────────────────────────
const PORTS = [
  'Anchorage, AK','Atlanta, GA','Baltimore/Washington, MD','Boston, MA',
  'Brownsville, TX','Buffalo, NY','Calais, ME','Calexico, CA',
  "Chicago O'Hare, IL",'Dallas/Fort Worth, TX','Del Rio, TX','Denver, CO',
  'Detroit, MI','Douglas, AZ','Eagle Pass, TX','El Paso, TX',
  'Hidalgo/Pharr, TX','Honolulu, HI','Houston, TX','JFK, NY',
  'Laredo, TX','Los Angeles, CA','Louisville, KY','McAllen, TX',
  'Memphis, TN','Miami, FL','Minneapolis, MN','Nashville, TN',
  'Newark, NJ','New Orleans, LA','Nogales, AZ','Orlando, FL',
  'Philadelphia, PA','Phoenix, AZ','Portland, OR','Presidio, TX',
  'San Antonio, TX','San Diego, CA','San Francisco, CA','San Juan, PR',
  'Seattle, WA','Tampa, FL','Tucson, AZ','Washington Dulles, VA','Yuma, AZ',
].sort();

const LOCK_MS = 48 * 60 * 60 * 1000;
const POLL_MS = 60 * 1000;

// ── Colors ────────────────────────────────────────────────────────────────────
const C = {
  bg:'#080d16', surface:'#0f1623', surface2:'#162030', border:'#1c2b3a',
  green:'#10b981', greenDim:'rgba(16,185,129,0.10)', greenBorder:'rgba(16,185,129,0.28)',
  gold:'#f59e0b',  goldDim:'rgba(245,158,11,0.10)',  goldBorder:'rgba(245,158,11,0.28)',
  red:'#f87171',   redDim:'rgba(248,113,113,0.10)',  redBorder:'rgba(248,113,113,0.28)',
  blue:'#60a5fa',  blueDim:'rgba(96,165,250,0.10)',  blueBorder:'rgba(96,165,250,0.25)',
  purple:'#a78bfa',purpleDim:'rgba(167,139,250,0.10)',purpleBorder:'rgba(167,139,250,0.25)',
  text:'#dde4ee', muted:'#4a6080', subtle:'#8ba3bf',
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Inter:wght@400;500;600&display=swap');
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
  html,body{overscroll-behavior:none;}
  body{margin:0;background:${C.bg};}
  ::-webkit-scrollbar{width:3px;}
  ::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px;}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.55}}
  @keyframes bellRing{0%,100%{transform:rotate(0)}20%{transform:rotate(-15deg)}40%{transform:rotate(15deg)}60%{transform:rotate(-10deg)}80%{transform:rotate(10deg)}}
  .fade-in{animation:fadeIn 0.18s ease}
  .slide-up{animation:slideUp 0.2s ease}
  .card{transition:border-color 0.15s,box-shadow 0.15s;}
  .card:hover{box-shadow:0 2px 14px rgba(0,0,0,0.35)}
  .tab{transition:color 0.15s,border-color 0.15s;}
  .row-hover:hover{background:rgba(255,255,255,0.03)}
  .btn-lock{transition:background 0.15s;}
  .btn-lock:hover{background:rgba(16,185,129,0.18)!important;}
  .btn-release:hover{background:rgba(248,113,113,0.1)!important;border-color:rgba(248,113,113,0.3)!important;color:${C.red}!important;}
  .all-locked-pulse{animation:pulse 2s ease-in-out infinite;}
  .bell-ring{animation:bellRing 0.5s ease;}
  .chat-btn:hover{background:rgba(96,165,250,0.18)!important;}
  input,textarea{font-family:'Inter',sans-serif;color:${C.text};}
  input::placeholder,textarea::placeholder{color:${C.muted};}
  input:focus,textarea:focus{outline:none;border-color:${C.green}!important;}
  .msg-input:focus{border-color:${C.blue}!important;}
  /* Safe area for iPhone notch / home bar */
  .safe-top{padding-top:env(safe-area-inset-top);}
  .safe-bottom{padding-bottom:env(safe-area-inset-bottom);}
`;

const inp = {
  width:'100%', background:C.surface2, border:`1px solid ${C.border}`,
  borderRadius:8, color:C.text, padding:'10px 14px', fontSize:14,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const uuid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const formatDate = iso => new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
const formatMsgTime = iso => new Date(iso).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true});

function formatTime(iso){
  const ms = Date.now() - new Date(iso).getTime();
  if(ms<60000) return 'just now';
  if(ms<3600000) return `${Math.floor(ms/60000)}m ago`;
  if(ms<86400000) return `${Math.floor(ms/3600000)}h ago`;
  return formatDate(iso);
}
function formatCountdown(expiresAt){
  const ms = new Date(expiresAt).getTime() - Date.now();
  if(ms<=0) return null;
  const h=Math.floor(ms/3600000), m=Math.floor((ms%3600000)/60000);
  return h>=24 ? `${Math.floor(h/24)}d ${h%24}h left` : `${h}h ${m}m left`;
}
const getChainKey = officers => officers.map(o=>o.id).sort().join('|');

// Row from DB → app shape
function dbToListing(row){
  return {
    id: row.id, name: row.name, currentPort: row.current_port,
    desiredPorts: row.desired_ports, contact: row.contact,
    notes: row.notes||'', gsLevel: row.gs_level||'', createdAt: row.created_at,
  };
}
function dbToLocks(rows){
  const locks = {};
  const now = Date.now();
  for(const r of rows){
    if(new Date(r.expires_at).getTime() <= now) continue;
    if(!locks[r.chain_key]) locks[r.chain_key]={};
    locks[r.chain_key][r.officer_id]={lockedAt:r.locked_at, expiresAt:r.expires_at};
  }
  return locks;
}

// Chain detection
function computeChains(ls){
  const two=[], threeKeys=new Set(), three=[];
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
const sortByPriority = arr => [...arr].sort((a,b)=>Math.min(...a.map(o=>new Date(o.createdAt)))-Math.min(...b.map(o=>new Date(o.createdAt))));

function fireNativeNotif(title, body){
  if('Notification' in window && Notification.permission==='granted')
    try{ new Notification(`CBPO Swap Board: ${title}`,{body}); }catch(e){}
}

const NOTIF_META={
  match_found:{icon:'🔗',color:C.gold},
  lock_placed: {icon:'🔒',color:C.blue},
  all_locked:  {icon:'✅',color:C.green},
  lock_expired:{icon:'⏰',color:C.muted},
  new_message: {icon:'💬',color:C.purple},
};

// ── Small UI components ───────────────────────────────────────────────────────
function PortTag({label,onRemove}){
  return(
    <span style={{display:'inline-flex',alignItems:'center',gap:4,background:C.greenDim,border:`1px solid ${C.greenBorder}`,borderRadius:5,padding:'2px 8px',fontSize:12,color:C.green}}>
      {label}{onRemove&&<X size={9} style={{cursor:'pointer',opacity:0.7}} onClick={onRemove}/>}
    </span>
  );
}
function LockProgress({locked,total}){
  return(
    <div style={{display:'flex',gap:3}}>
      {Array.from({length:total}).map((_,i)=>(
        <div key={i} style={{height:3,flex:1,borderRadius:2,background:i<locked?C.green:C.border,transition:'background 0.3s'}}/>
      ))}
    </div>
  );
}
function Dropdown({label,value,options,onSelect,placeholder,multi=false,selected=[]}){
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
      <button onClick={()=>{setOpen(!open);setSearch('');}} style={{...inp,textAlign:'left',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',color:(multi?selected.length:value)?C.text:C.muted}}>
        <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{displayVal}</span>
        <ChevronDown size={13} style={{flexShrink:0,marginLeft:8,color:C.muted,transform:open?'rotate(180deg)':'none',transition:'transform 0.15s'}}/>
      </button>
      {open&&(
        <div className="fade-in" style={{position:'absolute',top:'calc(100% + 4px)',left:0,right:0,background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,zIndex:300,overflow:'hidden',boxShadow:'0 8px 28px rgba(0,0,0,0.6)'}}>
          <div style={{padding:8,borderBottom:`1px solid ${C.border}`}}>
            <input autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." style={{...inp,padding:'7px 10px',fontSize:13}}/>
          </div>
          <div style={{maxHeight:220,overflowY:'auto'}}>
            {filtered.length===0&&<div style={{padding:14,fontSize:13,color:C.muted,textAlign:'center'}}>No results</div>}
            {filtered.map(p=>{
              const isSel=multi?selected.includes(p):value===p;
              return(
                <div key={p} className="row-hover" onClick={()=>{onSelect(p);setOpen(false);}}
                  style={{padding:'9px 14px',fontSize:13,cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',color:isSel?C.green:C.text}}>
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

// ── Chat Panel ────────────────────────────────────────────────────────────────
function ChatPanel({chainKey,officers,messages,loading,myListing,onSend,onClose}){
  const [text,setText]=useState('');
  const [sending,setSending]=useState(false);
  const bottomRef=useRef();
  const inputRef=useRef();
  const isParticipant=myListing&&officers.some(o=>o.id===myListing.id);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}); },[messages]);
  useEffect(()=>{ inputRef.current?.focus(); },[]);

  async function handleSend(){
    if(!text.trim()||sending||!isParticipant) return;
    setSending(true);
    await onSend(text.trim());
    setText('');
    setSending(false);
  }

  return(
    <div style={{position:'fixed',inset:0,zIndex:600,display:'flex',flexDirection:'column',background:C.bg}}>
      <style>{css}</style>
      <div className="safe-top" style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:'13px 16px',display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:C.muted,padding:4,display:'flex'}}><ChevronLeft size={20}/></button>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:700,letterSpacing:'0.05em'}}>💬 CHAIN CHAT</div>
          <div style={{fontSize:11,color:C.muted,marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{officers.map(o=>o.name).join(' · ')}</div>
        </div>
      </div>
      {!isParticipant&&(
        <div style={{background:C.goldDim,borderBottom:`1px solid ${C.goldBorder}`,padding:'8px 16px',fontSize:12,color:C.gold}}>
          👁 Read-only — {myListing?'your listing is not part of this chain':'claim your listing in Notifications to participate'}
        </div>
      )}
      <div style={{flex:1,overflowY:'auto',padding:'16px',display:'flex',flexDirection:'column',gap:2}}>
        {loading?(
          <div style={{textAlign:'center',padding:40,color:C.muted}}><RefreshCw size={18} style={{animation:'spin 0.8s linear infinite'}}/></div>
        ):messages.length===0?(
          <div style={{textAlign:'center',padding:40,color:C.muted}}>
            <div style={{fontSize:28,marginBottom:8}}>💬</div>
            <div style={{fontWeight:600,marginBottom:4}}>No messages yet</div>
            <div style={{fontSize:12}}>{isParticipant?'Start the conversation below':'Nothing yet'}</div>
          </div>
        ):(
          messages.map((msg,i)=>{
            const isMe=myListing&&msg.senderId===myListing.id;
            const showName=i===0||messages[i-1].senderId!==msg.senderId;
            const showTime=i===messages.length-1||messages[i+1].senderId!==msg.senderId;
            return(
              <div key={msg.id} className="slide-up" style={{display:'flex',flexDirection:'column',alignItems:isMe?'flex-end':'flex-start',marginTop:showName&&i>0?10:2}}>
                {showName&&!isMe&&<div style={{fontSize:11,fontWeight:600,color:C.subtle,marginBottom:3,marginLeft:4}}>{msg.senderName}</div>}
                <div style={{maxWidth:'78%',padding:'9px 13px',borderRadius:isMe?'14px 14px 4px 14px':'14px 14px 14px 4px',background:isMe?'rgba(16,185,129,0.18)':C.surface2,border:`1px solid ${isMe?'rgba(16,185,129,0.3)':C.border}`,fontSize:14,color:C.text,lineHeight:1.5,wordBreak:'break-word'}}>
                  {msg.text}
                </div>
                {showTime&&<div style={{fontSize:10,color:C.muted,marginTop:3,marginLeft:isMe?0:4,marginRight:isMe?4:0}}>{formatMsgTime(msg.createdAt)}</div>}
              </div>
            );
          })
        )}
        <div ref={bottomRef}/>
      </div>
      <div className="safe-bottom" style={{padding:'10px 12px',borderTop:`1px solid ${C.border}`,background:C.surface,display:'flex',gap:8,alignItems:'flex-end',flexShrink:0}}>
        {isParticipant?(
          <>
            <textarea ref={inputRef} className="msg-input" value={text} onChange={e=>setText(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend();}}}
              placeholder="Type a message… (Enter to send)" rows={1}
              style={{...inp,resize:'none',padding:'10px 13px',lineHeight:1.5,flex:1,maxHeight:100,overflowY:'auto',borderColor:C.border}}/>
            <button onClick={handleSend} disabled={!text.trim()||sending}
              style={{background:text.trim()?C.green:'rgba(16,185,129,0.2)',border:'none',borderRadius:10,color:'#fff',padding:'10px 14px',cursor:text.trim()?'pointer':'default',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'background 0.15s'}}>
              <Send size={16}/>
            </button>
          </>
        ):(
          <div style={{flex:1,textAlign:'center',fontSize:13,color:C.muted,padding:'8px 0'}}>
            {myListing?'Read-only — not a participant':'Set your listing to participate'}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Notification Panel ────────────────────────────────────────────────────────
function NotifPanel({notifs,onClose,onMarkAllRead,onClearAll,notifPerm,onRequestPerm,myListing,listings,onSetMyListing}){
  const unread=notifs.filter(n=>!n.read).length;
  return(
    <div style={{position:'fixed',inset:0,zIndex:500,display:'flex',flexDirection:'column',background:C.bg}}>
      <style>{css}</style>
      <div className="safe-top" style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:'14px 18px',display:'flex',alignItems:'center',gap:12}}>
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:C.muted,padding:4,display:'flex'}}><ChevronLeft size={18}/></button>
        <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:700,letterSpacing:'0.05em'}}>NOTIFICATIONS</span>
        {unread>0&&<span style={{background:C.redDim,border:`1px solid ${C.redBorder}`,borderRadius:20,padding:'2px 8px',fontSize:11,fontWeight:700,color:C.red}}>{unread} new</span>}
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          {notifs.length>0&&<button onClick={onMarkAllRead} style={{background:'none',border:'none',cursor:'pointer',color:C.muted,fontSize:12}}>Mark read</button>}
          {notifs.length>0&&<button onClick={onClearAll} style={{background:'none',border:'none',cursor:'pointer',color:C.muted,fontSize:12}}>Clear</button>}
        </div>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:16}}>
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:14,marginBottom:16}}>
          <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>👤 Your Listing</div>
          <p style={{fontSize:12,color:C.subtle,margin:'0 0 10px',lineHeight:1.5}}>Select your listing to get personalized match, lock, and chat notifications.</p>
          <Dropdown value={myListing?.name||''} options={listings.map(l=>l.name)} placeholder="Select your listing..."
            onSelect={name=>{const l=listings.find(x=>x.name===name);if(l)onSetMyListing(l);}}/>
          {myListing&&<div style={{marginTop:8,fontSize:12,color:C.green}}>✓ Watching: <strong>{myListing.name}</strong> ({myListing.currentPort})</div>}
        </div>
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:14,marginBottom:16}}>
          <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>🔔 Push Notifications</div>
          {notifPerm==='granted'?<div style={{fontSize:13,color:C.green,display:'flex',alignItems:'center',gap:6}}><Check size={13}/>Enabled</div>
          :notifPerm==='denied'?<div style={{fontSize:13,color:C.red}}>Blocked — enable in browser settings</div>
          :<button onClick={onRequestPerm} style={{width:'100%',background:C.blueDim,border:`1px solid ${C.blueBorder}`,borderRadius:7,color:C.blue,fontSize:13,fontWeight:600,padding:'9px',cursor:'pointer'}}>Enable Browser Notifications</button>}
        </div>
        <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:10}}>Activity</div>
        {notifs.length===0?(
          <div style={{textAlign:'center',padding:'40px 20px',color:C.muted}}>
            <div style={{fontSize:32,marginBottom:10}}>🔔</div>
            <div style={{fontWeight:600,marginBottom:4}}>No notifications yet</div>
            <div style={{fontSize:13}}>{myListing?'We\'ll alert you on matches, locks, and messages':'Select your listing above'}</div>
          </div>
        ):(
          notifs.map(n=>{
            const meta=NOTIF_META[n.type]||{icon:'📋',color:C.muted};
            return(
              <div key={n.id} style={{background:n.read?C.surface:'rgba(16,185,129,0.05)',border:`1px solid ${n.read?C.border:'rgba(16,185,129,0.2)'}`,borderRadius:9,padding:'12px 14px',marginBottom:8,display:'flex',gap:12,alignItems:'flex-start'}}>
                <span style={{fontSize:20,flexShrink:0}}>{meta.icon}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
                    <span style={{fontSize:13,fontWeight:600,color:meta.color}}>{n.title}</span>
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

// ── Chain Card ────────────────────────────────────────────────────────────────
function ChainCard({officers,type,chainLocks={},onLock,onUnlock,myListingId,priorityRank,unreadMsgs=0,onOpenChat}){
  const now=Date.now();
  const lockState=officers.map(o=>{
    const lock=chainLocks[o.id];
    const active=lock&&new Date(lock.expiresAt).getTime()>now;
    return{officer:o,lock,active};
  });
  const lockedCount=lockState.filter(s=>s.active).length;
  const allLocked=lockedCount===officers.length;
  const isMyChain=officers.some(o=>o.id===myListingId);
  const rankColor=priorityRank===1?C.green:priorityRank===2?C.gold:C.muted;
  const rankBg=priorityRank===1?C.greenDim:priorityRank===2?C.goldDim:'rgba(255,255,255,0.04)';
  const rankBorder=priorityRank===1?C.greenBorder:priorityRank===2?C.goldBorder:'rgba(255,255,255,0.08)';

  return(
    <div className="card fade-in" style={{background:allLocked?'rgba(16,185,129,0.04)':C.surface,border:`1px solid ${allLocked?C.green:isMyChain?'rgba(96,165,250,0.3)':type===3?'#1e3a28':C.border}`,borderRadius:10,marginBottom:12,overflow:'hidden'}}>
      <div style={{padding:'12px 14px 10px',borderBottom:`1px solid ${allLocked?'rgba(16,185,129,0.15)':C.border}`}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <Link2 size={11} color={type===3?'#4ade80':C.gold}/>
            <span style={{fontSize:11,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:type===3?'#4ade80':C.gold}}>
              {type===2?'Direct 2-Way Match':'3-Way Chain Match'}
            </span>
            {isMyChain&&<span style={{fontSize:10,fontWeight:700,color:C.blue,background:C.blueDim,border:`1px solid ${C.blueBorder}`,borderRadius:3,padding:'1px 5px'}}>YOURS</span>}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontSize:10,fontWeight:800,color:rankColor,background:rankBg,border:`1px solid ${rankBorder}`,borderRadius:4,padding:'2px 7px'}}>
              {priorityRank===1?'⭐ #1':`#${priorityRank}`}
            </span>
            <span style={{fontSize:11,color:allLocked?C.green:C.muted,fontWeight:allLocked?700:400}}>{lockedCount}/{officers.length} 🔒</span>
          </div>
        </div>
        <LockProgress locked={lockedCount} total={officers.length}/>
      </div>
      {allLocked&&(
        <div style={{padding:'10px 14px',background:'rgba(16,185,129,0.08)',borderBottom:`1px solid rgba(16,185,129,0.15)`,display:'flex',alignItems:'center',gap:10}}>
          <span className="all-locked-pulse" style={{fontSize:20}}>✅</span>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:C.green}}>All parties locked in</div>
            <div style={{fontSize:11,color:C.subtle,marginTop:1}}>Coordinate in the chat, then initiate HR</div>
          </div>
        </div>
      )}
      <div style={{padding:'10px 14px',display:'flex',flexDirection:'column',gap:6}}>
        {lockState.map(({officer,lock,active},i)=>{
          const countdown=active?formatCountdown(lock.expiresAt):null;
          const soonExpire=active&&(new Date(lock.expiresAt).getTime()-now)<4*3600000;
          return(
            <div key={officer.id}>
              <div style={{background:active?'rgba(16,185,129,0.07)':C.surface2,border:`1px solid ${active?'rgba(16,185,129,0.22)':'transparent'}`,borderRadius:8,padding:'10px 12px',transition:'background 0.2s'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                  <div style={{display:'flex',alignItems:'center',gap:7}}>
                    <div style={{width:7,height:7,borderRadius:'50%',background:active?C.green:C.muted,flexShrink:0}}/>
                    <div>
                      <div style={{fontWeight:600,fontSize:14,color:C.text}}>{officer.name}</div>
                      <div style={{fontSize:11,color:C.subtle,marginTop:1}}>📬 {officer.contact}</div>
                      <div style={{fontSize:10,color:C.muted,marginTop:1}}>⏳ Since {formatDate(officer.createdAt)}</div>
                    </div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0,marginLeft:10}}>
                    <div style={{fontSize:12,color:C.red,fontWeight:600}}>{officer.currentPort}</div>
                    <div style={{fontSize:11,color:C.green,marginTop:2}}>→ {officers[(i+1)%officers.length].currentPort}</div>
                  </div>
                </div>
                {active?(
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div style={{display:'flex',alignItems:'center',gap:5}}>
                      <Lock size={10} color={soonExpire?C.gold:C.green}/>
                      <span style={{fontSize:11,color:soonExpire?C.gold:C.green,fontWeight:500}}>{countdown||'Expiring…'}</span>
                    </div>
                    <button className="btn-release" onClick={()=>{if(window.confirm(`Release lock for ${officer.name}?`))onUnlock(officer.id);}}
                      style={{background:'none',border:`1px solid ${C.border}`,borderRadius:5,color:C.muted,fontSize:11,padding:'3px 9px',cursor:'pointer',fontFamily:"'Inter',sans-serif",transition:'all 0.15s'}}>
                      Release
                    </button>
                  </div>
                ):(
                  <button className="btn-lock" onClick={()=>{if(window.confirm(`Lock in as ${officer.name}?\n\nThis signals you're ready to proceed. Hold expires in 48 hours.`))onLock(officer.id);}}
                    style={{width:'100%',background:C.greenDim,border:`1px solid ${C.greenBorder}`,borderRadius:6,color:C.green,fontSize:12,fontWeight:600,padding:'7px',cursor:'pointer',fontFamily:"'Inter',sans-serif",display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                    <Lock size={11}/>Lock In as {officer.name}
                  </button>
                )}
              </div>
              {i<officers.length-1&&<div style={{display:'flex',justifyContent:'center',padding:'3px 0'}}><ArrowRight size={12} color={C.muted}/></div>}
            </div>
          );
        })}
      </div>
      <div style={{padding:'0 14px 12px'}}>
        <button className="chat-btn" onClick={onOpenChat}
          style={{width:'100%',background:C.blueDim,border:`1px solid ${C.blueBorder}`,borderRadius:8,color:C.blue,fontSize:13,fontWeight:600,padding:'9px',cursor:'pointer',fontFamily:"'Inter',sans-serif",display:'flex',alignItems:'center',justifyContent:'center',gap:7,transition:'background 0.15s'}}>
          <MessageSquare size={14}/>Open Chain Chat
          {unreadMsgs>0&&<span style={{background:C.red,color:'#fff',borderRadius:20,padding:'1px 7px',fontSize:11,fontWeight:700,marginLeft:4}}>{unreadMsgs} new</span>}
        </button>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App(){
  const [tab,setTab]               = useState('browse');
  const [listings,setListings]     = useState([]);
  const [locks,setLocks]           = useState({});
  const [chains,setChains]         = useState({two:[],three:[]});
  const [queuePos,setQueuePos]     = useState({});
  const [loading,setLoading]       = useState(true);
  const [filter,setFilter]         = useState('');
  const [form,setForm]             = useState({name:'',currentPort:'',desiredPorts:[],contact:'',notes:'',gsLevel:''});
  const [postStatus,setPostStatus] = useState(null);

  // Personal (stored in localStorage, not shared)
  const [myListing,setMyListing]   = useState(()=>{ try{ return JSON.parse(localStorage.getItem('cbpo-my-listing')); }catch{return null;} });
  const [notifs,setNotifs]         = useState(()=>{ try{ return JSON.parse(localStorage.getItem('cbpo-notifs'))||[]; }catch{return [];} });
  const [notifPerm,setNotifPerm]   = useState('default');
  const [notifPanel,setNotifPanel] = useState(false);
  const [bellRing,setBellRing]     = useState(false);
  const lastRef                    = useRef({chainKeys:[],lockCounts:{},allLockedKeys:[],msgCounts:{}});

  // Chat
  const [chatSession,setChatSession]   = useState(null);
  const [chatMessages,setChatMessages] = useState([]);
  const [chatLoading,setChatLoading]   = useState(false);
  const [unreadChats,setUnreadChats]   = useState({});
  const realtimeRef                    = useRef(null);

  // ── Load ────────────────────────────────────────────────────
  useEffect(()=>{ init(); if('Notification' in window) setNotifPerm(Notification.permission); },[]);

  useEffect(()=>{
    const c=computeChains(listings);
    setChains(c);
    setQueuePos(computeQueuePositions(listings));
    if(myListing) checkUnread([...c.two,...c.three], myListing.id);
  },[listings]);

  // Poll every 60s
  useEffect(()=>{
    const id=setInterval(poll, POLL_MS);
    return()=>clearInterval(id);
  },[myListing, listings, locks, notifs]);

  // Realtime listings + locks
  useEffect(()=>{
    const ch = supabase.channel('board')
      .on('postgres_changes',{event:'*',schema:'public',table:'listings'},()=>fetchListings())
      .on('postgres_changes',{event:'*',schema:'public',table:'locks'},()=>fetchLocks())
      .subscribe();
    return()=>supabase.removeChannel(ch);
  },[]);

  async function init(){
    setLoading(true);
    await Promise.all([fetchListings(), fetchLocks()]);
    setLoading(false);
  }

  async function fetchListings(){
    const {data}=await supabase.from('listings').select('*').order('created_at');
    setListings((data||[]).map(dbToListing));
  }

  async function fetchLocks(){
    const {data}=await supabase.from('locks').select('*').gt('expires_at',new Date().toISOString());
    setLocks(dbToLocks(data||[]));
  }

  async function checkUnread(allChains, myId){
    const myChains=allChains.filter(officers=>officers.some(o=>o.id===myId));
    const newUnread={};
    for(const officers of myChains){
      const ck=getChainKey(officers);
      const {data:msgs}=await supabase.from('messages').select('id,sender_id,created_at').eq('chain_key',ck);
      if(!msgs?.length) continue;
      const {data:receipt}=await supabase.from('read_receipts').select('read_at').eq('chain_key',ck).eq('user_id',myId).maybeSingle();
      const lastRead=receipt?.read_at;
      const count=msgs.filter(m=>m.sender_id!==myId&&(!lastRead||new Date(m.created_at)>new Date(lastRead))).length;
      if(count>0) newUnread[ck]=count;
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
    const now=Date.now();
    const myId=myListing.id;
    const myChains=[...newChains.two,...newChains.three].filter(o=>o.some(x=>x.id===myId));
    const last=lastRef.current;
    const newNotifItems=[];

    for(const officers of myChains){
      const ck=getChainKey(officers);
      const currActive=Object.values(lk[ck]||{}).filter(l=>new Date(l.expiresAt).getTime()>now);
      const currCount=currActive.length;
      const prevCount=last.lockCounts?.[ck]||0;
      const wasKnown=last.chainKeys?.includes(ck);

      if(!wasKnown) newNotifItems.push({type:'match_found',title:'New swap match found!',body:`Your listing is part of a ${officers.length}-way chain. Check the Chains tab.`});
      if(wasKnown&&currCount>prevCount) newNotifItems.push({type:'lock_placed',title:'Lock placed on your chain',body:`${currCount}/${officers.length} officers ready.`});
      if(currCount===officers.length&&!last.allLockedKeys?.includes(ck)) newNotifItems.push({type:'all_locked',title:'All parties locked in! 🎉',body:'Everyone is ready. Use chain chat to coordinate, then start HR.'});

      // Chat
      const {data:msgs}=await supabase.from('messages').select('*').eq('chain_key',ck).order('created_at');
      if(msgs?.length){
        const prev=last.msgCounts?.[ck]||0;
        if(msgs.length>prev){
          const latest=msgs[msgs.length-1];
          if(latest.sender_id!==myId){
            newNotifItems.push({type:'new_message',title:'New message in your chain',body:`${latest.sender_name}: ${latest.text.slice(0,80)}${latest.text.length>80?'…':''}`});
            if(!chatSession||chatSession.chainKey!==ck)
              setUnreadChats(prev=>({...prev,[ck]:(prev[ck]||0)+msgs.length-prev}));
          }
        }
        if(!last.msgCounts) last.msgCounts={};
        last.msgCounts[ck]=msgs.length;
      }
    }

    if(newNotifItems.length>0){
      const stamped=newNotifItems.map(n=>({...n,id:uuid(),createdAt:new Date().toISOString(),read:false}));
      const updated=[...stamped,...notifs];
      setNotifs(updated);
      localStorage.setItem('cbpo-notifs',JSON.stringify(updated));
      setBellRing(true); setTimeout(()=>setBellRing(false),600);
      for(const n of stamped) fireNativeNotif(n.title,n.body);
    }

    lastRef.current={
      chainKeys:myChains.map(getChainKey),
      lockCounts:Object.fromEntries(myChains.map(o=>{const ck=getChainKey(o);return[ck,Object.values(lk[ck]||{}).filter(l=>new Date(l.expiresAt).getTime()>now).length];})),
      allLockedKeys:myChains.filter(o=>{const ck=getChainKey(o);return Object.values(lk[ck]||{}).filter(l=>new Date(l.expiresAt).getTime()>now).length===o.length;}).map(getChainKey),
      msgCounts:last.msgCounts||{},
    };
  }

  // ── Chat ────────────────────────────────────────────────────
  async function openChat(chainKey,officers){
    setChatSession({chainKey,officers});
    setChatLoading(true);
    const {data}=await supabase.from('messages').select('*').eq('chain_key',chainKey).order('created_at');
    setChatMessages((data||[]).map(r=>({id:r.id,senderId:r.sender_id,senderName:r.sender_name,text:r.text,createdAt:r.created_at})));
    setChatLoading(false);
    if(myListing){
      await supabase.from('read_receipts').upsert({chain_key:chainKey,user_id:myListing.id,read_at:new Date().toISOString()});
      setUnreadChats(prev=>({...prev,[chainKey]:0}));
    }
    // Realtime for this chat room
    if(realtimeRef.current) supabase.removeChannel(realtimeRef.current);
    realtimeRef.current = supabase.channel(`chat-${chainKey}`)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:`chain_key=eq.${chainKey}`},payload=>{
        const r=payload.new;
        setChatMessages(prev=>[...prev,{id:r.id,senderId:r.sender_id,senderName:r.sender_name,text:r.text,createdAt:r.created_at}]);
      })
      .subscribe();
  }

  function closeChat(){
    if(realtimeRef.current){ supabase.removeChannel(realtimeRef.current); realtimeRef.current=null; }
    setChatSession(null);
  }

  async function sendMessage(text){
    if(!myListing||!chatSession) return;
    const msg={id:uuid(),chain_key:chatSession.chainKey,sender_id:myListing.id,sender_name:myListing.name,text,created_at:new Date().toISOString()};
    await supabase.from('messages').insert([msg]);
    // Realtime will add it to state; also mark read
    await supabase.from('read_receipts').upsert({chain_key:chatSession.chainKey,user_id:myListing.id,read_at:new Date().toISOString()});
  }

  // ── Locks ───────────────────────────────────────────────────
  async function lockOfficer(chainKey,officerId){
    const now=new Date();
    const expires=new Date(now.getTime()+LOCK_MS);
    await supabase.from('locks').upsert({chain_key:chainKey,officer_id:officerId,locked_at:now.toISOString(),expires_at:expires.toISOString()});
    await fetchLocks();
  }
  async function unlockOfficer(chainKey,officerId){
    await supabase.from('locks').delete().eq('chain_key',chainKey).eq('officer_id',officerId);
    await fetchLocks();
  }

  // ── Listings ────────────────────────────────────────────────
  async function submitListing(){
    if(!form.name.trim()||!form.currentPort||!form.desiredPorts.length||!form.contact.trim()){
      setPostStatus('error'); setTimeout(()=>setPostStatus(null),2500); return;
    }
    setPostStatus('saving');
    const row={id:uuid(),name:form.name.trim(),current_port:form.currentPort,desired_ports:form.desiredPorts,contact:form.contact.trim(),notes:form.notes.trim(),gs_level:form.gsLevel};
    const {error}=await supabase.from('listings').insert([row]);
    if(error){ console.error('Supabase error:', error.message); alert('Error: ' + error.message); setPostStatus('error'); setTimeout(()=>setPostStatus(null),2500); return; }
    setForm({name:'',currentPort:'',desiredPorts:[],contact:'',notes:''});
    setPostStatus('saved');
    setTimeout(()=>{setPostStatus(null);setTab('browse');},1600);
  }
  async function removeListing(id){
    await supabase.from('listings').delete().eq('id',id);
  }

  // ── My listing / notifs (localStorage) ──────────────────────
  function handleSetMyListing(l){ setMyListing(l); localStorage.setItem('cbpo-my-listing',JSON.stringify(l)); }
  async function requestNotifPermission(){ if('Notification' in window){ const p=await Notification.requestPermission(); setNotifPerm(p); } }
  function markAllRead(){ const u=notifs.map(n=>({...n,read:true})); setNotifs(u); localStorage.setItem('cbpo-notifs',JSON.stringify(u)); }
  function clearAllNotifs(){ setNotifs([]); localStorage.setItem('cbpo-notifs',JSON.stringify([])); }

  // ── Derived ──────────────────────────────────────────────────
  const filtered=filter.trim()
    ?listings.filter(l=>l.name.toLowerCase().includes(filter.toLowerCase())||l.currentPort.toLowerCase().includes(filter.toLowerCase())||l.desiredPorts.some(p=>p.toLowerCase().includes(filter.toLowerCase())))
    :listings;
  const totalChains=chains.two.length+chains.three.length;
  const unreadCount=notifs.filter(n=>!n.read).length;
  const totalUnreadChat=Object.values(unreadChats).reduce((a,b)=>a+b,0);
  const tabs=[{id:'browse',label:`Board (${listings.length})`},{id:'post',label:'+ Post'},{id:'chains',label:`Chains${totalChains?` (${totalChains})`:''}`}];

  // ── Screens ──────────────────────────────────────────────────
  if(chatSession) return(
    <ChatPanel chainKey={chatSession.chainKey} officers={chatSession.officers} messages={chatMessages}
      loading={chatLoading} myListing={myListing} onSend={sendMessage} onClose={closeChat}/>
  );
  if(notifPanel) return(
    <NotifPanel notifs={notifs} onClose={()=>setNotifPanel(false)} onMarkAllRead={markAllRead} onClearAll={clearAllNotifs}
      notifPerm={notifPerm} onRequestPerm={requestNotifPermission}
      myListing={myListing} listings={listings} onSetMyListing={handleSetMyListing}/>
  );

  return(
    <div style={{minHeight:'100vh',background:C.bg,fontFamily:"'Inter',sans-serif",color:C.text}}>
      <style>{css}</style>

      {/* Header */}
      <div className="safe-top" style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:'14px 18px',display:'flex',alignItems:'center',gap:12,position:'sticky',top:0,zIndex:100}}>
        <div style={{background:C.greenDim,border:`1px solid ${C.greenBorder}`,borderRadius:8,padding:'7px',display:'flex'}}>
          <Shield size={17} color={C.green}/>
        </div>
        <div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:19,fontWeight:800,letterSpacing:'0.06em',lineHeight:1}}>CBPO SWAP BOARD</div>
          <div style={{fontSize:11,color:C.muted,marginTop:1}}>Duty Station Exchange Network</div>
        </div>
        <div style={{marginLeft:'auto',display:'flex',gap:6,alignItems:'center'}}>
          {totalChains>0&&<div style={{background:C.goldDim,border:`1px solid ${C.goldBorder}`,borderRadius:20,padding:'3px 9px',fontSize:11,fontWeight:700,color:C.gold}}>{totalChains} MATCH{totalChains!==1?'ES':''}</div>}
          {totalUnreadChat>0&&<div style={{background:C.purpleDim,border:`1px solid ${C.purpleBorder}`,borderRadius:20,padding:'3px 9px',fontSize:11,fontWeight:700,color:C.purple,display:'flex',alignItems:'center',gap:4}}><MessageSquare size={9}/>{totalUnreadChat}</div>}
          <button onClick={()=>setNotifPanel(true)} style={{background:'none',border:'none',cursor:'pointer',padding:4,position:'relative',display:'flex',color:unreadCount>0?C.green:C.muted}}>
            <Bell size={18} className={bellRing?'bell-ring':''}/>
            {unreadCount>0&&<span style={{position:'absolute',top:-2,right:-2,background:C.red,color:'#fff',borderRadius:'50%',width:16,height:16,fontSize:10,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>{unreadCount>9?'9+':unreadCount}</span>}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,display:'flex'}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} className="tab"
            style={{flex:1,background:'none',border:'none',borderBottom:tab===t.id?`2px solid ${C.green}`:'2px solid transparent',color:tab===t.id?C.green:C.muted,padding:'11px 6px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* BROWSE */}
      {tab==='browse'&&(
        <div style={{padding:16}}>
          <div style={{position:'relative',marginBottom:14}}>
            <Search size={14} color={C.muted} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
            <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Search by name, current, or desired port..." style={{...inp,paddingLeft:36}}/>
          </div>
          {loading?(
            <div style={{textAlign:'center',padding:60,color:C.muted}}><RefreshCw size={20} style={{animation:'spin 0.8s linear infinite'}}/></div>
          ):filtered.length===0?(
            <div style={{textAlign:'center',padding:60,color:C.muted}}>
              <div style={{fontSize:36,marginBottom:10}}>📋</div>
              <div style={{fontWeight:600,fontSize:15,marginBottom:4}}>{filter?'No results':'No listings yet'}</div>
              <div style={{fontSize:13}}>{filter?'Try a different search':'Be the first to post'}</div>
            </div>
          ):(
            filtered.map(l=>(
              <div key={l.id} className="card fade-in" style={{background:l.id===myListing?.id?'rgba(96,165,250,0.05)':C.surface,border:`1px solid ${l.id===myListing?.id?'rgba(96,165,250,0.3)':C.border}`,borderRadius:10,padding:'14px 16px',marginBottom:10}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:15,display:'flex',alignItems:'center',gap:7}}>
                      {l.name}
                      {l.id===myListing?.id&&<span style={{fontSize:10,fontWeight:700,color:C.blue,background:C.blueDim,border:`1px solid ${C.blueBorder}`,borderRadius:3,padding:'1px 5px'}}>YOU</span>}
                    </div>
                    <div style={{fontSize:11,color:C.muted,marginTop:2}}>{formatDate(l.createdAt)}</div>
                  </div>
                  <button onClick={()=>{if(window.confirm('Remove this listing?'))removeListing(l.id);}} style={{background:'none',border:'none',cursor:'pointer',color:C.muted,padding:'2px 4px'}}><Trash2 size={13}/></button>
                </div>
                <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:6,marginBottom:10}}>
                  <span style={{background:C.redDim,border:`1px solid ${C.redBorder}`,borderRadius:5,padding:'3px 10px',fontSize:12,color:C.red,fontWeight:600}}>{l.currentPort}</span>
                  <ArrowRight size={12} color={C.muted} style={{flexShrink:0}}/>
                  <div style={{display:'flex',flexWrap:'wrap',gap:4}}>{l.desiredPorts.map(p=><PortTag key={p} label={p}/>)}</div>
                </div>
                <div style={{fontSize:13,color:C.subtle}}>📬 {l.contact}</div>
                {l.notes&&<div style={{marginTop:8,fontSize:12,color:C.subtle,background:C.surface2,borderRadius:6,padding:'7px 10px',lineHeight:1.5}}>{l.notes}</div>}
                {queuePos[l.id]&&l.desiredPorts.length>0&&(
                  <div style={{marginTop:8,display:'flex',flexWrap:'wrap',gap:4}}>
                    {l.desiredPorts.map(port=>{
                      const pos=queuePos[l.id][port];
                      return(
                        <span key={port} style={{fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:4,
                          background:pos===1?C.greenDim:pos===2?C.goldDim:'rgba(255,255,255,0.05)',
                          border:`1px solid ${pos===1?C.greenBorder:pos===2?C.goldBorder:'rgba(255,255,255,0.08)'}`,
                          color:pos===1?C.green:pos===2?C.gold:C.muted}}>
                          #{pos} for {port.split(',')[0]}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* POST */}
      {tab==='post'&&(
        <div style={{padding:16}}>
          <div style={{background:C.goldDim,border:`1px solid ${C.goldBorder}`,borderRadius:8,padding:'10px 14px',marginBottom:18,fontSize:12,color:'#fcd34d',lineHeight:1.5}}>
            ⚠️ Listings are publicly visible. Do not post SSN, badge number, or sensitive PII.
          </div>
          <div style={{marginBottom:16}}>
            <label style={{display:'block',fontSize:11,fontWeight:600,color:C.muted,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em'}}>Name / Identifier *</label>
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Officer R. Smith or initials" style={inp}/>
          </div>
          <div style={{marginBottom:16}}>
            <label style={{display:'block',fontSize:11,fontWeight:600,color:C.muted,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em'}}>GS Level (Optional)</label>
            <select value={form.gsLevel} onChange={e=>setForm(f=>({...f,gsLevel:e.target.value}))}
              style={{...inp,cursor:'pointer',appearance:'none'}}>
              <option value=''>Select GS level...</option>
              {['GS-5','GS-6','GS-7','GS-8','GS-9','GS-10','GS-11','GS-12'].map(g=>(
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          
          <div style={{marginBottom:16}}>
            <label style={{display:'block',fontSize:11,fontWeight:600,color:C.muted,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em'}}>GS Level (Optional)</label>
            <select value={form.gsLevel} onChange={e=>setForm(f=>({...f,gsLevel:e.target.value}))}
              style={{...inp,cursor:'pointer',appearance:'none'}}>
              <option value=''>Select GS level...</option>
              {['GS-5','GS-6','GS-7','GS-8','GS-9','GS-10','GS-11','GS-12'].map(g=>(
                <option key={g} value={g}>{g}</option>
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
            <input value={form.contact} onChange={e=>setForm(f=>({...f,contact:e.target.value}))} placeholder="Email, Teams handle, or phone" style={inp}/>
          </div>
          <div style={{marginBottom:22}}>
            <label style={{display:'block',fontSize:11,fontWeight:600,color:C.muted,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em'}}>Notes (Optional)</label>

            <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="e.g. Flexible on timing, open to 3-way…" rows={3} style={{...inp,resize:'vertical',lineHeight:1.5}}/>
          </div>
          <button onClick={submitListing} disabled={postStatus==='saving'||postStatus==='saved'}
            style={{width:'100%',border:'none',borderRadius:8,color:'#fff',padding:'13px',fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:"'Inter',sans-serif",
              background:postStatus==='saved'?'#059669':postStatus==='error'?'#dc2626':C.green,transition:'background 0.2s'}}>
            {postStatus==='saving'?'Posting…':postStatus==='saved'?'✓ Posted!':postStatus==='error'?'Fill all required fields':'Post Swap Request'}
          </button>
        </div>
      )}

      {/* CHAINS */}
      {tab==='chains'&&(
        <div style={{padding:16}}>
          {!myListing&&(
            <div style={{background:C.purpleDim,border:`1px solid ${C.purpleBorder}`,borderRadius:9,padding:'12px 14px',marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontSize:13,color:C.purple}}>🔔 Set your listing to get notified and chat</div>
              <button onClick={()=>setNotifPanel(true)} style={{background:C.purpleDim,border:`1px solid ${C.purpleBorder}`,borderRadius:6,color:C.purple,fontSize:12,fontWeight:600,padding:'5px 10px',cursor:'pointer'}}>Set up</button>
            </div>
          )}
          {chains.two.length===0&&chains.three.length===0?(
            <div style={{textAlign:'center',padding:60,color:C.muted}}>
              <div style={{fontSize:36,marginBottom:10}}>🔗</div>
              <div style={{fontWeight:600,fontSize:15,marginBottom:4}}>No matches yet</div>
              <div style={{fontSize:13}}>Chains appear automatically as listings align</div>
            </div>
          ):(
            <>
              {chains.two.length>0&&(
                <>
                  <div style={{fontSize:11,fontWeight:700,color:C.gold,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:10}}>2-Way Direct Swaps — {chains.two.length}</div>
                  {sortByPriority(chains.two).map((officers,i)=>{
                    const ck=getChainKey(officers);
                    return<ChainCard key={ck} officers={officers} type={2} chainLocks={locks[ck]||{}} myListingId={myListing?.id}
                      priorityRank={i+1} unreadMsgs={unreadChats[ck]||0}
                      onLock={oid=>lockOfficer(ck,oid)} onUnlock={oid=>unlockOfficer(ck,oid)}
                      onOpenChat={()=>openChat(ck,officers)}/>;
                  })}
                </>
              )}
              {chains.three.length>0&&(
                <div style={{marginTop:chains.two.length>0?18:0}}>
                  <div style={{fontSize:11,fontWeight:700,color:'#4ade80',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:10}}>3-Way Chain Swaps — {chains.three.length}</div>
                  {sortByPriority(chains.three).map((officers,i)=>{
                    const ck=getChainKey(officers);
                    return<ChainCard key={ck} officers={officers} type={3} chainLocks={locks[ck]||{}} myListingId={myListing?.id}
                      priorityRank={i+1} unreadMsgs={unreadChats[ck]||0}
                      onLock={oid=>lockOfficer(ck,oid)} onUnlock={oid=>unlockOfficer(ck,oid)}
                      onOpenChat={()=>openChat(ck,officers)}/>;
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="safe-bottom" style={{padding:'14px 18px',textAlign:'center',fontSize:11,color:C.muted,borderTop:`1px solid ${C.border}`,marginTop:16}}>
        Unofficial peer tool — verify all swaps through official CBP HR channels.
      </div>
    </div>
  );
}
