// Private object data used by local tests. Never committed (see .gitignore).
const fs=require('node:fs'),path=require('node:path');
const file=path.resolve(__dirname,'../private-data/data.json');
if(!fs.existsSync(file)){console.error('Puudub private-data/data.json. Testid vajavad privaatset objektide faili (vt README).');process.exit(1);}
module.exports=file;
