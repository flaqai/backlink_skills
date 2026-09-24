import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
async function main() {
  const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && /writeupcafe\.com/.test(t.url));
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  const c = new CDP(ws);
  await c.send('Page.enable');
  console.log('URL:', await c.evalT('location.href', 8000));
  // 头像预览验证 + 找 Save
  console.log('AVA:', await c.evalT(`(function(){var imgs=[...document.querySelectorAll('img')].map(function(i){return (i.src||'').slice(0,60)}).filter(function(s){return /avatar|upload|blob|writeupcafe.*(photo|media|storage)/.test(s)}); return imgs.slice(0,3).join(' ; ')||'no_avatar_img';})()`, 8000));
  // Save Changes
  const sp = await c.evalT(`(function(){var bs=[...document.querySelectorAll('button')].filter(function(b){return b.offsetParent!==null && /Save Changes/.test(b.innerText||'')}); if(!bs.length) return 'NO'; var b=bs[bs.length-1]; b.scrollIntoView({block:'center'}); var r=b.getBoundingClientRect(); return [Math.round(r.x+r.width/2), Math.round(r.y+r.height/2)].join('|');})()`, 8000);
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
  console.log('URL2:', await c.evalT('location.href', 8000));
  const s = await c.send('Page.captureScreenshot', { format: 'png' }).catch(() => null);
  if (s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/wu_avatar_saved.png', Buffer.from(s.data, 'base64'));
  console.log('SHOT ok');
}
main().catch(e => console.log('FATAL:', e.message));
