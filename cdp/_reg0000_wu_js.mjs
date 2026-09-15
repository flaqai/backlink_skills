import { CDP, sleep } from './CDP.mjs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && /writeupcafe\.com/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
// JS 设值三字段
console.log('SET:', await c.evalT(`(function(){var set=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set; var st=Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value').set; function put(e,v){ if(!e) return 'input'; if(e.tagName==='TEXTAREA') st.call(e,v); else set.call(e,v); e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true})); } var r=[]; r.push(put(document.querySelector('input[name=display_name]'),'Leo Xm')); r.push(put(document.querySelector('textarea[name=bio]'),'Bicycle mechanic and part-time writer. I note down small observations from everyday life.')); r.push(put(document.querySelector('input[name=tagline]'),'Notes from an ordinary week')); return r.join(',');})()`, 8000));
await sleep(800);
// Livewire 检查
console.log('LW:', await c.evalT(`(function(){return 'livewire='+(typeof Livewire)+' component='+(window.Livewire&&Livewire.first? !!Livewire.first() : 'n/a');})()`, 6000));
// city 区结构
console.log('CITY:', await c.evalT(`(function(){var lines=[]; document.querySelectorAll('input[id*=city], input[name*=city], input[name*=country]').forEach(function(e){ lines.push([e.tagName, e.id, e.name, e.type, e.value.slice(0,20)].join(':')); }); return lines.join(' ; ')||'NONE';})()`, 8000));
// 验证值
console.log('VALS:', await c.evalT(`(function(){var d=document.querySelector('input[name=display_name]'); var b=document.querySelector('textarea[name=bio]'); return 'dn='+(d?d.value:'?')+' bio='+(b?b.value.slice(0,20):'?');})()`, 6000));
process.exit(0);
