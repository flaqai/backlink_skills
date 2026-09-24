// win1800: WP-listing 运行时选类目 用法: node _w1800_catsel.mjs <域片段> <正则>
import { CDP } from './CDP.mjs';
const [key, re] = process.argv.slice(2);
const tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = tabs.find(t => (t.url || '').includes(key) && t.type === 'page');
if (!tab) { console.log('NOTAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
const out = await cdp.eval(`(() => { const s=document.querySelector('select[name=dir-listing-category]'); if(!s) return 'NOSELECT'; const R=/${re}/i; const opt=[...s.options].find(o=>R.test(o.textContent)); if(!opt) return 'NOMATCH'; s.value=opt.value; s.dispatchEvent(new Event('change',{bubbles:true})); return 'SET '+opt.value+' '+opt.textContent.trim().slice(0,40); })()`);
console.log(out);
ws.close();
