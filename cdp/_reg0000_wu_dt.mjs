import { CDP, sleep } from './CDP.mjs';
import { readFileSync } from 'fs';
import { writeFileSync as wf } from 'fs';
async function main() {
  const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && /writeupcafe\.com/.test(t.url));
  if (!tab) { console.log('NO_TAB'); return; }
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  const c = new CDP(ws);
  await c.send('Runtime.enable'); await c.send('Page.enable');
  await fetch(`http://127.0.0.1:9224/json/activate/${tab.id}`).catch(() => {});
  await sleep(2000);
  // base64 注入图片 data
  const b64 = readFileSync('D:/Github/backlink_skills/cdp/_reg0000_wu_avatar.jpg').toString('base64');
  // DataTransfer 法: fetch data-url -> File -> input.files -> change
  console.log('DT:', await c.evalT(`(async function(){
    try {
      var img = await (await fetch('data:image/jpeg;base64,${b64}')).blob();
      var dt = new DataTransfer();
      dt.items.add(new File([img], 'avatar.jpg', {type: 'image/jpeg'}));
      var inp = document.querySelector('input[type=file]');
      if (!inp) return 'NO_INPUT';
      inp.files = dt.files;
      inp.dispatchEvent(new Event('change', {bubbles: true}));
      inp.dispatchEvent(new Event('input', {bubbles: true}));
      return 'DT_SET files=' + inp.files.length;
    } catch(e) { return 'ERR ' + e.message; }
  })()`, 20000));
  await sleep(6000);
  console.log('ALIVE:', await c.evalT(`'page_ok'`, 8000).catch(() => 'PAGE_HUNG'));
  // Save
  const sp = await c.evalT(`(function(){var bs=[...document.querySelectorAll('button')].filter(function(b){return b.offsetParent!==null && /Save Changes/i.test(b.innerText||'')}); if(!bs.length) return 'NO'; var b=bs[bs.length-1]; b.scrollIntoView({block:'center'}); var r=b.getBoundingClientRect(); return [Math.round(r.x+r.width/2), Math.round(r.y+r.height/2)].join('|');})()`, 10000);
  console.log('SAVE:', sp);
  if (sp !== 'NO') {
    const [x, y] = sp.split('|').map(Number);
    const ev = (t, p) => c.send('Input.dispatchMouseEvent', { type: t, ...p });
    await sleep(400);
    await ev('mouseMoved', { x, y }); await sleep(150);
    await ev('mousePressed', { x, y, button: 'left', clickCount: 1 }); await sleep(90);
    await ev('mouseReleased', { x, y, button: 'left', clickCount: 1 });
    await sleep(6000);
  }
  console.log('URL:', await c.evalT('location.href', 10000));
  const s = await c.send('Page.captureScreenshot', { format: 'png' }).catch(() => null);
  if (s) wf('D:/Github/seoadminC/storage/_reg0000/wu_dt.png', Buffer.from(s.data, 'base64'));
  console.log('SHOT ok');
}
main().catch(e => console.log('FATAL:', e.message));
