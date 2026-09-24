import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
async function main() {
  const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && /writeupcafe\.com/.test(t.url));
  if (!tab) { console.log('TAB_GONE'); return; }
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  const c = new CDP(ws);
  await c.send('Page.enable');
  const ev = (t, p) => c.send('Input.dispatchMouseEvent', { type: t, ...p });
  await fetch(`http://127.0.0.1:9224/json/activate/${tab.id}`).catch(() => {});
  await sleep(400);
  const pp = await c.evalT(`(function(){var bs=[...document.querySelectorAll('button')].filter(function(b){return b.offsetParent!==null && /^Publish/.test((b.innerText||'').trim())}); if(!bs.length) return 'NO'; var b=bs[0]; b.scrollIntoView({block:'center'}); return 'scrolled';})()`, 8000);
  console.log('SCROLL:', pp);
  await sleep(800);
  const p2 = await c.evalT(`(function(){var bs=[...document.querySelectorAll('button')].filter(function(b){return b.offsetParent!==null && /^Publish/.test((b.innerText||'').trim())}); if(!bs.length) return 'NO'; var r=bs[0].getBoundingClientRect(); return [Math.round(r.x+r.width/2), Math.round(r.y+r.height/2), bs[0].disabled].join('|');})()`, 8000);
  console.log('PUB:', p2);
  if (p2 !== 'NO') {
    const [px, py] = p2.split('|').map(Number);
    await ev('mouseMoved', { x: px, y: py }); await sleep(200);
    await ev('mousePressed', { x: px, y: py, button: 'left', clickCount: 1 }); await sleep(100);
    await ev('mouseReleased', { x: px, y: py, button: 'left', clickCount: 1 });
    await sleep(6000);
    console.log('URL:', await c.evalT('location.href', 8000));
    console.log('MODAL:', await c.evalT(`(function(){var ms=[...document.querySelectorAll('[role=dialog], [class*=modal]')].filter(function(e){return e.offsetParent!==null}); return ms.length? (ms[0].innerText||'').trim().slice(0,150).replace(/\n/g,' ') : 'no_modal';})()`, 8000));
  }
  const s = await c.send('Page.captureScreenshot', { format: 'png' }).catch(() => null);
  if (s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/wu_pub4.png', Buffer.from(s.data, 'base64'));
  console.log('SHOT ok');
}
main().catch(e => console.log('FATAL:', e.message));
