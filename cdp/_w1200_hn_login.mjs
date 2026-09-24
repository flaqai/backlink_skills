// _w1200_hn_login.mjs — win1200: hackernoon 密码重登(表单间歇不渲染→重试环, reg2200经验)
import { CDP } from './CDP.mjs';
import { typeSmart } from './cdp-type.mjs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const EMAIL = 'hackernoon@92ng.com';
const PASS = 'Xx@Hackernoon26!Xm';

const tab = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json();
await new Promise(r => setTimeout(r, 300));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');

const goto = async (url, ms = 10000) => {
  await cdp.send('Page.navigate', { url });
  await sleep(ms);
  return cdp.eval('location.href');
};
const shot = async (name) => {
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 70 });
  const fs = await import('fs');
  fs.writeFileSync(`D:/Github/backlink_skills/cdp/_w1200_${name}.jpg`, Buffer.from(data, 'base64'));
  console.log('shot:', name);
};

try {
  let ok = false;
  for (let i = 1; i <= 5 && !ok; i++) {
    console.log(`try${i}: /login`);
    await goto('https://hackernoon.com/login', 10000);
    const f = await cdp.eval(`(() => {
      const es = [...document.querySelectorAll('input')].map(e => ({ t: e.type, n: e.name, id: e.id, vis: e.offsetParent !== null }));
      return JSON.stringify({ inputs: es, btns: [...document.querySelectorAll('button, input[type=submit]')].map(b => ({ txt: (b.innerText || b.value || '').slice(0, 30), vis: b.offsetParent !== null })) });
    })()`);
    console.log('form:', f.slice(0, 500));
    const form = JSON.parse(f);
    const emailSel = form.inputs.find(x => (x.t === 'email' || /mail/.test(x.n || '') || /mail/.test(x.id || '')) && x.vis);
    const passSel = form.inputs.find(x => x.t === 'password' && x.vis);
    if (!emailSel || !passSel) { await sleep(3000); continue; }

    // typeSmart 需要选择器: 用索引定位
    const idxOf = (inp) => form.inputs.indexOf(inp);
    const emailCss = `input${emailSel.id ? '#' + emailSel.id : `[name="${emailSel.n}"]`}`;
    const passCss = `input${passSel.id ? '#' + passSel.id : `[name="${passSel.n}"]`}`;
    try {
      await typeSmart(cdp, emailCss, EMAIL);
      await typeSmart(cdp, passCss, PASS);
    } catch (e) { console.log('typeSmart失败:', e.message.slice(0, 120)); await sleep(2000); continue; }

    // 提交按钮: 真实鼠标点击
    const b = await cdp.eval(`(() => {
      const btn = [...document.querySelectorAll('button, input[type=submit]')].find(b => (b.offsetParent !== null) && /log.?in|sign.?in/i.test((b.innerText || b.value || '')));
      if (!btn) return 'null';
      btn.scrollIntoView({ block: 'center' });
      const r = btn.getBoundingClientRect();
      return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) });
    })()`);
    if (b === 'null') { console.log('找不到登录按钮'); await shot('hn_nobtn'); await sleep(2000); continue; }
    const { x, y } = JSON.parse(b);
    for (const ty of ['mousePressed', 'mouseReleased']) await cdp.send('Input.dispatchMouseEvent', { type: ty, x, y, button: 'left', clickCount: 1 });
    await sleep(8000);
    const chk = await cdp.eval(`JSON.stringify({ url: location.href, logout: !!document.querySelector('a[href*="logout"], a[href*="signout"]'), body: document.body.innerText.slice(0, 150) })`);
    console.log('after-submit:', chk.slice(0, 300));
    const c = JSON.parse(chk);
    if (!/\/login/.test(c.url) || c.logout) ok = true;
  }
  console.log(ok ? 'LOGIN OK' : 'LOGIN FAIL');
  if (!ok) await shot('hn_loginfail');
} catch (e) { console.error('ERR', e.message); }
try { await cdp.send('Target.closeTarget', { targetId: tab.id }); } catch (_) {}
process.exit(0);
