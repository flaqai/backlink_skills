import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
async function main() {
  const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && /writeupcafe\.com/.test(t.url));
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  const c = new CDP(ws);
  await c.send('DOM.enable'); await c.send('Page.enable');
  await fetch(`http://127.0.0.1:9224/json/activate/${tab.id}`).catch(() => {});
  await c.send('Page.reload');
  await sleep(8000);
  const doc = await c.send('DOM.getDocument', { depth: -1 });
  const q = await c.send('DOM.querySelectorAll', { nodeId: doc.root.nodeId, selector: 'input[type=file]' });
  console.log('FILES=', q.nodeIds.length);
  if (q.nodeIds.length) {
    await c.send('DOM.setFileInputFiles', { nodeId: q.nodeIds[0], files: ['D:\Github\backlink_skills\cdp\_reg0000_wu_avatar.jpg'] });
    console.log('AVA_SET');
    await sleep(6000);
  }
  // Save Changes
  const sp = await c.evalT(`(function(){var bs=[...document.querySelectorAll('button')].filter(function(b){return b.offsetParent!==null && /Save Changes/i.test(b.innerText||'')}); if(!bs.length) return 'NO'; var b=bs[bs.length-1]; b.scrollIntoView({block:'center'}); var r=b.getBoundingClientRect(); return [Math.round(r.x+r.width/2), Math.round(r.y+r.height/2)].join('|');})()`, 10000);
  console.log('SAVE:', sp);
  if (sp !== 'NO') {
    const [x, y] = sp.split('|').map(Number);
    const ev = (t, p) => c.send('Input.dispatchMouseEvent', { type: t, ...p });
    await sleep(500);
    await ev('mouseMoved', { x, y }); await sleep(150);
    await ev('mousePressed', { x, y, button: 'left', clickCount: 1 }); await sleep(90);
    await ev('mouseReleased', { x, y, button: 'left', clickCount: 1 });
    await sleep(6000);
  }
  console.log('URL:', await c.evalT('location.href', 10000));
  const s = await c.send('Page.captureScreenshot', { format: 'png' }).catch(() => null);
  if (s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/wu_fast.png', Buffer.from(s.data, 'base64'));
  console.log('SHOT ok');
}
main().catch(e => console.log('FATAL:', e.message));
