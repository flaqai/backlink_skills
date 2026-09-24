@echo off
rem 一次性提权安装：注册 bm-9224-heal 计划任务（Administrator 身份）。
rem 用途：额度管线 bm-quota-watch.bat 以 SYSTEM 运行，chrome 死亡后 ensure-9224.mjs
rem 在 SYSTEM 下自己拉 chrome 会解不开 Administrator 的 DPAPI cookie（09-08 23:19 事故：
rem 整罐判废+空罐覆盖磁盘）。有本任务后 SYSTEM 侧只 schtasks /run 委派，chrome 以
rem Administrator 交互身份重建，登录态保得住。
rem 双击运行 → UAC 点「是」即可；装完可删本文件。
net session >nul 2>&1
if not %errorlevel%==0 (
  echo Need elevation - relaunching with UAC prompt...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)
schtasks /create /tn "bm-9224-heal" /tr "\"C:\Program Files\nodejs\node.exe\" \"D:\Github\backlink_skills\cdp\ensure-9224.mjs\"" /sc once /st 23:59 /f
if %errorlevel%==0 (
  echo.
  echo TASK CREATED OK:
  schtasks /query /tn "bm-9224-heal"
) else (
  echo.
  echo CREATE FAILED - errorlevel %errorlevel%
)
pause
