// reg0000: Patch — 真实点击 Sign up 按钮
import { attach } from "./_reg0000_attach.mjs";
const c = await attach(/patch\.com/);
const r = await c.send("Runtime.evaluate", { expression: `(() => { const btn = [...document.querySelectorAll('button')].find(b => (b.innerText||'').trim()==='Sign up' && b.offsetParent !== null); if(!btn) return null; btn.scrollIntoView({block:'center'}); const rc = btn.getBoundingClientRect(); return JSON.stringify({x: rc.x + rc.width/2, y: rc.y + rc.height/2}); })()`, returnByValue: true });
if (!r.result.value) { console.log("NO_SIGNUP_BTN"); process.exit(1); }
const { x, y } = JSON.parse(r.result.value);
await c.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
await c.send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
await new Promise(rr => setTimeout(rr, 5000));
console.log("URL_NOW:", await c.evalT("location.href", 8000));
console.log("BODY:", (await c.evalT('(document.body.innerText||"").replace(/\\n+/g," | ").slice(0,500)', 8000)));
console.log("INPUTS:", await c.evalT(`JSON.stringify([...document.querySelectorAll("input,button[type=submit]")].map(el => ({tag: el.tagName, type: el.type||"", name: el.name||"", ph: (el.placeholder||"").slice(0,40), label: el.getAttribute("aria-label")||"", vis: el.offsetParent !== null})).filter(x => x.vis).slice(0,20))`, 10000));
