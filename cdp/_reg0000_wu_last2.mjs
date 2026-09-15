import { CDP, sleep } from './CDP.mjs';
import { readFileSync } from 'fs';
import { writeFileSync as wf } from 'fs';
async function main() {
  const b64 = readFileSync('D:/Github/backlink_skills/cdp/_reg0000_wu_cover.jpg').toString('base64');
  const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && /writeupcafe\.com/.test(t.url));
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  const c = new CDP(ws);
  await c.send('Page.enable');
  const ev = (t, p) => c.send('Input.dispatchMouseEvent', { type: t, ...p });
  await fetch(`http://127.0.0.1:9224/json/activate/${tab.id}`).catch(() => {});
  await sleep(400);
  // DataTransfer 传 featured image
  console.log('IMG:', await c.evalT(`(async function(){
    try {
      var blob = await (await fetch('data:image/jpeg;base64,${b64}')).blob();
      var dt = new DataTransfer();
      dt.items.add(new File([blob], 'cover.jpg', {type: 'image/jpeg'}));
      var inp = document.querySelector('input[name=featured_image]') || document.querySelector('input[type=file]');
      if (!inp) return 'NO_INPUT';
      inp.files = dt.files;
      inp.dispatchEvent(new Event('change', {bubbles: true}));
      inp.dispatchEvent(new Event('input', {bubbles: true}));
      return 'SET';
    } catch(e) { return 'ERR ' + e.message; }
  })()`, 20000));
  await sleep(6000);
  // alt + meta 重填
  console.log('SET:', await c.evalT(`(function(){var set=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set; var st=Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value').set; function ip(sel,v){var e=document.querySelector(sel); if(!e) return 'NO:'+sel; if(e.tagName==='TEXTAREA') st.call(e,v); else set.call(e,v); e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true})); return 'ok';} var r=[]; r.push(ip('input[name=alt_text]','A workbench in a bicycle shop with tools and a half-built cargo bike frame.')); r.push(ip('textarea[name=meta_description]','A bicycle mechanic starts a slow blog: first notes, small repairs, and the case for writing without a feed.')); r.push(ip('textarea[name=excerpt]','A bicycle mechanic starts a slow blog: first notes, small repairs, and the case for writing without a feed.')); return r.join(' ; ');})()`, 10000));
  await sleep(2500);
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
  if (s) wf('D:/Github/seoadminC/storage/_reg0000/wu_last2.png', Buffer.from(s.data, 'base64'));
  console.log('SHOT ok');
}
main().catch(e => console.log('FATAL:', e.message));
