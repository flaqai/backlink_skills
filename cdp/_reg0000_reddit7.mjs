// reg0000: Reddit step3 — 填OTP→继续→dump 用户名/密码屏
import { attach } from "./_reg0000_attach.mjs";
const c = await attach(/reddit\.com\/register/);
await c.evalT(`(() => { const el = document.querySelector('faceplate-text-input[name=code]'); const inp = el && el.shadowRoot && el.shadowRoot.querySelector('input'); if(inp){ inp.focus(); } return inp ? 'ok' : 'fail'; })()`, 6000);
await new Promise(rr => setTimeout(rr, 400));
await c.send("Input.insertText", { text: "064353" });
await new Promise(rr => setTimeout(rr, 1200));
console.log("CODE_VAL:", await c.evalT(`(() => { const el = document.querySelector('faceplate-text-input[name=code]'); const inp = el && el.shadowRoot && el.shadowRoot.querySelector('input'); return inp ? inp.value : 'noshadow'; })()`, 6000));
const r2 = await c.send("Runtime.evaluate", { expression: `(() => { const btn = [...document.querySelectorAll('button')].find(b => (b.innerText||'').trim()==='继续' && b.offsetParent !== null); if(!btn) return null; btn.scrollIntoView({block:'center'}); const rc = btn.getBoundingClientRect(); return JSON.stringify({x: rc.x + rc.width/2, y: rc.y + rc.height/2}); })()`, returnByValue: true });
if (!r2.result.value) { console.log("NO_BTN"); process.exit(1); }
const { x, y } = JSON.parse(r2.result.value);
await c.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
await c.send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
await new Promise(rr => setTimeout(rr, 4500));
console.log("URL:", await c.evalT("location.href", 8000));
console.log("BODY:", (await c.evalT('(document.body.innerText||"").replace(/\\n+/g," | ").slice(0,450)', 8000)));
console.log("SCREEN_FIELDS:", await c.evalT(`JSON.stringify([...document.querySelectorAll('faceplate-text-input')].map(el => ({name: el.name, vis: el.getBoundingClientRect().width > 0})))`, 8000));
