// reg0000: letterpad.app 第三封magic link过callback(会话落profile)
// 流程: agently收信→解awstrack内层URL→新tab导航→报告落点+截图→留tab(后续发文用)
import { CDP, sleep } from './CDP.mjs';
import { execSync } from 'child_process';
import fs from 'fs';

const SHOT = 'D:/Github/seoadminC/storage/_reg0000/lp_after_cb.png';
const SINCE = process.argv[2] || ''; // 邮件created_at下限(UTC ISO), 避免拿到旧信

function sh(cmd) { return execSync(cmd, { encoding: 'utf8', timeout: 30000 }); }

// 1. 收信: 最新一封 letterpad "Sign in to Letterpad" (created_at > SINCE)
let msgId = null;
for (let i = 0; i < 10 && !msgId; i++) {
  const raw = sh(`agently-cli message +list --limit 5`);
  const j = JSON.parse(raw);
  for (const m of (j.data?.data || [])) {
    if (/letterpad\.app/.test(m.from?.email || '') && /Sign in/i.test(m.subject || '')) {
      if (!SINCE || m.created_at > SINCE) { msgId = m.message_id; break; }
    }
  }
  if (!msgId) { console.log('等信中... (' + (i + 1) + '/10)'); await sleep(6000); }
}
if (!msgId) { console.log('NO-EMAIL'); process.exit(2); }
console.log('msg:', msgId);

// 2. 读全文, 解awstrack内层真实URL
const full = sh(`agently-cli message +read --id ${msgId}`);
const m = full.match(/awstrack\.me\/L0\/(https:[^"]*?letterpad\.app[^"]*?)\/1\//);
if (!m) { console.log('NO-LINK'); console.log(full.slice(0, 800)); process.exit(3); }
let inner = m[1].replace(/\\=258$/, '');
// awstrack把内层URL整体URL编码过: https:%2F%2F...
let real = '';
try { real = decodeURIComponent(inner); } catch (e) { real = inner; }
if (!/^https:\/\//.test(real)) real = 'https://' + real;
console.log('real:', real.slice(0, 120));

// 3. 新tab导航过callback
await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' });
await sleep(400);
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const blank = list.find(t => t.type === 'page' && /about:blank/.test(t.url));
const ws = new WebSocket(blank.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 8000); });
const c = new CDP(ws);
await c.send('Target.activateTarget', { targetId: blank.id });
await c.send('Page.enable');
await c.send('Page.navigate', { url: real });
await sleep(6000);
const where = await c.evalT("location.href", 8000);
const txt = await c.evalT("document.body ? document.body.innerText.split(String.fromCharCode(10)).filter(function(s){return s.trim();}).slice(0,14).join(' | ') : 'nobody'", 8000);
console.log('WHERE:', where);
console.log('TEXT:', txt);
const shot = await c.send('Page.captureScreenshot', { format: 'png' }).catch(() => null);
if (shot) fs.writeFileSync(SHOT, Buffer.from(shot.data, 'base64'));
console.log('SHOT:', shot ? SHOT : 'fail');
// tab留给后续发文流程用, 不关
