import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('strikingly.com'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
await c.goto('https://www.strikingly.com/s/sites/35253136/edit', 40000).catch(e=>console.log('goto:',e.message));
await sleep(8000);
// 关掉新手引导(如果有)
const guide = await c.eval(`(function(){
  const els=[...document.querySelectorAll('button, a')].filter(b=>b.offsetParent && (b.innerText||'').trim()==='不用，谢谢！');
  if(els.length){ const r=els[0].getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}); } return null;
})()`);
if (guide) { const p=JSON.parse(guide); await clickXY(p.x,p.y); await sleep(1500); console.log('guide dismissed'); }
// 侧栏点"博客"(精确: 含博客文章子项展开的那个)
const blogNav = await c.eval(`(function(){
  const els=[...document.querySelectorAll('*')].filter(e=>{
    if(!e.offsetParent) return false;
    const t=(e.textContent||'').trim();
    if(t!=='博客') return false;
    // 找带子菜单的(有子元素包含'博客文章')
    return e.querySelector && [...e.querySelectorAll('*')].some(s=>(s.textContent||'').trim()==='博客文章');
  });
  if(els.length){ const e=els[0]; const r=e.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+Math.min(r.width/2,80)),y:Math.round(r.y+r.height/2),cls:String(e.className).slice(0,40)}); }
  return null;
})()`);
console.log('blog nav:', blogNav);
if (blogNav) { const p=JSON.parse(blogNav); await clickXY(p.x,p.y); await sleep(2000); }
// 再点"博客文章"
const bpa = await c.eval(`(function(){
  const els=[...document.querySelectorAll('*')].filter(e=>e.offsetParent && e.children.length===0 && e.textContent.trim()==='博客文章');
  if(!els.length) return null; const e=els[els.length-1]; const r=e.getBoundingClientRect();
  return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});
})()`);
console.log('博客文章:', bpa);
if (bpa) { const p=JSON.parse(bpa); await clickXY(p.x,p.y); await sleep(4000); }
const st = await c.eval(`(function(){
  return JSON.stringify({url:location.href.slice(0,100), txt:document.body.innerText.slice(0,300)});
})()`);
console.log(st);
const shot = await c.send('Page.captureScreenshot', { format: 'png' });
writeFileSync('D:/Github/seoadminC/storage/_stri-blog.png', Buffer.from(shot.data, 'base64'));
process.exit(0);
