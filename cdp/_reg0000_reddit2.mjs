// reg0000: Reddit 注册第二步 — attach 现有 tab, dump 表单
import { attach } from "./_reg0000_attach.mjs";
const c = await attach(/reddit\.com\/register/);
console.log("TITLE:", await c.evalT("document.title", 8000));
console.log("URL:", await c.evalT("location.href", 6000));
console.log("FIELDS:", await c.evalT(`JSON.stringify([...document.querySelectorAll("input,button")].map(el => ({tag: el.tagName, type: el.type||"", name: el.name||"", id: el.id||"", ph: (el.placeholder||"").slice(0,30), txt: (el.innerText||"").trim().slice(0,25), vis: el.offsetParent !== null})).filter(x => x.vis).slice(0,20))`, 10000));
console.log("BODY_HEAD:", (await c.evalT('(document.body.innerText||"").replace(/\\n+/g," | ").slice(0,300)', 8000)));
