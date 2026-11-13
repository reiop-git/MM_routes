// Fails if client data could be published. Runs in CI (generic checks) and locally
// (also compares every repository file against the private object data and backups).
const fs=require('node:fs'),path=require('node:path'),{execSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');process.chdir(root);
const problems=[];
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name).split(path.sep).join('/')]);
const text=f=>/\.(html|js|cjs|css|json|md|txt|yml|yaml)$/i.test(f)||!path.extname(f);

// 1. Published folder: only known app files, never data files.
const site=walk('dist');
for(const f of site){if(/(^|\/)data\.(js|json)$/i.test(f)||/\.json$/i.test(f)&&!f.startsWith('dist/vendor/'))problems.push(f+': andmefail avaldatavas kaustas');}
if(/data\.js/.test(fs.readFileSync('dist/index.html','utf8')))problems.push('dist/index.html: viitab data.js failile');

// 2. Repository files that would be committed (tracked + untracked, minus ignored).
let repo;try{repo=execSync('git ls-files --cached --others --exclude-standard',{encoding:'utf8'}).split('\n').filter(Boolean).filter(f=>fs.existsSync(f));}catch{repo=walk('.').filter(f=>!f.startsWith('.git/'));}
for(const f of repo)if(/^(private-data|private-backups)\//.test(f))problems.push(f+': privaatne fail oleks repos');
const scan=[...new Set([...repo,...site])].filter(f=>text(f)&&!f.startsWith('dist/vendor/')&&f!=='scripts/leak-check.cjs');

// Generic patterns: e-mail addresses and Estonian phone numbers.
const generic=[[/[\w.+-]+@[\w-]+\.[\w.-]+/g,'e-posti aadress'],[/(?:\+372[ -]?)?\b5\d{2}[ -]?\d{4,5}\b/g,'telefoninumber']];
const allowEmail=/noreply@anthropic\.com/;

// Private values, when this machine has them.
const needles=[];
const add=(v,kind)=>{v=String(v||'').trim();if(v.length>=5)needles.push([v.toLocaleLowerCase('et'),kind]);};
if(fs.existsSync('private-data/data.json')){
for(const s of JSON.parse(fs.readFileSync('private-data/data.json','utf8')).sites){
add(s.client,'kliendi nimi '+s.id);
for(const a of s.addresses){add(a.split(',')[0],'aadress '+s.id);}
if(/[A-Z]{3}/.test(s.id))add(s.id,'aadressiga tunnus');
for(const p of String(s.phone||'').split(/[,;/]|\s{2,}/))if(/\d{5}/.test(p))add(p.replace(/\s+/g,' '),'telefon '+s.id);
for(const e of String(s.email||'').split(/[,;\s]+/))if(e.includes('@'))add(e,'e-post '+s.id);
for(const n of String(s.notes||'').split(/[.!?\n]/))if(n.trim().length>=25)add(n,'märkus '+s.id);
}
}
const words=new Set();
if(fs.existsSync('private-backups'))for(const f of fs.readdirSync('private-backups').filter(f=>f.endsWith('.json'))){
const b=JSON.parse(fs.readFileSync(path.join('private-backups',f),'utf8'));
for(const p of Object.values(b.plans||{})){for(const c of [...(p.crews||[]),...(p.archivedCrews||[])])for(const w of String(c.name).split(/[\s/,-]+/))if(w.length>=4&&!/^(masin|ring|brigaad|käsitöö|reserv|tartu)/i.test(w))words.add(w.toLocaleLowerCase('et'));for(const n of Object.values(p.notes||{}))for(const x of String(n).split(/[.!?\n]/))if(x.trim().length>=25)add(x,'juhis ('+f+')');}
}

for(const f of scan){
const body=fs.readFileSync(f,'utf8'),low=body.toLocaleLowerCase('et');
for(const [re,kind] of generic)for(const m of body.match(re)||[])if(!(kind==='e-posti aadress'&&allowEmail.test(m)))problems.push(f+': '+kind+' "'+m+'"');
for(const [n,kind] of needles)if(low.includes(n))problems.push(f+': '+kind+' "'+n.slice(0,40)+'"');
for(const w of words)if(new RegExp('(?<!\\p{L})'+w+'(?!\\p{L})','u').test(low))problems.push(f+': ringi/töötaja nimi "'+w+'"');
}

const unique=[...new Set(problems)];
if(unique.length){console.error('LEKKE KONTROLL EBAÕNNESTUS:\n'+unique.map(p=>' - '+p).join('\n'));process.exit(1);}
console.log('Passed: leak check ('+scan.length+' files'+(needles.length?', '+(needles.length+words.size)+' private values compared':', generic patterns only')+').');
