// reddit-resume.mjs — Reddit 注册一键全自动 (reg0000 0902 固化, 给下班)
// 前提: C机代理已恢复(curl reddit.com 通)。用法: node _reg0000_reddit-resume.mjs
// 流程: /register → email(reddit@92ng.com) → OTP(脚本内轮询agently收码) → username/password → 成功
// 之后的发文路径: 首页Create Post→profile文本帖(养号文200-400词无外链)→落库theme=account-warming
import { CDP, sleep } from './CDP.mjs';
import { execSync } from 'child_process';

const EMAIL = 'reddit@92ng.com', USERNAME = 'leoxm', PASS = 'Xx@Reddit26!Xm';

const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let page = list.find(t => t.type === 'page' && /reddit\.com/.test(t.url));
if (!page) {
  const t = await (await fetch('http://127.0.0.1:9224/json/new?https://www.reddit.com/register/', { method: 'PUT' })).json();
  await sleep(10000);
  page = t;
}
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 12000); });
const c = new CDP(ws);
await c.send('Page.enable');
try { await fetch('http://127.0.0.1:9224/json/activate/' + page.id); } catch {}

// 等 email 字段 (shadow DOM)
let ok = false;
for (let i = 0; i < 10; i++) {
  const st = await c.evalT(`(() => { const el = document.querySelector('#register-email'); const inp = el && el.shadowRoot && el.shadowRoot.querySelector('input'); return inp ? 'ok' : 'wait:'+location.href.slice(0,60); })()`, 8000);
  if (st.startsWith('ok')) { ok = true; break; }
  console.log('WAIT:', st);
  await sleep(3000);
}
if (!ok) { console.log('❌ email字段未加载(网络/代理?)'); process.exit(1); }

await c.evalT(`(() => { document.querySelector('#register-email').shadowRoot.querySelector('input').focus(); return 1; })()`, 6000);
await c.send('Input.insertText', { text: EMAIL });
await sleep(800);
console.log('EMAIL:', await c.evalT(`(() => document.querySelector('#register-email').shadowRoot.querySelector('input').value)()`, 6000));

const clickBtn = async (label) => {
  const r = await c.send('Runtime.evaluate', { expression: `(() => { const btn = [...document.querySelectorAll('button')].find(b => (b.innerText||'').trim()==='${label}' && b.offsetParent !== null); if(!btn) return null; btn.scrollIntoView({block:'center'}); const rc = btn.getBoundingClientRect(); return JSON.stringify({x: rc.x + rc.width/2, y: rc.y + rc.height/2}); })()`, returnByValue: true });
  if (!r.result.value) return false;
  const { x, y } = JSON.parse(r.result.value);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  return true;
};

await clickBtn('继续');
await sleep(4500);
console.log('STEP2:', (await c.evalT('(document.body.innerText||"").replace(/\\n+/g," | ").slice(0,120)', 8000)));

// 轮询 agently 收 OTP (脚本内等待合法; 最多6轮×20秒)
let code = null;
for (let i = 0; i < 6 && !code; i++) {
  await sleep(20000);
  try {
    const out = execSync('agently-cli message +list --limit 3', { encoding: 'utf8' });
    const m = out.match(/"(\\d{6}) is your Reddit verification code"/);
    if (m) code = m[1];
  } catch (e) { console.log('agently err:', String(e).slice(0, 60)); }
}
if (!code) { console.log('❌ OTP未收到'); process.exit(1); }
console.log('OTP:', code);

await c.evalT(`(() => { const el = document.querySelector('faceplate-text-input[name=code]'); const inp = el && el.shadowRoot && el.shadowRoot.querySelector('input'); if(inp) inp.focus(); return 1; })()`, 6000);
await c.send('Input.insertText', { text: code });
await sleep(1000);
await clickBtn('继续');
await sleep(4500);

// username/password 屏 (username可能被占, 先试leoxm失败换leoxm26)
const fill = async (name, val) => {
  await c.evalT(`(() => { const el = document.querySelector('faceplate-text-input[name=${name}]'); const inp = el && el.shadowRoot && el.shadowRoot.querySelector('input'); if(inp) inp.focus(); return 1; })()`, 6000);
  await c.send('Input.insertText', { text: val });
  await sleep(600);
};
console.log('SCREEN3:', (await c.evalT('(document.body.innerText||"").replace(/\\n+/g," | ").slice(0,150)', 8000)));
await fill('username', USERNAME);
await fill('password', PASS);
await sleep(800);
await clickBtn('继续');
await sleep(8000);
console.log('FINAL_URL:', await c.evalT('location.href', 8000));
console.log('FINAL_BODY:', (await c.evalT('(document.body.innerText||"").replace(/\\n+/g," | ").slice(0,200)', 8000)));
