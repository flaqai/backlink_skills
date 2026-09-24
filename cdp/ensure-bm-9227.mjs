// 9227 额度管家专属 Chrome 自愈（2026-09-10 建；2026-09-21 额度管家改造定稿）
// 定位：本机额度账号（C 机=shared 共享池 / B 机=d-独立 账号2）的唯一保活采样实例——
// 独立 user-data-dir（profile-bm-user），登录态由 Chrome profile 自持（cookie 自持登录，
// 不再从插件/外部导入；换号/重登直接在这个 Chrome 里操作）。
// ★--proxy-server=direct://（2026-09-21 用户指定）：直连不走 airtcp 系统代理，防账号 IP 漂移。
// ★必须以 Administrator 交互身份拉起（经 schtasks bm-9227-heal 委托）：SYSTEM 拉起会
// DPAPI 换钥清掉自持登录的 cookie（09-09 9224 案实证）。SYSTEM 侧绝不直拉本实例。
import { spawn } from 'child_process';
import fs from 'fs';

const BASE = 'http://127.0.0.1:9227';
const LOG = 'D:/Github/backlink_skills/cdp/bm-watch.log';
const wlog = (line) => { try { fs.appendFileSync(LOG, line + '\n'); } catch {} console.log(line); };
const stamp = () => { const d = new Date(); const p = (x) => String(x).padStart(2, '0'); return `[${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}]`; };

const alive = () => fetch(BASE + '/json/version', { signal: AbortSignal.timeout(3000) }).then(r => r.ok).catch(() => false);
if (await alive()) { console.log('9227 ALIVE'); process.exit(0); }

const child = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--remote-debugging-port=9227',
  '--user-data-dir=D:\\Github\\backlink_skills\\cdp\\profile-bm-user',
  '--proxy-server=direct://',
  '--no-first-run',
  '--no-default-browser-check',
  '--window-size=1100,800',
  'https://www.bigmodel.cn/coding-plan/personal/usage',
], { detached: true, stdio: 'ignore' });
child.unref();
wlog(`${stamp()} 9227: quota-manager chrome down → relaunching (direct proxy, Administrator ctx required for DPAPI)`);

for (let i = 0; i < 14; i++) {
  await new Promise(r => setTimeout(r, 1500));
  if (await alive()) { wlog(`${stamp()} 9227: RELAUNCHED`); process.exit(0); }
}
wlog(`${stamp()} 9227: RELAUNCH FAIL`);
process.exit(1);
