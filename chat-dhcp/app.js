/* DiagCore Chat Lab : échange contrôlé entre un client et un technicien.
 * Les informations DHCP proviennent du scénario du chapitre 8.
 * Toutes les autres réponses restent prudentes et ne créent aucun fait technique.
 * Aucun appel LLM, aucune reconnaissance de texte, aucun appel serveur. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const questions=[
{id:"scope",text:"Est-ce que tous les ordinateurs sont concernés ?",answer:"Non, seuls les PC du VLAN 30 ont le problème. Ceux du VLAN 10 fonctionnent normalement.",repeat:"Comme je vous l'ai indiqué, le VLAN 10 fonctionne. Le problème concerne le VLAN 30."},
{id:"when",text:"Depuis quand rencontrez-vous ce problème ?",answer:"Depuis ce matin.",repeat:"Depuis ce matin, oui."},
{id:"symptoms",text:"Que se passe-t-il exactement sur les ordinateurs concernés ?",answer:"Ils n'arrivent plus à accéder au réseau. Je ne peux pas vous donner davantage de détails techniques.",repeat:"Ils n'ont toujours pas accès au réseau."},
{id:"others",text:"Est-ce que d'autres personnes rencontrent le même problème ?",answer:"Oui, plusieurs postes sont concernés. Ce n'est pas seulement mon ordinateur.",repeat:"Oui, plusieurs PC sont concernés."},
{id:"location",text:"Sur quel site se trouvent les ordinateurs concernés ?",answer:"Sur le site de Rennes.",repeat:"Nous sommes sur le site de Rennes."},
{id:"changed",text:"Avez-vous remarqué un changement avant l'incident ?",answer:"Je n'ai pas remarqué de changement particulier.",repeat:"Non, rien de particulier à ma connaissance."},
{id:"reboot",text:"Avez-vous essayé de redémarrer un ordinateur concerné ?",answer:"Je ne sais pas si cela a été fait sur tous les PC concernés.",repeat:"Je n'ai pas cette information."},
{id:"internet",text:"Pouvez-vous accéder à Internet depuis un PC concerné ?",answer:"Non, les PC concernés n'ont pas accès au réseau.",repeat:"Non, le problème de réseau est toujours présent."},
{id:"message",text:"Quel message d'erreur apparaît à l'écran ?",answer:"Je n'ai pas de message d'erreur précis à vous communiquer.",repeat:"Je ne peux pas vous donner de message précis."},
{id:"technical",text:"Connaissez-vous l'adresse IP des ordinateurs concernés ?",answer:"Non, je ne connais pas leurs adresses IP. Vous devrez les contrôler.",repeat:"Non, je ne connais pas leurs adresses IP."},
{id:"availability",text:"Pouvez-vous me donner accès à un ordinateur concerné pour effectuer des vérifications ?",answer:"Oui, nous pouvons organiser un accès à un poste concerné pour vos contrôles.",repeat:"Oui, un poste concerné pourra être mis à votre disposition."},
{id:"relay",text:"Savez-vous si le relais DHCP du VLAN 30 est configuré ?",answer:"Non, je ne connais pas ce réglage. Il faudra le vérifier sur les équipements réseau.",repeat:"Je ne connais pas cette configuration."}
];
const closing={id:"close",text:"Merci Sophie. Je vais maintenant effectuer les vérifications techniques.",answer:"Merci. Tenez-moi au courant de ce que vous trouvez."};
const byId=new Map(questions.map(q=>[q.id,q]));
let asked=new Set(),selected=null,rounds=0,finished=false;
const nextIds=["scope","when","symptoms","others","location","changed","reboot","internet","message","technical","availability","relay"];
function write(role,message){
 const e=document.createElement("div");e.className="bubble "+role;
 const who=document.createElement("span");who.className="name";who.textContent=role==="sophie"?"Sophie Martin":"Technicien";
 const txt=document.createElement("p");txt.className="message";txt.textContent=message;
 e.append(who,txt);$("conversation").append(e);
 requestAnimationFrame(()=>{$("conversation").scrollTop=$("conversation").scrollHeight;});
}
function note(text){
 const p=document.createElement("p");p.className="system-note";p.textContent=text;$("conversation").append(p);
}
function candidates(){
 // Une sélection évolutive : les premières questions servent à cadrer l'incident.
 // Les autres deviennent disponibles progressivement, sans imposer d'ordre.
 if(rounds===0)return ["scope","when","symptoms","others","location","message"];
 const available=nextIds.filter(id=>!asked.has(id));
 const priority=available.filter(id=>["scope","when","symptoms","others","location","message"].includes(id));
 const others=available.filter(id=>!priority.includes(id));
 const result=[...priority.slice(0,3),...others.slice(0,Math.max(0,5-priority.slice(0,3).length))];
 return result.slice(0,5);
}
function render(){
 const area=$("suggestions");area.replaceChildren();selected=null;$("send").disabled=true;
 const ids=finished?[]:candidates();
 for(const id of ids){
  const q=byId.get(id);const button=document.createElement("button");button.type="button";button.textContent=q.text;button.setAttribute("aria-pressed","false");
  button.addEventListener("click",()=>{selected=q;[...area.children].forEach(b=>b.setAttribute("aria-pressed",String(b===button)));$("preview").textContent=q.text;$("send").disabled=false;});
  area.append(button);
 }
 if(!finished&&rounds>=2){
  const b=document.createElement("button");b.type="button";b.textContent=closing.text;b.setAttribute("aria-pressed","false");
  b.addEventListener("click",()=>{selected=closing;[...area.children].forEach(x=>x.setAttribute("aria-pressed",String(x===b)));$("preview").textContent=closing.text;$("send").disabled=false;});area.append(b);
 }
 if(finished){
  $("preview").textContent="Échange terminé. Tu peux recommencer pour essayer d'autres questions.";
  note("La conversation est terminée. Le diagnostic technique reste à réaliser dans DiagCore.");
 }else if(ids.length===0){
  $("preview").textContent="Toutes les informations disponibles ont été demandées. Tu peux clôturer l'échange.";
 }else{$("preview").textContent="Sélectionne un message.";}
}
function send(){
 if(!selected||finished)return;
 const q=selected;write("tech",q.text);rounds++;
 const reply=asked.has(q.id)?q.repeat:q.answer;
 asked.add(q.id);
 write("sophie",reply);
 if(q.id===closing.id)finished=true;
 render();
}
function restart(){
 asked=new Set();selected=null;rounds=0;finished=false;$("conversation").replaceChildren();
 write("sophie","Bonjour,\nPlusieurs ordinateurs de notre site n'arrivent plus à accéder au réseau. Pouvez-vous regarder ?\nMerci, Sophie.");
 render();
}
$("restart").addEventListener("click",restart);$("send").addEventListener("click",send);restart();
})();