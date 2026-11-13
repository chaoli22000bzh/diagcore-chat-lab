import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {createHybrid,interpret} from './hybrid-engine.mjs';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url)));
const base=read('../data/entrainement-60.json'),extra=read('../data/phase3-exemples-additionnels.json');
const datasets=[['validation-40',read('../data/validation-40.json')],['historique-100',read('../data/questions-100.json')],['controle-40-inédit',read('../data/phase3-controle-40.json')]];
const model=await createHybrid(base,extra);
const results=[];
for(const [name,questions] of datasets){
 for(const item of questions){
  const t=performance.now();
  let result;
  try{result=await interpret(model,item.question)}catch(e){result={intent:'ERROR',reason:e.message};}
  results.push({...item,dataset:name,predicted:result.intent,reason:result.reason,ms:performance.now()-t});
 }
 const rows=results.filter(x=>x.dataset===name);
 const correct=rows.filter(x=>x.expected===x.predicted).length;
 const wrong=rows.filter(x=>x.predicted!=='REJECT'&&x.expected!==x.predicted).length;
 const missed=rows.filter(x=>x.predicted==='REJECT'&&x.expected!=='REJECT').length;
 const rejectCorrect=rows.filter(x=>x.predicted==='REJECT'&&x.expected==='REJECT').length;
 console.log(JSON.stringify({dataset:name,correct,wrong,missed,rejectCorrect,errors:rows.filter(x=>x.predicted==='ERROR').length,counts:rows.length}));
}
const contextCases=[
 {question:'Et les autres ?',context:{previousIntent:'other_users'},expected:'other_users'},
 {question:'Et les autres ?',context:{},expected:'REJECT'},
 {question:'Ça marche ?',context:{previousIntent:'internet_access'},expected:'REJECT'},
 {question:'Internet et les autres partages fonctionnent ?',context:{},expected:'REJECT'},
 {question:'Vous travaillez au bureau ou sur le VPN ?',context:{},expected:'location_remote'},
 {question:'Quel est le message d erreur et depuis quand ?',context:{},expected:'REJECT'}
];
for(const item of contextCases){
 const got=await interpret(model,item.question,item.context);
 console.log(JSON.stringify({contextCase:item.question,expected:item.expected,got:got.intent,reason:got.reason}));
}
mkdirSync('results',{recursive:true});
writeFileSync('results/phase3.json',JSON.stringify(results,null,2)+'\n');
const quote=x=>'"'+String(x??'').replaceAll('"','""')+'"';
writeFileSync('results/phase3.csv',['dataset;id;question;expected;predicted;reason;ms',...results.map(x=>[x.dataset,x.id,x.question,x.expected,x.predicted,x.reason,x.ms.toFixed(3)].map(quote).join(';'))].join('\n')+'\n');
