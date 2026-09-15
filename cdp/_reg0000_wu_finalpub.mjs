import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
async function main() {
  const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && /writeupcafe\.com/.test(t.url));
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  const c = new CDP(ws);
  await c.send('Page.enable');
  const ev = (t, p) => c.send('Input.dispatchMouseEvent', { type: t, ...p });
  await fetch(`http://127.0.0.1:9224/json/activate/${tab.id}`).catch(() => {});
  await sleep(500);
  await c.send('Page.navigate', { url: 'https://writeupcafe.com/post-writeup/1929262?step=2' });
  await sleep(8000);
  console.log('URL:', await c.evalT('location.href', 10000));
  // Publish
  const pp = await c.evalT(`(function(){var bs=[...document.querySelectorAll('button')].filter(function(b){return b.offsetParent!==null && /^Publish/.test((b.innerText||'').trim())}); if(!bs.length) return 'NO'; var b=bs[0]; b.scrollIntoView({block:'center'}); var r=b.getBoundingClientRect(); return [Math.round(r.x+r.width/2), Math.round(r.y+r.height/2)].join('|');})()`, 10000);
  console.log('PUB:', pp);
  if (pp !== 'NO') {
    const [px, py] = pp.split('|').map(Number);
    await sleep(500);
    await ev('mouseMoved', { x: px, y: py }); await sleep(150);
    await ev('mousePressed', { x: px, y: py, button: 'left', clickCount: 1 }); await sleep(90);
    await ev('mouseReleased', { x: px, y: py, button: 'left', clickCount: 1 });
    await sleep(6000);
    // 模态
    const mp = await c.evalT(`(function(){var ms=[...document.querySelectorAll('[role=dialog], [class*=modal]')].filter(function(e){return e.offsetParent!==null}); if(!ms.length) return 'no_modal'; var bs=[...ms[0].querySelectorAll('button')].filter(function(b){return /publish/i.test(b.innerText||'')}); if(!bs.length) return 'no_btn'; var r=bs[0].getBoundingClientRect(); return [Math.round(r.x+r.width/2), Math.round(r.y+r.height/2)].join('|');})()`, 10000);
    console.log('MODAL:', mp);
    if (/^\d+\|\d+$/.test(mp)) {
      const [mx, my] = mp.split('|').map(Number);
      await ev('mouseMoved', { x: mx, y: my }); await sleep(150);
      await ev('mousePressed', { x: mx, y: my, button: 'left', clickCount: 1 }); await sleep(90);
      await ev('mouseReleased', { x: mx, y: my, button: 'left', clickCount: 1 });
      await sleep(9000);
    }
  }
  console.log('FINAL URL:', await c.evalT('location.href', 10000));
  const s = await c.send('Page.captureScreenshot', { format: 'png' }).catch(() => null);
  if (s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/wu_finalpub.png', Buffer.from(s.data, 'base64'));
  console.log('SHOT ok');
}
main().catch(e => console.log('FATAL:', e.message));
