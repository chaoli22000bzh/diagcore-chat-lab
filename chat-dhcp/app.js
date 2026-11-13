// Interface d'essai exclusivement. Le moteur et les conditions viennent de DiagCore 1.3.
const $=id=>document.getElementById(id);
const engineRoot=$("engine-host");
const scenario=window.DHCP_DIAGNOSTIC_SCENARIO;
let app=null,choice=null,oldEntries=0,chosenCategory=null;
const sourceImages="https://chaoli22000bzh.github.io/portails-pedagogiques/ressources/dhcp/";
function say(who,text,role){
 const e=document.createElement("div");e.className="msg "+role;
 const name=document.createElement("span");name.className="who";name.textContent=who;
 const textNode=document.createElement("div");textNode.textContent=text;e.append(name,textNode);
 $("messages").append(e);toBottom();return e;
}
function notice(message){
 const e=document.createElement("div");e.className="msg notice";e.textContent=message;
 $("messages").append(e);toBottom();
}
function toBottom(){const m=$("messages");requestAnimationFrame(()=>{m.scrollTop=m.scrollHeight;});}
function appendReport(node){
 const e=document.createElement("div");
 e.className="msg result"+(node.classList.contains("diagcore__entry--action")?" success":"");
 const who=document.createElement("span");who.className="who";who.textContent="Compte rendu du diagnostic";
 e.append(who);
 for(const child of node.children){
   const c=child.cloneNode(true);
   // Les images du scénario utilisent des chemins relatifs au cours, pas à ce laboratoire.
   const imgs=c.tagName==="IMG"?[c]:[...c.querySelectorAll("img")];
   imgs.forEach(img=>{const raw=img.getAttribute("src")||"";if(raw.startsWith("./"))img.src=new URL(raw.slice(2),sourceImages).href;});
   e.append(c);
 }
 $("messages").append(e);toBottom();
}
function outputNewEntries(){
 const nodes=[...engineRoot.querySelectorAll(".diagcore__timeline > .diagcore__entry")];
 for(let i=oldEntries;i<nodes.length;i++)appendReport(nodes[i]);
 oldEntries=nodes.length;
}
function getNext(){return engineRoot.querySelector(".diagcore__next");}
function setChoice(button){
 choice=button;
 $("selected-preview").textContent=button?button.textContent.trim():"Sélectionne une proposition.";
 $("send").disabled=!button;
 [...$("choices").children].forEach(b=>b.classList.toggle("chosen",b.dataset.index===String([...getChoices()].indexOf(choice))));
}
function getChoices(){const next=getNext();return next?[...next.querySelectorAll("button.diagcore__choice")].filter(el=>!el.classList.contains("diagcore__equipment")&&!el.classList.contains("diagcore__equipment-back")):[];}
function controls(){
 const next=getNext();if(!next)return;
 choice=null;$("send").disabled=true;$("selected-preview").textContent="Sélectionne une proposition.";
 const heading=next.querySelector(".diagcore__title");
 $("selection-title").textContent=heading?.textContent||"Choisir une vérification";
 const categories=$("categories");categories.replaceChildren();
 const groups=[...next.querySelectorAll(".diagcore__equipment")];
 if(groups.length){
   chosenCategory=null;
   groups.forEach(group=>{
     const b=document.createElement("button");b.type="button";b.textContent=group.textContent;
     b.addEventListener("click",()=>{group.click();controls();});
     categories.append(b);
   });
   $("choices").replaceChildren();
   $("selected-preview").textContent="Choisis d'abord un équipement.";
   $("status").textContent="Les vérifications restent disponibles, même après utilisation.";
 }else{
   const back=next.querySelector(".diagcore__equipment-back");
   if(back){
     const b=document.createElement("button");b.type="button";b.textContent="← Autres équipements";b.addEventListener("click",()=>{back.click();controls();});categories.append(b);
   }
   if(next.querySelector(".diagcore__group-title")){
     const tag=document.createElement("span");tag.className="hint";tag.textContent="Équipement : "+next.querySelector(".diagcore__group-title").textContent;categories.append(tag);
   }
   const choices=getChoices();const host=$("choices");host.replaceChildren();
   choices.forEach((item,index)=>{
      const b=document.createElement("button");b.type="button";b.dataset.index=String(index);b.textContent=item.textContent;
      if(item.classList.contains("diagcore__choice--visited"))b.classList.add("visited");
      if(item.disabled)b.disabled=true;
      b.addEventListener("click",()=>{choice=item;$("selected-preview").textContent=item.textContent;$("send").disabled=false;[...host.children].forEach(x=>x.classList.toggle("chosen",x===b));});
      host.append(b);
   });
   if(!choices.length){
      const complete=next.querySelector(".diagcore__complete");
      if(complete){$("selected-preview").textContent="Diagnostic terminé.";notice(complete.textContent);}
   }
 }
 const done=app?.getCompleted()||[];
 $("count").textContent=done.length+" vérification"+(done.length>1?"s":"")+" réalisée"+(done.length>1?"s":"");
}
function send(){
 if(!choice||choice.disabled)return;
 const picked=choice;
 say("Technicien",picked.textContent.trim(),"technician");
 picked.click();
 outputNewEntries();controls();
 // Rendre les résultats du vrai DiagCore en gardant la conversation en bas.
 toBottom();
}
function init(){
 if(!window.DiagCore?.version?.startsWith("1.3.")||!scenario){
   $("messages").textContent="Impossible de charger DiagCore V1.3 ou le scénario DHCP.";return;
 }
 app=window.DiagCore.mount(engineRoot,scenario,{mode:"vertical"});
 oldEntries=0;choice=null;
 $("messages").replaceChildren();
 say("Sophie Martin","Bonjour,\nDepuis ce matin, les PC du VLAN 30 n'ont plus accès au réseau.\nLes PC du VLAN 10 fonctionnent normalement.\nPouvez-vous trouver la panne et proposer une solution ?\nMerci, Sophie Martin.","client");
 controls();
 $("status").textContent="Choisis une catégorie, puis une action à envoyer.";
}
$("restart").addEventListener("click",()=>{if(app)app.restart();init();});
$("send").addEventListener("click",send);
init();
