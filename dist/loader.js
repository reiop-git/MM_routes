(function(){
'use strict';
// Object data (clients, contacts, access notes) is never part of the published site.
// It is loaded from a private file and kept only in this browser's localStorage.
const OBJECTS='murumehed.objects.v1',PLANS='murumehed.simple.v3',RETIRED=new Set(['T26-070']);
const TIME=/^(?:[01]\d|2[0-3]):[0-5]\d$/,ID=/^[A-Za-z0-9-]{1,40}$/,DATE=/^\d{4}-\d{2}-\d{2}$/;
const str=(v,max)=>typeof v==='string'&&v.length<=max;
const opt=(v,max)=>v===undefined||v===null||str(v,max);
const point=c=>Array.isArray(c)&&c.length===2&&c.every(Number.isFinite)&&Math.abs(c[0])<=90&&Math.abs(c[1])<=180;
const today=()=>new Date().toISOString().slice(0,10);
const list=a=>a.slice(0,12).join(', ')+(a.length>12?' (+'+(a.length-12)+')':'');

function checkSites(sites){
if(!Array.isArray(sites)||!sites.length||sites.length>2000)throw Error('Andmefailis pole objekte.');
const ids=new Set();
for(const s of sites){
if(!s||typeof s!=='object'||!ID.test(s.id)||ids.has(s.id))throw Error('Vigane või korduv objekti tunnus: '+String(s&&s.id).slice(0,40));
ids.add(s.id);
const ok=str(s.client,300)&&Array.isArray(s.addresses)&&s.addresses.length>0&&s.addresses.length<=20&&s.addresses.every(a=>str(a,300)&&a.trim()!=='')&&TIME.test(s.deadline)&&str(s.work,100)&&(s.minutes===null||Number.isFinite(s.minutes)&&s.minutes>=0&&s.minutes<=1440)&&['notes','phone','email','period'].every(k=>opt(s[k],10000));
if(!ok)throw Error('Vigane objekt '+s.id+'.');
if(s.coords!==undefined){if(!s.coords||typeof s.coords!=='object'||Array.isArray(s.coords))throw Error('Vigane objekt '+s.id+'.');for(const [a,c] of Object.entries(s.coords))if(!s.addresses.includes(a)||!point(c))throw Error('Vigane kaardipunkt objektil '+s.id+'.');}
}
return sites;
}

// Accepts an object data file ({sites}) or a full backup ({version:3, plans, objects:{sites}}).
function readDataFile(json){
if(json&&typeof json==='object'&&json.objects&&json.plans){
if(json.version!==3||typeof json.plans!=='object')throw Error('See pole sobiv ringiplaan.');
return {sites:checkSites(json.objects.sites),plans:{version:3,plans:json.plans},updated:DATE.test(json.objects.updated)?json.objects.updated:today()};
}
if(json&&typeof json==='object'&&Array.isArray(json.sites)&&!json.plans)return {sites:checkSites(json.sites),plans:null,updated:DATE.test(json.updated)?json.updated:today()};
throw Error('Selles failis pole objektide andmeid.');
}

function plansOf(p){return p&&p.plans&&typeof p.plans==='object'?Object.values(p.plans):[p];}
function planIds(p){
const out=[];
for(const pl of plansOf(p)){if(!pl)continue;for(const crews of [pl.crews,pl.archivedCrews])if(Array.isArray(crews))for(const c of crews)if(c&&Array.isArray(c.stops))for(const st of c.stops)if(st&&!RETIRED.has(st.id))out.push(st.id);}
return out;
}
// Routes must never lose stops silently: report anything the new data cannot satisfy.
function conflicts(p,sites){
const by=new Map(sites.map(s=>[s.id,s]));
const missing=[...new Set(planIds(p).filter(id=>!by.has(id)))],hand=[];
const weekday=p&&p.plans?p.plans.weekday:p;
if(weekday&&Array.isArray(weekday.crews)&&weekday.crews.length===6)weekday.crews.slice(0,5).forEach(c=>(c&&Array.isArray(c.stops)?c.stops:[]).forEach(st=>{const s=by.get(st&&st.id);if(s&&s.work==='Ainult käsitöö')hand.push(s.id);}));
return {missing,hand:[...new Set(hand)]};
}
// Stored map points for addresses that no longer exist would make the plan invalid.
function pruneCoords(p,sites){
const addrs=new Set(sites.flatMap(s=>s.addresses));let removed=0;
for(const pl of plansOf(p))if(pl&&pl.coords&&typeof pl.coords==='object')for(const a of Object.keys(pl.coords))if(!addrs.has(a)){delete pl.coords[a];removed++;}
return removed;
}

function prepare(json,currentRaw){
const d=readDataFile(json);
let target=d.plans;
if(!target&&currentRaw){try{target=JSON.parse(currentRaw);}catch{throw Error('Selle brauseri praegust plaani ei saa lugeda. Ava enne täielik varukoopia.');}}
if(target){
const c=conflicts(target,d.sites);
if(c.missing.length)throw Error('Andmefailis puuduvad ringides olevad objektid: '+list(c.missing)+'. Eemalda need enne ringidest või vali õige fail.');
if(c.hand.length)throw Error('Need objektid on andmefailis ainult käsitöö, kuid on Tööpäeva masinaringis: '+list(c.hand)+'. Tõsta need enne käsitöö ringile.');
pruneCoords(target,d.sites);
}
return {objects:{version:1,updated:d.updated,sites:d.sites},plans:target||null,replacesPlans:!!d.plans};
}

function storedObjects(storage){
try{const o=JSON.parse(storage.getItem(OBJECTS)||'null');if(o&&o.version===1)return {version:1,updated:DATE.test(o.updated)?o.updated:'',sites:checkSites(o.sites)};}catch(e){console.error(e);}
return null;
}

function install(json,storage,beforeWrite){
const ready=prepare(json,storage.getItem(PLANS));
if(beforeWrite)beforeWrite(ready);
storage.setItem(OBJECTS,JSON.stringify(ready.objects));
if(ready.plans)storage.setItem(PLANS,JSON.stringify(ready.plans));
return ready;
}

async function readFile(file){
if(!file)throw Error('Faili ei valitud.');
if(file.size>5e6)throw Error('Fail on liiga suur.');
try{return JSON.parse(await file.text());}catch{throw Error('Fail ei ole loetav JSON.');}
}

const MMData={OBJECTS,PLANS,checkSites,readDataFile,planIds,conflicts,pruneCoords,prepare,storedObjects,install,readFile,info:null};
window.MMData=MMData;
if(window.MMDATA_NO_BOOT)return;

const $=id=>document.getElementById(id);
function formatDate(d){return DATE.test(d)?d.slice(8,10)+'.'+d.slice(5,7)+'.'+d.slice(0,4):'';}
let storage;
try{storage=window.localStorage;storage.getItem(OBJECTS);}catch{storage=null;}
const objects=storage&&storedObjects(storage);
if(objects){
MMData.info=objects;
window.SOURCE_DATA={sites:objects.sites};
$('data-info').textContent='Objektid: '+objects.sites.length+(objects.updated?' · andmed '+formatDate(objects.updated):'');
const s=document.createElement('script');s.src='simple.js';document.body.appendChild(s);
}else{
document.body.classList.add('setup');
const status=$('setup-status');
if(!storage)status.textContent='Brauser ei luba andmeid salvestada. Ava leht tavalises (mitte privaatses) aknas.';
$('setup-file').addEventListener('change',async e=>{
const el=e.target;
try{if(!storage)throw Error('Brauser ei luba andmeid salvestada.');const ready=install(await readFile(el.files[0]),storage,r=>{const old=storage.getItem(PLANS);if(r.replacesPlans&&old){const u=URL.createObjectURL(new Blob([old],{type:'application/json'})),a=document.createElement('a');a.href=u;a.download='masinaringid-enne-taastamist.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}});status.textContent='Laaditud: '+ready.objects.sites.length+' objekti. Avan…';location.reload();}
catch(err){status.textContent=err.message;el.value='';}
});
}
})();
