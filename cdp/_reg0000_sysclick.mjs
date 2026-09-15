// reg0000: CDP断开后系统级SendInput点击（过CF侦测）
// 用法: node _reg0000_sysclick.mjs <tabIdPrefix> <x> <y>
import child_process from 'child_process';

const TABP = process.argv[2], X = parseInt(process.argv[3]), Y = parseInt(process.argv[4]);
const sleep = ms => new Promise(r => setTimeout(r, ms));

// 1. CDP: 找tab并激活，随后立即断开
const list = await fetch('http://127.0.0.1:9224/json').then(r => r.json());
const t = list.find(x => x.id.startsWith(TABP) && x.type === 'page');
if (!t) { console.log('TAB_NOT_FOUND'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + t.id);
console.log('activated', t.id.slice(0, 12));
await sleep(3000); // 等窗口置前+合成器出帧

// 2. 断CDP后系统级点击（SendInput）
// 窗口内容区坐标转屏幕坐标: Chrome窗口边框~8px水平、标题+边框~图标高度。用 user32 ClientToScreen 最准
const ps = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
  [DllImport("user32.dll")] public static extern IntPtr FindWindow(string cls, string title);
  [DllImport("user32.dll")] public static extern bool ClientToScreen(IntPtr hwnd, ref POINT p);
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint f, uint dx, uint dy, uint data, UIntPtr extra);
  [StructLayout(LayoutKind.Sequential)] public struct POINT { public int X; public int Y; }
}
"@
\$hwnd = (Get-Process chrome | Where-Object { \$_.MainWindowTitle -ne '' } | Sort-Object -Property StartTime -Descending | Select-Object -First 1).MainWindowHandle
if (\$hwnd -eq [IntPtr]::Zero) { Write-Output 'NO_WINDOW'; exit 1 }
\$pt = New-Object Win32+POINT
\$pt.X = ${X}; \$pt.Y = ${Y}
[Win32]::ClientToScreen(\$hwnd, [ref]\$pt) | Out-Null
[Win32]::SetCursorPos(\$pt.X, \$pt.Y) | Out-Null
Start-Sleep -Milliseconds 300
[Win32]::mouse_event(2, 0, 0, 0, [UIntPtr]::Zero)  # LEFTDOWN
Start-Sleep -Milliseconds 120
[Win32]::mouse_event(4, 0, 0, 0, [UIntPtr]::Zero)  # LEFTUP
Write-Output ("CLICKED_SCREEN " + \$pt.X + "," + \$pt.Y)
`;
child_process.execSync('powershell -NoProfile -Command -', { input: ps, stdio: ['pipe', 'pipe', 'inherit'] });
console.log('sysclick done');
