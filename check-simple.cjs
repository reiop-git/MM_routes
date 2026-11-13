const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const data=JSON.parse(fs.readFileSync(require('./scripts/data-path.cjs'),'utf8'));
const els={},handlers={},saved={};
const document={getElementById(id){return els[id]??={value:'',checked:false,dataset:{},innerHTML:'',addEventListener(){},showModal(){},close(){}};},addEventListener(n,fn){handlers[n]=fn;}};
const ctx={document,window:{SOURCE_DATA:data,print(){}},localStorage:{getItem:k=>saved[k]||null,setItem:(k,v)=>saved[k]=v},Intl,Date,console,Set,Map};
let source=fs.readFileSync('dist/simple.js','utf8');
source=source.replace('render();renderMap(true);message(restoreMessage',"window.test={fresh,validate,migrate,work,total,add,printSheet,seedCoords,switchPlan,bundleFrom,readPlan,shortAddress,weekendOrder,getState:()=>state,select:i=>active=i};render();renderMap(true);message(restoreMessage");
source=source.replace('window.test={fresh,','window.test={filtered,validateBundle,fresh,');
vm.runInNewContext(source,ctx);const t=ctx.window.test;
const mixed=data.sites.find(s=>t.work(s)==='both'),hand=data.sites.find(s=>t.work(s)==='hand');
t.add(mixed.id);t.select(5);t.add(mixed.id);
assert.equal(t.getState().crews[0].stops[0].minutes,mixed.minutes);
assert.equal(t.getState().crews[5].stops[0].minutes,null);
assert.equal(t.total(t.getState().crews[5]).missing,1);
handlers.input({target:{dataset:{minutes:mixed.id},value:'10'}});
assert.equal(t.total(t.getState().crews[5]).minutes,10);assert.equal(t.total(t.getState().crews[5]).missing,0);
assert.equal(JSON.parse(saved['murumehed.simple.v3']).plans.weekday.crews[5].stops[0].minutes,10);
t.select(1);t.add(mixed.id);assert.equal(t.getState().crews[0].stops.length,1);assert.equal(t.getState().crews[5].stops.length,1);
t.add(mixed.id);assert.equal(t.getState().crews[1].stops.length,1);
t.add(hand.id);assert.equal(t.getState().crews[1].stops.length,1);
t.select(5);t.add(hand.id);assert.equal(t.getState().crews[5].stops[1].minutes,hand.minutes);
t.getState().notes[mixed.id]='Gate <script>sample</script>';t.printSheet();assert(els['print-sheet'].innerHTML.includes('&lt;script&gt;'));assert(els['print-sheet'].innerHTML.includes(mixed.deadline));
const bad=JSON.parse(JSON.stringify(t.getState()));bad.crews[0].stops.push({...bad.crews[1].stops[0]});assert.throws(()=>t.validate(bad));
const migrated=t.migrate({crews:[{name:'Existing',stops:[{id:mixed.id}]}],jobs:{[mixed.id]:{minutes:77}},coords:{}});assert.equal(migrated.crews[0].stops[0].minutes,77);
assert.equal(data.sites.length,73);assert.equal(data.sites.flatMap(s=>s.addresses).length,98);
const weekday=t.getState();const copied=t.bundleFrom(weekday);copied.plans.weekend.crews[1].stops.length=0;assert.equal(weekday.crews[1].stops.length,1);
t.switchPlan('weekend');t.select(0);t.add(mixed.id);handlers.input({target:{id:'start-time',dataset:{},value:'21:30'}});
assert.equal(t.getState().crews[0].startTime,'21:30');assert.equal(weekday.crews[0].startTime,undefined);
t.printSheet();const output=els['print-sheet'].innerHTML;assert(output.includes('21:30'));assert(output.includes('LIBEDARING / SISSEPÄÄSUD'));assert(!output.includes('Laupäev'));assert(!/Tööaeg|tööaeg|Tartumaa|Eesti|Estonia/.test(output));assert(!output.includes(mixed.period));
assert.equal(t.shortAddress('Näidistalu, Näidisküla, Tartumaa, Eesti, Eesti'),'Näidistalu, Näidisküla');
const invalid=t.fresh();invalid.crews[0].startTime='25:90';assert.throws(()=>t.validate(invalid));
const restored=t.readPlan(JSON.parse(saved['murumehed.simple.v3']));assert.equal(restored.plans.weekend.crews[0].startTime,'21:30');
t.switchPlan('weekday');assert.equal(t.getState(),weekday);assert.equal(t.getState().crews[1].stops.length,1);
console.log('Passed: assignments, separate weekday/weekend state, migration, starts, backup roundtrip, compact print and addresses.');

