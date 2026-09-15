// reg0000: Patch step2 — 填邮箱→submit→dump下一屏
import { attach } from "./_reg0000_attach.mjs";
const c = await attach(/patch\.com/);
await c.evalT(`(() => { const inp = [...document.querySelectorAll('input[type=email]')].find(i => i.offsetParent !== null); if(inp){ inp.focus(); return 'ok'; } return 'no'; })()`, 6000);
await new Promise(rr => setTimeout(rr, 300));
await c.send("Input.insertText", { text: "patch@92ng.com" });
await new Promise(rr => setTimeout(rr, 800));
console.log("EMAIL_VAL:", await c.evalT(`(() => { const inp = [...document.querySelectorAll('input[type=email]')].find(i => i.offsetParent !== null); return inp ? inp.value : '?'; })()`, 6000));
const r = await c.send("Runtime.evaluate", { expression: `(() => { const inp = [...document.querySelectorAll('input[type=email]')].find(i => i.offsetParent !== null); if(!inp) return null; const form = inp.closest('form'); const btn = form ? form.querySelector('button[type=submit]') : null; const target = btn || inp; target.scrollIntoView({block:'center'}); const rc = target.getBoundingClientRect(); return JSON.stringify({x: rc.x + rc.width/2, y: rc.y + rc.height/2}); })()`, returnByValue: true });
if (!r.result.value) { console.log("NO_TARGET"); process.exit(1); }
const { x, y } = JSON.parse(r.result.value);
await c.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
await c.send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
await new Promise(rr => setTimeout(rr, 5000));
console.log("URL_NOW:", await c.evalT("location.href", 8000));
console.log("BODY:", (await c.evalT('(document.body.innerText||"").replace(/\\n+/g," | ").slice(0,450)', 8000)));
console.log("FIELDS:", await c.evalT(`JSON.stringify([...document.querySelectorAll("input")].map(el => ({type: el.type, name: el.name||"", ph: (el.placeholder||"").slice(0,35), vis: el.offsetParent !== null})).filter(x => x.vis).slice(0,15))`, 10000));
