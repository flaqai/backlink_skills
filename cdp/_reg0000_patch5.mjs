// reg0000: Patch step3 — Enter提交 + 网络监听
import { attach } from "./_reg0000_attach.mjs";
const c = await attach(/patch\.com/);
await c.send("Network.enable");
let sawPost = [];
c.on(m => { if (m.method === "Network.requestWillBeSent" && m.params.request.method === "POST") sawPost.push(m.params.request.url.slice(0, 120)); });
await c.evalT(`(() => { const inp = [...document.querySelectorAll('input[type=email]')].find(i => i.offsetParent !== null); if(!inp) return 'no'; inp.focus(); return 'ok'; })()`, 6000);
await c.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
await c.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
await new Promise(rr => setTimeout(rr, 5000));
console.log("POSTS:", JSON.stringify(sawPost));
console.log("URL:", await c.evalT("location.href", 6000));
console.log("BODY_TAIL:", (await c.evalT('(document.body.innerText||"").replace(/\\n+/g," | ").slice(0,250)', 8000)));
console.log("FIELDS:", await c.evalT(`JSON.stringify([...document.querySelectorAll("input")].map(el => ({type: el.type, name: el.name||"", ph: (el.placeholder||"").slice(0,35), vis: el.offsetParent !== null})).filter(x => x.vis).slice(0,15))`, 8000));
