import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const questions=JSON.parse(readFileSync(new URL('../data/questions-100.json',import.meta.url)));
const train=JSON.parse(readFileSync(new URL('../data/entrainement-60.json',import.meta.url)));
const examples=Object.entries(train).flatMap(([intent,phrases])=>phrases.map((phrase,i)=>({id:intent+'-'+i,intent,phrase})));
const normalize=s=>s.toLocaleLowerCase('fr-FR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
function rank(scores,minimum,gap,reverse=false){
 const sorted=Object.entries(scores).sort((a,b)=>reverse?a[1]-b[1]:b[1]-a[1]);
 if(!sorted.length)return 'REJECT';
 if(reverse?sorted[0][1]>minimum:sorted[0][1]<minimum)return 'REJECT';
 if(sorted[1]&&(reverse?sorted[1][1]-sorted[0][1]<gap:sorted[0][1]-sorted[1][1]<gap))return 'REJECT';
 return sorted[0][0];
}
const methods=[];
try{
 const {default:Fuse}=await import('fuse.js');
 const fuse=new Fuse(examples.map(x=>({...x,phrase:normalize(x.phrase)})),{keys:['phrase'],includeScore:true,ignoreLocation:true,threshold:.52,useTokenSearch:true});
 methods.push({name:'Fuse.js 7.5.0',predict:async q=>{
  const hits=fuse.search(normalize(q),{limit:20}),mins={};
  for(const {item,score} of hits)mins[item.intent]=Math.min(mins[item.intent]??1,score);
  return rank(mins,.43,.045,true);
 }});
}catch(e){console.error('Fuse.js indisponible:',e);}
try{
 const {default:MiniSearch}=await import('minisearch');
 const mini=new MiniSearch({fields:['phrase'],storeFields:['intent'],searchOptions:{fuzzy:.2,prefix:true,combineWith:'OR'}});
 mini.addAll(examples.map(x=>({...x,phrase:normalize(x.phrase)})));
 methods.push({name:'MiniSearch 7.2.0',predict:async q=>{
  const tops={};for(const h of mini.search(normalize(q)))tops[h.intent]=Math.max(tops[h.intent]??0,h.score);
  const sorted=Object.entries(tops).sort((a,b)=>b[1]-a[1]);
  if(!sorted.length||sorted[0][1]<1.3||(sorted[1]&&sorted[0][1]<1.22*sorted[1][1]))return 'REJECT';
  return sorted[0][0];
 }});
}catch(e){console.error('MiniSearch indisponible:',e);}
try{
 const {containerBootstrap}=require('@nlpjs/core');
 const {Nlp}=require('@nlpjs/nlp');
 const {LangFr}=require('@nlpjs/lang-fr');
 const container=await containerBootstrap();container.use(Nlp);container.use(LangFr);
 const nlp=container.get('nlp');nlp.settings.autoSave=false;nlp.addLanguage('fr');
 for(const x of examples)nlp.addDocument('fr',x.phrase,x.intent);
 await nlp.train();
 methods.push({name:'NLP.js 5.0.0-alpha.5',predict:async q=>{
  const r=await nlp.process('fr',q);
  return r.score>=.7&&r.intent!=='None'?r.intent:'REJECT';
 }});
}catch(e){console.error('NLP.js indisponible:',e);}
if(!methods.length)throw Error('Aucune bibliothèque chargée');
const outputs=[];
for(const {name,predict} of methods){
 let elapsed=0,errors=0;
 for(const {id,question,expected,category} of questions){
  const start=performance.now();let predicted;
  try{predicted=await predict(question);}catch(e){predicted='ERROR';errors++;console.error(name,id,e);}
  const duration=performance.now()-start;elapsed+=duration;
  outputs.push({id,question,expected,category,engine:name,predicted,ms:duration});
 }
 const rows=outputs.filter(x=>x.engine===name);
 const correct=rows.filter(x=>x.expected===x.predicted).length;
 const wrong=rows.filter(x=>x.predicted!=='REJECT'&&x.predicted!==x.expected).length;
 const refused=rows.filter(x=>x.predicted==='REJECT'&&x.expected!=='REJECT').length;
 console.log(JSON.stringify({engine:name,correct,wrong,refused,errors,elapsedMs:+elapsed.toFixed(1)}));
}
mkdirSync('results',{recursive:true});
writeFileSync('results/results.json',JSON.stringify(outputs,null,2)+'\n');
const esc=s=>'"'+String(s??'').replaceAll('"','""')+'"';
writeFileSync('results/results.csv',['id;question;expected;category;engine;predicted;ms',...outputs.map(x=>[x.id,x.question,x.expected,x.category,x.engine,x.predicted,x.ms.toFixed(3)].map(esc).join(';'))].join('\n')+'\n');
