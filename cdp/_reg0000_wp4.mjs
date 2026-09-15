// _reg0000_wp4.mjs — post36 内容检查+Update补全 (reg0000)
import { CDP, sleep } from './CDP.mjs';
let tab = await (await fetch('http://127.0.0.1:9224/json/new?https://leoxmseo2.wordpress.com/wp-admin/post.php?post=36&action=edit', {method:'PUT'})).json();
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
await sleep(14000);
const list2 = await (await fetch('http://127.0.0.1:9224/json/list')).json();
tab = list2.find(t => t.type === 'page' && /post\.php\?post=36/.test(t.url));
if (!tab) { console.log('NO_TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(5000)]);
const st = await Promise.race([c.evalT(`(() => { var cm = document.querySelector('.cm-content[contenteditable=true]'); var len = cm ? cm.innerText.length : 0; var hasP3 = cm ? cm.innerText.indexOf('What will show up here') >= 0 : false; var hasP5 = cm ? cm.innerText.indexOf('comment box is open') >= 0 : false; var upd = [...document.querySelectorAll('button')].find(function(b){return b.offsetParent && (/^update$/i.test(b.innerText.trim()) || /^publish$/i.test(b.innerText.trim()))}); return JSON.stringify({cmLen: len, hasP3: hasP3, hasP5: hasP5, btn: upd ? upd.innerText.trim() : 'nf'}); })()`, 10000), sleep(11000).then(()=>'TO')]);
console.log('ST:', typeof st === 'string' ? st : 'TO');
ws.close();
