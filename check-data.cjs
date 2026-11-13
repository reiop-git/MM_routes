const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const data=JSON.parse(fs.readFileSync(require('./scripts/data-path.cjs'),'utf8'));
const clone=o=>JSON.parse(JSON.stringify(o));
function memory(init={}){const m={...init};return {getItem:k=>k in m?m[k]:null,setItem:(k,v)=>{m[k]=String(v);},raw:m};}
const ctx={window:{MMDATA_NO_BOOT:true},console,Date};
vm.runInNewContext(fs.readFileSync('dist/loader.js','utf8'),ctx);
const D=ctx.window.MMData;

// Object data file and its validation.
assert.equal(D.readDataFile(clone(data)).sites.length,73);
for(const bad of [{id:'X<1'},{deadline:'<img>'},{minutes:-1},{addresses:[]},{client:5}]){const d=clone(data);Object.assign(d.sites[0],bad);assert.throws(()=>D.readDataFile(d));}
const dup=clone(data);dup.sites[1].id=dup.sites[0].id;assert.throws(()=>D.readDataFile(dup),/korduv/);
assert.throws(()=>D.readDataFile({version:3,plans:{}}),/objektide/);
console.log('Passed: data file validation rejects unsafe ids, deadlines, durations, empty addresses and duplicates.');

// Plan with real-looking structure, built from the data IDs.
const ids=data.sites.map(s=>s.id),hand=data.sites.find(s=>s.work==='Ainult käsitöö').id,machine=data.sites.find(s=>s.work!=='Ainult käsitöö').id;
const plan=n=>({version:2,objectRevision:1,crews:Array.from({length:n},(_,i)=>({name:'Ring '+(i+1),stops:[]})),notes:{},coords:{}});
const bundle={version:3,plans:{weekday:plan(6),weekend:plan(4)}};
bundle.plans.weekday.crews[0].stops=[{id:machine,minutes:30},{id:'T26-070',minutes:5}];
bundle.plans.weekday.crews[5].stops=[{id:hand,minutes:10}];
bundle.plans.weekend.crews[2].stops=ids.slice(0,20).map(id=>({id,minutes:null}));
bundle.plans.weekend.archivedCrews=[{name:'Vana',stops:[{id:ids[30],minutes:1}]}];
bundle.plans.weekday.coords={[data.sites[0].addresses[0]]:[58.3,26.7],'Kadunud tn 1, Tartu, Eesti':[58.3,26.7]};

// Full backup installs objects and plans; retired IDs are ignored; stale points pruned.
const store=memory();
const full={...clone(bundle),objects:{updated:'2026-11-13',sites:clone(data.sites)}};
const r1=D.install(clone(full),store);
assert.equal(r1.replacesPlans,true);
const savedPlans=JSON.parse(store.raw[D.PLANS]),savedObjects=JSON.parse(store.raw[D.OBJECTS]);
assert.equal(savedObjects.sites.length,73);assert.equal(savedObjects.updated,'2026-11-13');
assert.equal(savedPlans.plans.weekend.crews[2].stops.length,20);assert.equal(savedPlans.plans.weekend.archivedCrews[0].stops[0].id,ids[30]);
assert(!savedPlans.plans.weekday.coords['Kadunud tn 1, Tartu, Eesti']);assert(savedPlans.plans.weekday.coords[data.sites[0].addresses[0]]);
assert.equal(savedPlans.objects,undefined);
// Idempotent.
D.install(clone(full),store);assert.deepEqual(JSON.parse(store.raw[D.PLANS]),savedPlans);
console.log('Passed: full backup installs objects and routes, keeps archive, prunes stale points, is idempotent.');

// Updating object data alone keeps routes.
const updated=clone(data);updated.updated='2026-12-01';updated.sites[0].notes='Uus juhis';
const before=store.raw[D.PLANS];D.install(updated,store);
assert.equal(store.raw[D.PLANS],before);assert.equal(JSON.parse(store.raw[D.OBJECTS]).updated,'2026-12-01');
console.log('Passed: object-only update keeps saved routes unchanged.');

// Never silently drop assigned stops.
const missing=clone(data);missing.sites=missing.sites.filter(s=>s.id!==ids[30]&&s.id!==ids[5]);
const snapshot=JSON.stringify(store.raw);let calledBack=false;
assert.throws(()=>D.install(missing,store,()=>{calledBack=true;}),e=>e.message.includes(ids[30])&&e.message.includes(ids[5]));
assert.equal(JSON.stringify(store.raw),snapshot);assert.equal(calledBack,false);
const nowHand=clone(data);nowHand.sites.find(s=>s.id===machine).work='Ainult käsitöö';
assert.throws(()=>D.install(nowHand,store),new RegExp(machine));assert.equal(JSON.stringify(store.raw),snapshot);
console.log('Passed: data missing assigned objects or breaking machine-route rules is refused without changing storage.');

// The app boots from stored data and the backup button exports objects with plans.
const els={},handlers={};let downloaded=null;
const document={getElementById(id){return els[id]??={value:'',checked:false,dataset:{},innerHTML:'',textContent:'',addEventListener(){},showModal(){},close(){}};},addEventListener(n,fn){handlers[n]=fn;},createElement:()=>({click(){}})};
class FakeBlob{constructor(parts){downloaded=parts.join('');}}
const appCtx={document,window:{SOURCE_DATA:{sites:savedObjects.sites},MMData:{...D,info:savedObjects},print(){}},localStorage:store,Intl,Date,console,Set,Map,Blob:FakeBlob,URL:{createObjectURL:()=>'blob:x',revokeObjectURL(){}},setTimeout:()=>0};
vm.runInNewContext(fs.readFileSync('dist/simple.js','utf8'),appCtx);
assert.equal(els.status.textContent,'Vali masin ja lisa objektid. Plaan salvestub automaatselt.');
handlers.click({target:{closest:()=>({id:'backup',dataset:{}})}});
const exported=JSON.parse(downloaded);
assert.equal(exported.version,3);assert.equal(exported.objects.sites.length,73);assert.equal(exported.plans.weekend.crews[2].stops.length,20);
const fresh=memory();D.install(exported,fresh);assert.deepEqual(JSON.parse(fresh.raw[D.PLANS]).plans,exported.plans);
console.log('Passed: app starts from stored data; Salvesta plaan failina exports one file that restores routes and objects on a new device.');

// Real private backups, when present on this machine.
for(const name of ['murumehed-masinaringid_libedaring.json','murumehed-masinaringid_mehhaniseeritud.json']){
const file=path.join('private-backups',name);if(!fs.existsSync(file))continue;
const b=JSON.parse(fs.readFileSync(file,'utf8'));const s=memory();
D.install({...b,objects:{sites:clone(data.sites)}},s);
const counts=JSON.parse(s.raw[D.PLANS]).plans.weekend.crews.map(c=>c.stops.length);
const orig=b.plans.weekend.crews.map(c=>c.stops.length);
assert.deepEqual(counts,orig);console.log('Passed: real backup '+name+' combines with object data (Libedaring stops '+counts.join('/')+').');
}
