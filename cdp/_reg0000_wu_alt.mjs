import { CDP, sleep } from './CDP.mjs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && /writeupcafe\.com/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
// JS 设 alt + excerpt + slug + seo 字段
console.log('SET:', await c.evalT(`(function(){var set=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set; var st=Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value').set; function ip(sel,v){var e=document.querySelector(sel); if(!e) return 'NO:'+sel; if(e.tagName==='TEXTAREA') st.call(e,v); else set.call(e,v); e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true})); return 'ok';} var r=[]; r.push(ip('input[name=alt_text]','A workbench in a bicycle shop with tools and a half-built cargo bike frame.')); r.push(ip('textarea[name=excerpt]','A bicycle mechanic starts a slow blog: first notes, small repairs, and the case for writing without a feed.')); r.push(ip('input[name=focus_keyword]','slow blogging')); r.push(ip('input[name=seo_title]','Settling In: First Notes From a New Writing Spot')); r.push(ip('textarea[name=meta_description]','A bicycle mechanic starts a slow blog: first notes, small repairs, and the case for writing without a feed.')); return r.join(' ; ');})()`, 10000));
// body 编辑器在 step2 有没有
console.log('BODY_CE:', await c.evalT(`(function(){var es=[...document.querySelectorAll('[contenteditable=true]')].filter(function(e){return e.offsetParent!==null}); return es.map(function(e,i){return i+':'+e.innerText.length+'ch'}).join(' ; ')||'NONE';})()`, 8000));
process.exit(0);
