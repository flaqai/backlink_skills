// reg0000: Patch 终攻 — 从真实社区页发起注册
import { attach } from "./_reg0000_attach.mjs";
const c = await attach(/patch\.com/);
await c.send("Page.navigate", { url: "https://patch.com/california/millvalley" });
await new Promise(rr => setTimeout(rr, 7000));
console.log("URL:", await c.evalT("location.href", 8000));
// 找社区页的 Sign up 按钮
const r = await c.send("Runtime.evaluate", { expression: `(() => { const btn = [...document.querySelectorAll('button, a')].find(b => /^(Sign up|Sign Up|Join)$/.test((b.innerText||'').trim()) && b.offsetParent !== null); if(!btn) return null; btn.scrollIntoView({block:'center'}); const rc = btn.getBoundingClientRect(); return JSON.stringify({tag: btn.tagName, x: rc.x + rc.width/2, y: rc.y + rc.height/2, href: btn.href||""}); })()`, returnByValue: true });
console.log("SIGNUP_TARGET:", r.result.value);
if (!r.result.value) { console.log("NO_SIGNUP_ON_TOWNPAGE"); process.exit(1); }
const { tag, x, y } = JSON.parse(r.result.value);
await c.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
await c.send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
await new Promise(rr => setTimeout(rr, 5000));
console.log("URL_NOW:", await c.evalT("location.href", 8000));
console.log("FIELDS:", await c.evalT(`JSON.stringify([...document.querySelectorAll("input, button[type=submit]")].map(el => ({tag: el.tagName, type: el.type||"", name: el.name||"", ph: (el.placeholder||"").slice(0,35), vis: el.offsetParent !== null})).filter(x => x.vis).slice(0,15))`, 10000));
