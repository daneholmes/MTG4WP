(()=>{"use strict";var e,t={21:()=>{const e=window.wp.blocks,t=window.React,a=window.wp.element,n=window.wp.components,o=window.wp.blockEditor,r=window.wp.i18n,l=(e,t)=>e.cmc!==t.cmc?e.cmc-t.cmc:e.name.localeCompare(t.name),c=e=>e.length+1,s=(e,a)=>(c(a),a.length>0?(0,t.createElement)("div",{key:e},(0,t.createElement)("h2",{className:"has-small-font-size"},`${e} (${(e=>e.reduce(((e,t)=>e+(t.quantity||1)),0))(a)})`),(0,t.createElement)("div",{className:"mtg-tools-card-category"},a.map(((e,a)=>(0,t.createElement)("div",{key:e.id||a,className:"mtg-tools-card has-small-font-size","data-card-name":e.scryfallName||e.name,"data-card-front-image-uri":e.frontImage||"","data-card-back-image-uri":e.backImage||"","data-card-foil":e.foil?"Yes":"No"},(0,t.createElement)("span",{className:"mtg-tools-quantity"},e.quantity||1),(0,t.createElement)("div",{className:"mtg-tools-card-wrapper"},(0,t.createElement)("a",{href:e.scryfall_uri,target:"_blank",rel:"noopener noreferrer",className:"mtg-tools-card-name"},e.scryfallName||e.name),e.backImage&&(0,t.createElement)("div",{className:"mtg-tools-flip-button"},(0,t.createElement)("button",{className:"mtg-tools-flip dashicons dashicons-image-rotate",type:"button"})))))))):null),m=JSON.parse('{"UU":"mtg-tools/mtg-tools"}');(0,e.registerBlockType)(m.UU,{edit:function({attributes:e,setAttributes:l}){const c=(0,o.useBlockProps)(),[s,m]=(0,a.useState)(e.cards||[]),[i,d]=(0,a.useState)(!1),u=["Creature","Land","Artifact","Enchantment","Planeswalker","Battle","Instant","Sorcery"];(0,a.useEffect)((()=>{d(!0),Promise.all(s.map(((e,t)=>(async(e,t)=>{let a="";a=e.set&&e.number?`https://api.scryfall.com/cards/${encodeURIComponent(e.set)}/${encodeURIComponent(e.number)}`:`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(e.name)}&set=${encodeURIComponent(e.set)}`;try{const n=await fetch(a),o=await n.json();if(!o.status){const a=[...s];let n=null,r=null,c="",i="",d=e.name;"modal_dfc"===o.layout||"transform"===o.layout?(n=o.card_faces?.[0]?.image_uris?.normal||null,r=o.card_faces?.[1]?.image_uris?.normal||null,c=o.card_faces?.[0]?.mana_cost,i=o.card_faces?.[0]?.type_line,d=o.card_faces?.[0]?.name):"adventure"===o.layout?(n=o.image_uris?.normal||null,c=o.mana_cost,i=o.card_faces?.[0]?.type_line||o.type_line,d=o.card_faces?.[0]?.name||o.name):(n=o.image_uris?.normal||null,c=o.mana_cost,i=o.type_line,d=o.name);const p=(e=>{const t=e.split(" ");for(let e of u)if(t.includes(e))return e;return t[0]||"Unknown"})(i);a[t]={...a[t],scryfallName:d,scryfallSet:o.set_name,scryfallCollectorNumber:o.collector_number,cmc:o.cmc,manaCost:c,type:p,frontImage:n,backImage:r,scryfall_uri:o.scryfall_uri},m(a),l({cards:a})}}catch(e){console.error(`Error fetching card data: ${e}`)}finally{d(!1),console.log("Fetch operation completed.")}})(e,t)))).then((()=>{d(!1)}))}),[s.map((e=>`${e.name}-${e.set}-${e.number}`)).join(",")]);const p=(e,t,a)=>{const n=[...s];n[e][t]=a,m(n),l({cards:n})};return(0,t.createElement)("div",{...c},i&&(0,t.createElement)(n.Spinner,null),s.map(((e,a)=>(0,t.createElement)("div",{key:a,className:"mtg-card"},(0,t.createElement)(n.TextControl,{label:(0,r.__)("Name","mtg-tools"),value:e.name,onChange:e=>p(a,"name",e)}),(0,t.createElement)(n.TextControl,{label:(0,r.__)("Set","mtg-tools"),value:e.set,onChange:e=>p(a,"set",e)}),(0,t.createElement)(n.TextControl,{label:(0,r.__)("Number","mtg-tools"),value:e.number,onChange:e=>p(a,"number",e)}),(0,t.createElement)(n.TextControl,{label:(0,r.__)("Quantity","mtg-tools"),type:"number",value:e.quantity,onChange:e=>p(a,"quantity",parseInt(e))}),(0,t.createElement)(n.CheckboxControl,{label:(0,r.__)("Commander","mtg-tools"),checked:e.commander,onChange:e=>p(a,"commander",e)}),(0,t.createElement)(n.CheckboxControl,{label:(0,r.__)("Foil","mtg-tools"),checked:e.foil,onChange:e=>p(a,"foil",e)}),(0,t.createElement)(n.Button,{isDestructive:!0,onClick:()=>(e=>{const t=s.filter(((t,a)=>a!==e));m(t),l({cards:t})})(a)},(0,r.__)("Remove Card","mtg-tools"))))),(0,t.createElement)(n.Button,{isPrimary:!0,onClick:()=>{const e={name:"",set:"",number:"",quantity:1,commander:!1,foil:!1};m([...s,e]),l({cards:[...s,e]})}},(0,r.__)("Add Card","mtg-tools")))},save:function({attributes:e}){const a=o.useBlockProps.save(),{cards:n=[]}=e,r=n.filter((e=>e.commander)).sort(l),m=[{type:"Artifacts",condition:e=>"Artifact"===e.type&&!e.commander},{type:"Battles",condition:e=>"Battle"===e.type&&!e.commander},{type:"Creatures",condition:e=>"Creature"===e.type&&!e.commander},{type:"Planeswalkers",condition:e=>"Planeswalker"===e.type&&!e.commander},{type:"Enchantments",condition:e=>"Enchantment"===e.type&&!e.commander},{type:"Instants",condition:e=>"Instant"===e.type&&!e.commander},{type:"Sorceries",condition:e=>"Sorcery"===e.type&&!e.commander},{type:"Lands",condition:e=>"Land"===e.type&&!e.commander}].reduce(((e,t)=>(e[t.type]=n.filter(t.condition).sort(l),e)),{}),i={Commander:r,...m},d=Object.values(i).reduce(((e,t)=>e+c(t)),0),u=Math.ceil(d/2);let p={},f={},g=0;for(const[e,t]of Object.entries(i)){const a=c(t);g+a<=u||0===Object.keys(p).length?(p[e]=t,g+=a):f[e]=t}const y=r[0]||Object.values(m).flat()[0],b=y?.frontImage||"../assets/mtg_card_back.png",_=y?.scryfallName||"Magic: The Gathering Card",h=y?.foil?"Yes":"No";return(0,t.createElement)("div",{...a,className:"mtg-tools-container"},(0,t.createElement)("div",{className:"mtg-tools-column mtg-tools-image-column"},(0,t.createElement)("div",{className:"mtg-tools-sticky"},(0,t.createElement)("img",{id:"mtg-tools-default-image",src:b,alt:_,className:"mtg-tools-image","data-foil":h}),y?.foil&&(0,t.createElement)("div",{className:"mtg-tools-gradient-overlay"}))),(0,t.createElement)("div",{className:"mtg-tools-column"},Object.entries(p).map((([e,t])=>s(e,t)))),(0,t.createElement)("div",{className:"mtg-tools-column"},Object.entries(f).map((([e,t])=>s(e,t)))))}})}},a={};function n(e){var o=a[e];if(void 0!==o)return o.exports;var r=a[e]={exports:{}};return t[e](r,r.exports,n),r.exports}n.m=t,e=[],n.O=(t,a,o,r)=>{if(!a){var l=1/0;for(i=0;i<e.length;i++){for(var[a,o,r]=e[i],c=!0,s=0;s<a.length;s++)(!1&r||l>=r)&&Object.keys(n.O).every((e=>n.O[e](a[s])))?a.splice(s--,1):(c=!1,r<l&&(l=r));if(c){e.splice(i--,1);var m=o();void 0!==m&&(t=m)}}return t}r=r||0;for(var i=e.length;i>0&&e[i-1][2]>r;i--)e[i]=e[i-1];e[i]=[a,o,r]},n.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),(()=>{var e={57:0,350:0};n.O.j=t=>0===e[t];var t=(t,a)=>{var o,r,[l,c,s]=a,m=0;if(l.some((t=>0!==e[t]))){for(o in c)n.o(c,o)&&(n.m[o]=c[o]);if(s)var i=s(n)}for(t&&t(a);m<l.length;m++)r=l[m],n.o(e,r)&&e[r]&&e[r][0](),e[r]=0;return n.O(i)},a=globalThis.webpackChunkmtg_tools=globalThis.webpackChunkmtg_tools||[];a.forEach(t.bind(null,0)),a.push=t.bind(null,a.push.bind(a))})();var o=n.O(void 0,[350],(()=>n(21)));o=n.O(o)})();