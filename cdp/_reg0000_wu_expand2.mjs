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
  await sleep(500);
  // 编辑器 rect
  const ep = await c.evalT(`(function(){var es=[...document.querySelectorAll('[contenteditable=true]')].filter(function(e){return e.offsetParent!==null && e.innerText.length>50}); if(!es.length) return 'NO'; var b=es[0].getBoundingClientRect(); return [Math.round(b.x+b.width/2), Math.round(b.bottom-30), es[0].innerText.length].join('|');})()`, 8000);
  console.log('ED:', ep);
  const [ex, ey, len] = ep.split('|');
  // 点末尾下方
  await ev('mouseMoved', { x: +ex, y: +ey - 10 }); await sleep(150);
  await ev('mousePressed', { x: +ex, y: +ey - 10, button: 'left', clickCount: 1 }); await sleep(80);
  await ev('mouseReleased', { x: +ex, y: +ey - 10, button: 'left', clickCount: 1 }); await sleep(400);
  // Ctrl+End 到文末
  await c.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'End', code: 'End', windowsVirtualKeyCode: 35, modifiers: 2 });
  await c.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'End', code: 'End', windowsVirtualKeyCode: 35, modifiers: 2 });
  await sleep(300);
  const ADD = [
    'Yesterday a student came in with a frame that had been stored in a damp shed for two winters. The chain was rusted solid and the bearings were gritty, but the frame itself was sound. Saving it took most of the afternoon, and there was a moment near the end when the front wheel finally spun freely again and I felt the same small satisfaction I always feel when something broken starts working. Those moments are a big part of why I wanted a place to write things down.',
    'I also want to keep track of what I read. At the moment that is a lot of old paperback science fiction from the stall by the station, where everything costs less than a coffee. Last month it was a collection of stories about slow robots tending gardens on a quiet future earth, which sounds strange and was exactly right. Writing a few lines about each book here seems like a good habit to build, and if it helps someone else pick their next read, even better.',
  ].join('\n\n');
  for (const p of ADD.split('\n\n')) {
    await c.send('Input.insertText', { text: ' ' + p });
    await sleep(250);
  }
  await sleep(400);
  console.log('WORDS:', await c.evalT(`(function(){var es=[...document.querySelectorAll('[contenteditable=true]')].filter(function(e){return e.offsetParent!==null && e.innerText.length>50}); return es[0]? es[0].innerText.split(/\s+/).filter(Boolean).length : 0;})()`, 8000));
  const s = await c.send('Page.captureScreenshot', { format: 'png' }).catch(() => null);
  if (s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/wu_exp2.png', Buffer.from(s.data, 'base64'));
  console.log('SHOT ok');
}
main().catch(e => console.log('FATAL:', e.message));
