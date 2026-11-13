// Prototype expérimental. Aucun effet sur DiagCore V1.3.
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {containerBootstrap}=require('@nlpjs/core');
const {Nlp}=require('@nlpjs/nlp');
const {LangFr}=require('@nlpjs/lang-fr');
export function normalize(text){
 return text.toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/œ/g,'oe').replace(/['’]/g,' ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
}
// Motifs indépendants du jeu de questions évaluées.
// Une preuve distinctive de domaine est exigée pour accepter une prédiction NLP.js.
const groups = {
 error_message:[/\berreur(?:s)?\b/,/\balerte\b/,/\bcode\b.*\berreur\b/,/\b(message|texte)\b.*\b(affich|ecri|indiqu|ecran|fenetre|dit)\w*/,/\b(fenetre|windows)\b.*\b(affich|dit|indiqu|ecri)\w*/],
 internet_access:[/\binternet\b/,/\bweb\b/,/\bnavigat\w*\b/,/\bgoogle\b/,/\bsite(?:s)?\b/,/\bpage(?:s)?\b.*\b(ouvr|charg|affich)\w*/],
 other_users:[/\bcolleg\w*\b/,/\b(autres?|plusieurs?)\b.*\b(personn|employ|utilisat|gens|poste|pc|ordinateur)\w*/,/\b(autres?|toute)\b.*\b(equipe|service)\b/,/\bseul\b.*\b(concern|touch)\w*/,/\bvoisin\b.*\bbureau\b/],
 since_when:[/\bdepuis\b.*\b(quand|combien|heure|temps)\b/,/\b(quand|moment|heure)\b.*\b(commenc|appar|panne|marche|fonctionn|bloqu|acces)\w*/,/\b(hier|matin|semaine|aujourd hui)\b.*\b(panne|march|fonctionn|bloqu|arriv)\w*/,/\bderniere fois\b.*\b(fonctionn|marche)\w*/],
 which_resource:[/\bquel(?:le)?\b.*\b(dossier|lecteur|ressource|repertoire|partage|chemin)\b/,/\b(nom|lettre|chemin)\b.*\b(dossier|lecteur|partage|repertoire)\b/,/\b(dossier|lecteur|partage|repertoire)\b.*\b(quel|nom|appelle|exactement)\b/],
 connection_type:[/\b(wifi|wi fi|ethernet|filaire)\b/,/\b(cable|cordon|prise)\b.*\b(reseau|branche|raccord)\w*/,/\b(sans fil)\b/,/\bconnexion\b.*\b(cable|reseau|sans fil)\b/],
 location_remote:[/\b(vpn|teletravail|domicile|distance)\b/,/\b(chez vous|de chez vous|a la maison|au bureau|dans les locaux|sur place|dans l entreprise)\b/,/\b(dehors|exterieur)\b.*\b(entreprise|bureau|locaux)\b/],
 account_permissions:[/\b(droits?|permission|autorisation)\b/,/\b(compte|identifiant|mot de passe|session)\b.*\b(utilis|connect|chang|authentif|habituel|professionnel)\w*/,/\b(quel compte|quel identifiant|vos acces)\b/],
 other_resources:[/\b(autres?|tous|plusieurs)\b.*\b(dossier|lecteur|partage|ressource|repertoire)\w*/,/\b(dossier|lecteur|partage|ressource|repertoire)\w*\b.*\b(autres?|tous|plusieurs)\b/],
 actions_already_tried:[/\b(deja|essay|tent|test|redemarr|reboot|relanc|reconnect|deconnect|manipul|fait quelque chose)\w*\b/,/\b(qu avez vous fait|quelles actions|quelles manipulations)\b/]
};
const words = new Set(['et','ou','puis','ainsi','egalement']);
const ambiguous=[
 /^(ca|cela|c est|est ce que ca) (marche|fonctionne|va|bon|possible)\b/,
 /^(et )?les autres\s*$/,
 /^vous (voyez|avez|l avez fait)\b.*$/,
 /^quel est le probleme\b/,
 /^on fait quoi\b/,
 /^ca ne va toujours pas\b/,
 /^ca vient du reseau\b/
];
export async function createHybrid(base,extra){
 const c=await containerBootstrap();c.use(Nlp);c.use(LangFr);
 const nlp=c.get('nlp');nlp.settings.autoSave=false;nlp.addLanguage('fr');
 for(const [intent,list] of Object.entries(base)){
  for(const q of [...list,...(extra[intent]||[])])nlp.addDocument('fr',q,intent);
 }
 await nlp.train();
 return {nlp};
}
export async function interpret(hybrid,text,context={}){
 const s=normalize(text);
 if(!s)return {intent:'REJECT',reason:'empty'};
 if(ambiguous.some(r=>r.test(s))) {
  // « Et les autres ? » : il manque un antécédent explicite.
  if(s==='et les autres'&&context.previousIntent==='other_users')return {intent:'other_users',reason:'context'};
  return {intent:'REJECT',reason:'ambiguous'};
 }
 const matched=Object.entries(groups).filter(([intent,patterns])=>patterns.some(r=>r.test(s))).map(([intent])=>intent);
 // Plus d'un sujet métier : ne jamais répondre sur un seul de manière arbitraire.
 if(matched.length>1)return {intent:'REJECT',reason:'multiple_topics',topics:matched};
 // Le contexte ne sert que pour des formulations explicitement référentielles.
 if(/^(et (pour|chez) (les autres|vos collegues)|et pour (ce dossier|celui ci))\b/.test(s)){
  const intent=/autres|collegues/.test(s)?'other_users':context.previousIntent;
  if(intent&&groups[intent])return {intent,reason:'context'};
 }
 const prediction=await hybrid.nlp.process('fr',text);
 const sorted=(prediction.classifications||[]).filter(x=>x.intent!=='None').sort((a,b)=>b.score-a.score);
 const top=sorted[0]||{intent:prediction.intent,score:prediction.score};
 const runner=sorted[1]?.score||0;
 // Un indice lexical univoque n'est pas suffisant : le classifieur doit corroborer.
 if(matched.length!==1)return {intent:'REJECT',reason:'no_anchor',guess:top.intent,score:top.score};
 if(top.intent!==matched[0])return {intent:'REJECT',reason:'disagreement',anchor:matched[0],guess:top.intent,score:top.score};
 if(top.score<.70||top.score-runner<.12)return {intent:'REJECT',reason:'uncertain',score:top.score,runner};
 return {intent:top.intent,reason:'confirmed',score:top.score};
}
