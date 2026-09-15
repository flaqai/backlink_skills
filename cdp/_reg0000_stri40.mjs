import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
let tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = tabs.find(t => t.type === 'page' && t.url.includes('blogPosts'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(() => {});
await sleep(1500);
// 点击"回到网站"或直接导航回manage列表刷新状态
await c.goto('https://www.strikingly.com/s/sites/35253136/edit/manage/blog/blogPosts', 40000).catch(()=>{});
await sleep(7000);
const shot = await c.send('Page.captureScreenshot', { format: 'png', clip: {x:190,y:0,width:1190,height:900,scale:1} });
writeFileSync('D:/Github/seoadminC/storage/_stri-manage.png', Buffer.from(shot.data, 'base64'));
console.log('manage shot saved');
process.exit(0);
