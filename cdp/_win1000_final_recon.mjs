// win1000: prra.xyz signup渲染复验 + aiwebsitedirectory /submit 重投侦察
import http from 'http';
import fs from 'fs';
function put(url) {
  return new Promise((resolve, reject) => {
    const req = http.request('http://127.0.0.1:9224/json/new?' + encodeURIComponent(url), { method: 'PUT' }, (res) => {
      let b = ''; res.on('data', (d) => (b += d)); res.on('end', () => resolve(JSON.parse(b)));
    });
    req.on('error', reject); req.end();
  });
}
function cdpEval(t, id, expr, timeout = 12000) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(t.webSocketDebuggerUrl);
    const timer = setTimeout(() => { ws.close(); reject(new Error('timeout')); }, timeout);
    ws.onopen = () => ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true } }));
    ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id === id) { clearTimeout(timer); resolve(m.result); ws.close(); } };
    ws.onerror = reject;
  });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 1. prra.xyz/signup
try {
  const t = await put('https://prra.xyz/signup');
  await sleep(7000);
  const r = await cdpEval(t, 1, `(() => JSON.stringify({
    title: document.title.slice(0, 50),
    user: !!document.querySelector('input[name=username],input[name*="user"]'),
    email: !!document.querySelector('input[type=email],input[name=email]'),
    pass: !!document.querySelector('input[type=password]'),
    head: document.body.innerText.slice(0, 120),
  }))()`);
  console.log('[prra/signup]', r.result.value);
  await new Promise((res) => { const w = new WebSocket(t.webSocketDebuggerUrl); w.onopen = () => w.send(JSON.stringify({ id: 9, method: 'Target.closeTarget', params: { targetId: t.id } })); setTimeout(res, 500); });
} catch (e) { console.log('[prra] ERR', e.message); }

// 2. aiwebsitedirectory /submit(或重投入口)
try {
  const t = await put('https://aiwebsitedirectory.com/submit');
  await sleep(8000);
  const r = await cdpEval(t, 1, `(() => JSON.stringify({
    title: document.title.slice(0, 60),
    url: location.href.slice(0, 70),
    forms: document.forms.length,
    fields: [...document.querySelectorAll('input:not([type=hidden]),textarea,select')].map(e => e.tagName + ':' + (e.name || e.id || e.placeholder || '?') + ':' + (e.type || '')).slice(0, 18),
    paid: /\\$[0-9]|premium|payment/i.test(document.body.innerText.slice(0, 4000)),
    head: document.body.innerText.slice(0, 150),
  }))()`);
  console.log('[aiweb/submit]', r.result.value);
  await cdpEval(t, 2, '1', 2000).catch(() => {});
  await new Promise((res) => { const w = new WebSocket(t.webSocketDebuggerUrl); w.onopen = () => w.send(JSON.stringify({ id: 9, method: 'Target.closeTarget', params: { targetId: t.id } })); setTimeout(res, 500); });
} catch (e) { console.log('[aiweb] ERR', e.message); }
process.exit(0);
