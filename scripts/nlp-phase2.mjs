import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const train=JSON.parse(readFileSync(new URL('../data/entrainement-60.json',import.meta.url)));
const validation=JSON.parse(readFileSync(new URL('../data/validation-40.json',import.meta.url)));
const oldTest=JSON.parse(readFileSync(new URL('../data/questions-100.json',import.meta.url)));
const {containerBootstrap}=require('@nlpjs/core');
const {Nlp}=require('@nlpjs/nlp');
const {LangFr}=require('@nlpjs/lang-fr');
const normalize=s=>s.toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’]/g,"'").replace(/[?!.,;:]+/g,' ').replace(/\s+/g,' ').trim();
function addVariants(nlp,augmented) {
 for(const [intent, phrases] of Object.entries(train)){
  for(const sentence of phrases){
   nlp.addDocument('fr',sentence,intent);
   if(!augmented)continue;
   const s=sentence.trim().replace(/[?.!]+$/g,'');
   const tail=s.charAt(0).toLowerCase()+s.slice(1);
   for(const variation of ['Bonjour, '+tail+' ?', "S'il vous plaît, "+tail+' ?', 'Et '+tail+' ?']){
    nlp.addDocument('fr',variation,intent);
   }
  }
 }
}
async function model(augmented){
 const container=await containerBootstrap();container.use(Nlp);container.use(LangFr);
 const nlp=container.get('nlp');nlp.settings.autoSave=false;nlp.addLanguage('fr');
 addVariants(nlp,augmented);await nlp.train();return nlp;
}
const baseline=await model(false),extended=await model(true);
const configs=[
 {name:'NLP.js initial 0.70',nlp:baseline,min:.70,margin:0,normal:false},
 {name:'NLP.js original prudent',nlp:baseline,min:.85,margin:.15,normal:false},
 {name:'NLP.js augmentation',nlp:extended,min:.70,margin:0,normal:true},
 {name:'NLP.js augmentation prudente',nlp:extended,min:.85,margin:.15,normal:true}
];
function classify(response,config) {
 const rankings=(response.classifications||[]).filter(v=>v.intent!=='None').sort((a,b)=>b.score-a.score);
 const top=rankings[0]||{intent:response.intent,score:response.score};
 const second=rankings[1]?.score||0;
 if(!top?.intent||top.intent==='None'||top.score<config.min||(config.margin>0&&top.score-second<config.margin))return 'REJECT';
 return top.intent;
}
const results=[];
for(const config of configs){
 for(const [group,items] of [['validation-40',validation],['historique-100',oldTest]]){
  let errors=0,total=0;
  for(const item of items){
   const start=performance.now();
   let predicted='ERROR',confidence=null;
   try{const res=await config.nlp.process('fr',config.normal?normalize(item.question):item.question);confidence=res.score;predicted=classify(res,config);}
   catch(e){errors++;console.error(config.name,item.id,e);}
   const ms=performance.now()-start;total+=ms;
   results.push({...item,dataset:group,configuration:config.name,predicted,confidence,ms});
  }
  const s=results.filter(x=>x.dataset===group&&x.configuration===config.name);
  const correct=s.filter(x=>x.expected===x.predicted).length;
  const wrong=s.filter(x=>x.predicted!=='REJECT'&&x.expected!==x.predicted).length;
  const missed=s.filter(x=>x.predicted==='REJECT'&&x.expected!=='REJECT').length;
  const rejectCorrect=s.filter(x=>x.expected==='REJECT'&&x.predicted==='REJECT').length;
  console.log(JSON.stringify({dataset:group,config:config.name,total:s.length,correct,wrong,missed,correctRejections:rejectCorrect,errors,elapsedMs:+total.toFixed(1)}));
 }
}
mkdirSync('results',{recursive:true});
writeFileSync('results/nlp-phase2.json',JSON.stringify(results,null,2)+'\n');
const e=v=>'"'+String(v??'').replaceAll('"','""')+'"';
writeFileSync('results/nlp-phase2.csv',['dataset;configuration;id;question;expected;predicted;confidence;ms',...results.map(r=>[r.dataset,r.configuration,r.id,r.question,r.expected,r.predicted,r.confidence,r.ms].map(e).join(';'))].join('\n')+'\n');
