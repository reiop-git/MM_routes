(function(){
'use strict';
let font;
async function getFont(){if(font)return font;const r=await fetch('vendor/NotoSans.ttf');if(!r.ok)throw Error('Font unavailable');const bytes=new Uint8Array(await r.arrayBuffer());let text='';for(let n=0;n<bytes.length;n+=8192)text+=String.fromCharCode(...bytes.subarray(n,n+8192));font=btoa(text);return font;}
function pdf(route,label,fontData){
const doc=new window.jspdf.jsPDF();doc.addFileToVFS('NotoSans.ttf',fontData);doc.addFont('NotoSans.ttf','NotoSans','normal');doc.setFont('NotoSans');
doc.setDrawColor(route.color);doc.setLineWidth(1.5);doc.line(14,14,196,14);
doc.setTextColor('#536259');doc.setFontSize(9);doc.text('MURUMEHED · '+label,14,22);
doc.setTextColor(route.color);doc.setFontSize(19);const name=doc.splitTextToSize(route.name,182);doc.text(name,14,32);
const y=35+name.length*8;doc.setFontSize(10);doc.setTextColor('#21382a');doc.text('Algus: '+route.start+'  ·  '+route.rows.length+' objekti',14,y);
doc.autoTable({startY:y+7,head:[['#','Objekt / aadress','Hiljemalt','Töö ja ligipääs']],body:route.rows.length?route.rows:[['','Objekte pole määratud','','']],styles:{font:'NotoSans',fontStyle:'normal',fontSize:9,cellPadding:3,overflow:'linebreak'},headStyles:{fillColor:route.color,fontStyle:'normal'},alternateRowStyles:{fillColor:[243,246,240]},columnStyles:{0:{cellWidth:10},1:{cellWidth:64},2:{cellWidth:25},3:{cellWidth:83}},margin:{top:15,bottom:16,left:14,right:14},rowPageBreak:'avoid'});
const pages=doc.getNumberOfPages();for(let p=1;p<=pages;p++){doc.setPage(p);doc.setFontSize(8);doc.setTextColor('#59635c');doc.text(p+' / '+pages,196,289,{align:'right'});}return doc.output('arraybuffer');
}
window.DriverExport={pdf,async zip(routes,label){const fontData=await getFont(),zip=new window.JSZip();routes.forEach((r,i)=>{const name=r.name.replace(/[<>:"/\\|?*\x00-\x1f]/g,'-').trim().slice(0,80)||'Masin';zip.file(String(i+1).padStart(2,'0')+'-'+name+'.pdf',pdf(r,label,fontData));});return zip.generateAsync({type:'blob',compression:'DEFLATE'});}};
})();
