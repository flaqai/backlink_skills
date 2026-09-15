// reg0000: Patch — 找 Sign up 真入口
import { attach } from "./_reg0000_attach.mjs";
const c = await attach(/patch\.com/);
console.log("SIGNUP_LINKS:", await c.evalT(`JSON.stringify([...document.querySelectorAll("a")].filter(a => /sign.?up|join|register|account/i.test((a.innerText||"")+(a.href||""))).map(a => ({txt: (a.innerText||"").trim().slice(0,30), href: a.href.slice(0,90)})).slice(0,12))`, 10000));
