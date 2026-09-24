// reg0000: 抓浏览器verify点击的ajax.php真实请求体
import fs from 'fs';
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const list = await fetch('http://127.0.0.1:9224/json').then(r => r.json());
  const t = list.find(x => x.id.startsWith('6178A13F')) || list.find(x => x.url.includes('blogkoo'));
  if (!t) { console.log('NO_TAB'); process.exit(1); }
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  let mid = 0; const pending = new Map();
  const send = (method, params = {}) => new Promise((res) => { const id = ++mid; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); return; }
    if (m.method === 'Network.requestWillBeSent' && m.params.request.url.includes('captcha')) {
      console.log('REQ:', m.params.request.method, m.params.request.url.slice(0, 90));
      if (m.params.request.postData) console.log('BODY:', m.params.request.postData.slice(0, 200));
    }
    if (m.method === 'Network.responseReceived' && m.params.response.url.includes('captcha')) {
      console.log('RESP:', m.params.response.status, m.params.response.url.slice(0, 80));
    }
  };
  await new Promise(r => ws.onopen = r);
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  await send('Target.activateTarget', { targetId: t.id });
  await sleep(500);
  // 先填表（空表单点verify可能不弹窗）
  await send('Runtime.evaluate', { expression: `(()=>{const set=(n,v)=>{const e=document.querySelector('input[name='+n+']'); if(e){e.focus(); e.value=v; e.dispatchEvent(new Event('input',{bubbles:true}));}}; set('email','blogkoo@92ng.com'); set('password','Xx@Koo26!Xm'); set('username','leoxmkoo26'); return 'ok'})()`, returnByValue: true });
  await sleep(400);
  // 点verify
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 481, y: 437 });
  await sleep(100);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 481, y: 437, button: 'left', clickCount: 1 });
  await sleep(80);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 481, y: 437, button: 'left', clickCount: 1 });
  console.log('verify clicked, capturing...');
  await sleep(6000);
  ws.close();
  console.log('DONE');
})();
