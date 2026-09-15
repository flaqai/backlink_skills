// reg0000: Reddit 注册 step1 — 点email组件打字→继续→dump下一屏
import { attach } from "./_reg0000_attach.mjs";
const c = await attach(/reddit\.com\/register/);
// 找 email 组件的中心坐标并真实点击
const r = await c.send("Runtime.evaluate", { expression: `(() => { const el = document.querySelector('faceplate-text-input[name=email], #register-email'); if(!el) return null; const rc = el.getBoundingClientRect(); return JSON.stringify({x: rc.x + rc.width/2, y: rc.y + rc.height/2, w: rc.width, h: rc.height}); })()`, returnByValue: true });
console.log("EMAIL_RECT:", r.result.value);
if (!r.result.value) { console.log("NO_EMAIL_FIELD"); process.exit(1); }
const { x, y } = JSON.parse(r.result.value);
await c.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
await c.send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
await new Promise(rr => setTimeout(rr, 800));
await c.send("Input.insertText", { text: "reddit@92ng.com" });
await new Promise(rr => setTimeout(rr, 1200));
// 回读组件值(shadow DOM 内 input 的 value)
console.log("EMAIL_VAL:", await c.evalT(`(() => { const el = document.querySelector('#register-email'); return el ? (el.value ?? (el.shadowRoot && el.shadowRoot.querySelector('input') ? el.shadowRoot.querySelector('input').value : 'no-input')) : 'gone'; })()`, 8000));
// 点继续
const r2 = await c.send("Runtime.evaluate", { expression: `(() => { const btn = [...document.querySelectorAll('button')].find(b => (b.innerText||'').trim()==='继续' && b.offsetParent !== null); if(!btn) return null; btn.scrollIntoView({block:'center'}); const rc = btn.getBoundingClientRect(); return JSON.stringify({x: rc.x + rc.width/2, y: rc.y + rc.height/2}); })()`, returnByValue: true });
console.log("BTN_RECT:", r2.result.value);
if (r2.result.value) {
  const { x: bx, y: by } = JSON.parse(r2.result.value);
  await c.send("Input.dispatchMouseEvent", { type: "mousePressed", x: bx, y: by, button: "left", clickCount: 1 });
  await c.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: bx, y: by, button: "left", clickCount: 1 });
}
await new Promise(rr => setTimeout(rr, 4000));
console.log("URL_NOW:", await c.evalT("location.href", 8000));
console.log("BODY_NOW:", (await c.evalT('(document.body.innerText||"").replace(/\\n+/g," | ").slice(0,400)', 8000)));
