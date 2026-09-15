// _reg0000_wp6.mjs — 类选择器点Update+确认 (reg0000)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && /post\.php\?post=36/.test(t.url));
if (!tab) { console.log('NO_TAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
await sleep(800);
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(5000)]);
const clickCls = async (sel, label) => {
  const r = await Promise.race([c.evalT("(() => { var b = document.querySelector('" + sel + "'); if (!b || b.offsetWidth === 0) return ''; b.scrollIntoView({block:'center'}); var rc = b.getBoundingClientRect(); return JSON.stringify({x: Math.round(rc.x + rc.width/2), y: Math.round(rc.y + rc.height/2)}); })()", 8000), sleep(9000).then(()=>'TO')]);
  console.log(label + ':', r);
  if (r && r.startsWith('{')) {
    const p = JSON.parse(r);
    await c.send('Input.dispatchMouseEvent', {type:'mousePressed', x:p.x, y:p.y, button:'left', clickCount:1});
    await c.send('Input.dispatchMouseEvent', {type:'mouseReleased', x:p.x, y:p.y, button:'left', clickCount:1});
    await sleep(5000);
    return true;
  }
  return false;
};
await clickCls('.editor-post-publish-button__button', 'Update一级');
await clickCls('.editor-post-publish-panel__header-publish-button button, .components-button.is-primary', '确认');
await sleep(6000);
ws.close();
