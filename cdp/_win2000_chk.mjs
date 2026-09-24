import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const [,, domain] = process.argv;
const base = 'http://127.0.0.1:9224';
const tabs = await (await fetch(base+'/json/list')).json();
const tab = tabs.find(t => t.type==='page' && t.url.includes(domain));
if(!tab){ console.log('NO_TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej;});
const c = new CDP(ws);
await c.send('Page.enable');
if(!/posts-list/.test(tab.url)){ await c.send('Page.navigate',{url:'https://'+domain+'/posts-list'}); await sleep(8000); }
const out = await c.eval("(function(){var N=String.fromCharCode(10);var links=[...document.querySelectorAll('a')].map(function(a){return a.innerText.trim()+' => '+a.href}).filter(function(x){return x.length>10}).slice(0,30);var body=document.body.innerText.split(N).join(' ~ ').slice(0,400);return body+'<<LINKS>>'+links.join(N);})()");
console.log(out.split('<<LINKS>>').join('\n<<LINKS>>\n'));
const shot = await c.send('Page.captureScreenshot',{format:'png'});
fs.writeFileSync('D:/Github/seoadminC/storage/_win2000_chk_'+domain.split('.').join('_')+'.png', Buffer.from(shot.data,'base64'));
process.exit(0);