// Sharing across three machines, per-route editing, removal and backup restore.
t.select(2);t.add(mixed.id);handlers.input({target:{dataset:{minutes:mixed.id},value:'25'}});
assert.equal(t.getState().crews[0].stops[0].minutes,mixed.minutes);
assert.equal(t.getState().crews[1].stops[0].minutes,mixed.minutes);
assert.equal(t.getState().crews[2].stops[0].minutes,25);
t.add(mixed.id);assert.equal(t.getState().crews[2].stops.length,1);
const shared=t.readPlan(JSON.parse(saved['murumehed.simple.v3']));
assert.equal(shared.plans.weekday.crews.filter(c=>c.stops.some(st=>st.id===mixed.id)).length,4);
handlers.click({target:{closest:()=>({dataset:{remove:mixed.id}})}});
assert.equal(t.getState().crews[2].stops.length,0);assert.equal(t.getState().crews[0].stops.length,1);assert.equal(t.getState().crews[1].stops.length,1);
t.switchPlan('weekend');t.select(1);t.add(mixed.id);t.validate(t.getState());assert.equal(t.getState().crews[0].stops.length,1);
console.log('Passed: multiple machines, independent times, per-route removal, duplicate prevention and shared-plan restore.');

const oldPlan=t.fresh();delete oldPlan.objectRevision;oldPlan.crews[0].stops=[{id:'T26-052',minutes:45}];oldPlan.crews[2].stops=[{id:'T26-052',minutes:12}];oldPlan.notes['T26-052']='Gate instruction';oldPlan.coords['Vana aadress 1, Tartu, Eesti']=[58.35688,26.71819];
t.validate(oldPlan);assert.equal(oldPlan.crews[0].stops.length,2);assert.equal(oldPlan.crews[0].stops[0].minutes,45);assert.equal(oldPlan.crews[0].stops[1].minutes,null);assert.equal(oldPlan.crews[2].stops[1].id,'T26-052-K');assert.equal(oldPlan.notes['T26-052-K'],'Gate instruction');assert(!oldPlan.coords['Vana aadress 1, Tartu, Eesti']);t.validate(oldPlan);assert.equal(oldPlan.crews[0].stops.length,2);oldPlan.crews[0].stops.pop();t.validate(oldPlan);assert.equal(oldPlan.crews[0].stops.length,1);
assert.equal(data.sites.find(s=>s.id==='T26-052').addresses.length,1);assert.equal(data.sites.find(s=>s.id==='T26-052-K').addresses.length,1);assert.notEqual(data.sites.find(s=>s.id==='T26-052-K').addresses[0],data.sites.find(s=>s.id==='T26-052').addresses[0]);
console.log('Passed: combined T26-052 point, separate T26-052-K object, saved-route migration and independent removal.');

const removedPlan=t.fresh();removedPlan.crews[0].stops=[{id:'T26-070',minutes:15},{id:'T26-071',minutes:20}];removedPlan.crews[5].stops=[{id:'T26-070',minutes:10}];removedPlan.notes['T26-070']='Old note';removedPlan.coords['Eemaldatud aadress 1, Tartu, Eesti']=[58.37452,26.77793];removedPlan.coords[data.sites[0].addresses[0]]=[58.36,26.72];t.validate(removedPlan);assert(removedPlan.coords[data.sites[0].addresses[0]]);assert.equal(removedPlan.crews[0].stops.length,1);assert.equal(removedPlan.crews[0].stops[0].id,'T26-071');assert.equal(removedPlan.crews[0].stops[0].minutes,20);assert.equal(removedPlan.crews[5].stops.length,0);assert(!removedPlan.notes['T26-070']);assert(!removedPlan.coords['Eemaldatud aadress 1, Tartu, Eesti']);assert(!data.sites.some(s=>s.id==='T26-070'));console.log('Passed: retired object removed from saved routes, notes and coordinates; neighbouring object preserved.');

const oldSix=t.fresh();oldSix.crews[5].stops=[{id:hand.id,minutes:12}];const b=t.validateBundle({version:3,plans:{weekday:t.fresh(),weekend:oldSix}});assert.equal(b.plans.weekend.crews.length,4);assert.equal(b.plans.weekend.archivedCrews[1].stops[0].id,hand.id);t.validateBundle(b);assert.equal(b.plans.weekend.archivedCrews.length,2);t.switchPlan('weekend');assert.equal(t.getState().crews.length,4);assert(els['service-filter'].checked);assert(t.filtered().every(s=>t.work(s)!=='machine'));t.select(3);t.add(hand.id);assert(t.getState().crews[3].stops.some(s=>s.id===hand.id));t.select(3);t.switchPlan('weekday');assert.equal(t.getState().crews.length,6);assert(!els['service-filter'].checked);console.log('Passed: four flexible slots, service filter defaults and lossless archive migration.');
