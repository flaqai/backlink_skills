import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';

// reg0000h6: Publish
async function main() {
  const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())]
    .find(t => t.type === 'page' && /writeupcafe\.com/.test(t.url));
  if (!tab) { console.log('TAB_GONE'); return; }
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  const c = new CDP(ws);
  await c.send('Page.enable');
  const ev = (t, p) => c.send('Input.dispatchMouseEvent', { type: t, ...p });
  await fetch(`http://127.0.0.1:9224/json/activate/${tab.id}`).catch(() => {});
  await sleep(500);

  // 页面图片盘点
  console.log('IMGS:', await c.evalT(`(function(){return [...document.querySelectorAll('img')].map(function(i){return (i.src||'').slice(0,60)}).filter(function(s){return s && !/logo|icon|avatar/.test(s)}).slice(0,4).join(' ; ') || 'none';})()`, 8000).catch(e => 'ERR ' + e.message));

  // 点 Publish
  const pos = await c.evalT(`(function(){var bs=[...document.querySelectorAll('button')].filter(function(b){return b.offsetParent!==null && /^Publish/.test((b.innerText||'').trim())}); if(!bs.length) return 'NO'; var b=bs[0]; b.scrollIntoView({block:'center'}); var r=b.getBoundingClientRect(); return [Math.round(r.x+r.width/2), Math.round(r.y+r.height/2)].join('|');})()`, 8000);
  console.log('PUB:', pos);
  if (pos !== 'NO') {
    const [x, y] = pos.split('|').map(Number);
    await sleep(400);
    await ev('mouseMoved', { x, y }); await sleep(150);
    await ev('mousePressed', { x, y, button: 'left', clickCount: 1 }); await sleep(90);
    await ev('mouseReleased', { x, y, button: 'left', clickCount: 1 });
    await sleep(5000);
    // 可能有确认模态
    console.log('MODAL:', await c.evalT(`(function(){var ms=[...document.querySelectorAll('[role=dialog], [class*=modal]')].filter(function(e){return e.offsetParent!==null}); if(!ms.length) return 'no_modal'; var t=(ms[0].innerText||'').trim().slice(0,150); var bs=[...ms[0].querySelectorAll('button')].map(function(b){return (b.innerText||'').trim().slice(0,15)}).join(','); return t+' :: BTN['+bs+']';})()`, 8000));
    // 点模态中的确认 Publish
    const mp = await c.evalT(`(function(){var ms=[...document.querySelectorAll('[role=dialog], [class*=modal]')].filter(function(e){return e.offsetParent!==null}); if(!ms.length) return 'NO'; var bs=[...ms[0].querySelectorAll('button')].filter(function(b){return /publish/i.test(b.innerText||'')}); if(!bs.length) return 'NO_BTN'; var r=bs[0].getBoundingClientRect(); return [Math.round(r.x+r.width/2), Math.round(r.y+r.height/2)].join('|');})()`, 8000);
    if (mp !== 'NO' && mp !== 'NO_BTN') {
      const [mx, my] = mp.split('|').map(Number);
      await ev('mouseMoved', { x: mx, y: my }); await sleep(120);
      await ev('mousePressed', { x: mx, y: my, button: 'left', clickCount: 1 }); await sleep(80);
      await ev('mouseReleased', { x: mx, y: my, button: 'left', clickCount: 1 });
      await sleep(6000);
    }
  }
  console.log('URL:', await c.evalT('location.href', 8000));
  console.log('BODY:', await c.evalT(`document.body.innerText.split(String.fromCharCode(10)).filter(function(s){return s.trim();}).slice(0,10).join(' | ').slice(0,300)`, 8000));
  const s = await c.send('Page.captureScreenshot', { format: 'png' }).catch(() => null);
  if (s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/wu_pub.png', Buffer.from(s.data, 'base64'));
  console.log('SHOT ok');
}
main().catch(e => console.log('FATAL:', e.message));
