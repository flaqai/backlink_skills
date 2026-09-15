import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';

// reg0000h8: Next→补字段→传图→Publish
async function main() {
  const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())]
    .find(t => t.type === 'page' && /writeupcafe\.com/.test(t.url));
  if (!tab) { console.log('TAB_GONE'); return; }
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  const c = new CDP(ws);
  await c.send('DOM.enable'); await c.send('Page.enable');
  const ev = (t, p) => c.send('Input.dispatchMouseEvent', { type: t, ...p });
  await fetch(`http://127.0.0.1:9224/json/activate/${tab.id}`).catch(() => {});
  await sleep(400);

  // Next
  const np = await c.evalT(`(function(){var bs=[...document.querySelectorAll('button, a')].filter(function(b){return b.offsetParent!==null && /^Next/.test((b.innerText||'').trim())}); if(!bs.length) return 'NO'; var r=bs[0].getBoundingClientRect(); return [Math.round(r.x+r.width/2), Math.round(r.y+r.height/2)].join('|');})()`, 8000);
  console.log('NEXT:', np);
  if (np !== 'NO') {
    const [x, y] = np.split('|').map(Number);
    await ev('mouseMoved', { x, y }); await sleep(150);
    await ev('mousePressed', { x, y, button: 'left', clickCount: 1 }); await sleep(80);
    await ev('mouseReleased', { x, y, button: 'left', clickCount: 1 });
    await sleep(4500);
  }
  console.log('URL:', await c.evalT('location.href', 8000));

  // 传图 (先传, alt 随后)
  const doc = await c.send('DOM.getDocument', { depth: -1 });
  const q = await c.send('DOM.querySelectorAll', { nodeId: doc.root.nodeId, selector: 'input[type=file]' });
  if (q.nodeIds.length) {
    await c.send('DOM.setFileInputFiles', { nodeId: q.nodeIds[0], files: ['D:\\Github\\backlink_skills\\cdp\\_reg0000_wu_cover.jpg'] });
    console.log('IMG_SET');
  } else console.log('NO_FILE_INPUT');
  await sleep(5000);

  // 重填字段
  console.log('SET:', await c.evalT(`(function(){var set=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set; var st=Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value').set; function ip(sel,v){var e=document.querySelector(sel); if(!e) return 'NO:'+sel; if(e.tagName==='TEXTAREA') st.call(e,v); else set.call(e,v); e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true})); return 'ok';} var r=[]; r.push(ip('input[name=alt_text]','A workbench in a bicycle shop with tools and a half-built cargo bike frame.')); r.push(ip('textarea[name=excerpt]','A bicycle mechanic starts a slow blog: first notes, small repairs, and the case for writing without a feed.')); r.push(ip('textarea[name=meta_description]','A bicycle mechanic starts a slow blog: first notes, small repairs, and the case for writing without a feed.')); r.push(ip('input[name=focus_keyword]','slow blogging')); return r.join(' ; ');})()`, 10000));
  await sleep(2000);
  const s0 = await c.send('Page.captureScreenshot', { format: 'png' }).catch(() => null);
  if (s0) writeFileSync('D:/Github/seoadminC/storage/_reg0000/wu_step2b.png', Buffer.from(s0.data, 'base64'));

  // Publish
  const pp = await c.evalT(`(function(){var bs=[...document.querySelectorAll('button')].filter(function(b){return b.offsetParent!==null && /^Publish/.test((b.innerText||'').trim())}); if(!bs.length) return 'NO'; var b=bs[0]; b.scrollIntoView({block:'center'}); var r=b.getBoundingClientRect(); return [Math.round(r.x+r.width/2), Math.round(r.y+r.height/2)].join('|');})()`, 8000);
  console.log('PUB:', pp);
  if (pp !== 'NO') {
    const [px, py] = pp.split('|').map(Number);
    await sleep(500);
    await ev('mouseMoved', { x: px, y: py }); await sleep(150);
    await ev('mousePressed', { x: px, y: py, button: 'left', clickCount: 1 }); await sleep(90);
    await ev('mouseReleased', { x: px, y: py, button: 'left', clickCount: 1 });
    await sleep(5000);
    // 确认模态
    const mp = await c.evalT(`(function(){var ms=[...document.querySelectorAll('[role=dialog], [class*=modal], [class*=overlay]')].filter(function(e){return e.offsetParent!==null}); if(!ms.length) return 'no_modal'; var bs=[...ms[0].querySelectorAll('button')].filter(function(b){return /publish|confirm|yes/i.test(b.innerText||'')}); if(!bs.length) return 'modal_no_btn:'+(ms[0].innerText||'').slice(0,80); var r=bs[0].getBoundingClientRect(); return [Math.round(r.x+r.width/2), Math.round(r.y+r.height/2)].join('|');})()`, 8000);
    console.log('MODAL:', mp);
    if (/^\d+\|\d+$/.test(mp)) {
      const [mx, my] = mp.split('|').map(Number);
      await ev('mouseMoved', { x: mx, y: my }); await sleep(120);
      await ev('mousePressed', { x: mx, y: my, button: 'left', clickCount: 1 }); await sleep(80);
      await ev('mouseReleased', { x: mx, y: my, button: 'left', clickCount: 1 });
      await sleep(7000);
    }
  }
  console.log('URL:', await c.evalT('location.href', 8000));
  console.log('BODY:', await c.evalT(`document.body.innerText.split(String.fromCharCode(10)).filter(function(s){return s.trim();}).slice(0,10).join(' | ').slice(0,300)`, 8000));
  const s = await c.send('Page.captureScreenshot', { format: 'png' }).catch(() => null);
  if (s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/wu_pub3.png', Buffer.from(s.data, 'base64'));
  console.log('SHOT ok');
}
main().catch(e => console.log('FATAL:', e.message));
