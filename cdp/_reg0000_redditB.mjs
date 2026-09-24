// reg0000: Reddit stageA-retry — attach现有tab等加载完再填email
import { attach } from "./_reg0000_attach.mjs";
const c = await attach(/reddit\.com/);
// 轮询等 email 组件出现 (最多 30 秒, 脚本内等待合法)
let ok = false;
for (let i = 0; i < 10; i++) {
  const st = await c.evalT(`(() => { const el = document.querySelector('#register-email'); const inp = el && el.shadowRoot && el.shadowRoot.querySelector('input'); return inp ? 'ok' : 'wait:'+(document.title||'')+'|'+location.href.slice(0,80); })()`, 8000);
  if (st.startsWith("ok")) { ok = true; break; }
  console.log("WAIT:", st);
  await new Promise(rr => setTimeout(rr, 3000));
}
if (!ok) { console.log("EMAIL_FIELD_NEVER_LOADED"); process.exit(1); }
await c.evalT(`(() => { const el = document.querySelector('#register-email'); const inp = el.shadowRoot.querySelector('input'); inp.focus(); return 'ok'; })()`, 6000);
await new Promise(rr => setTimeout(rr, 400));
await c.send("Input.insertText", { text: "reddit@92ng.com" });
await new Promise(rr => setTimeout(rr, 800));
console.log("EMAIL_VAL:", await c.evalT(`(() => { const el = document.querySelector('#register-email'); return el.shadowRoot.querySelector('input').value; })()`, 6000));
const r2 = await c.send("Runtime.evaluate", { expression: `(() => { const btn = [...document.querySelectorAll('button')].find(b => (b.innerText||'').trim()==='继续' && b.offsetParent !== null); if(!btn) return null; btn.scrollIntoView({block:'center'}); const rc = btn.getBoundingClientRect(); return JSON.stringify({x: rc.x + rc.width/2, y: rc.y + rc.height/2}); })()`, returnByValue: true });
if (!r2.result.value) { console.log("NO_BTN"); process.exit(1); }
const { x, y } = JSON.parse(r2.result.value);
await c.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
await c.send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
await new Promise(rr => setTimeout(rr, 4000));
console.log("BODY:", (await c.evalT('(document.body.innerText||"").replace(/\\n+/g," | ").slice(0,300)', 8000)));
