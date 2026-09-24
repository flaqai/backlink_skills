@echo off
rem 一次性提权安装：注册 bm-quota-watch 计划任务（SYSTEM 身份，每分钟）。
rem 2026-09-12：宝塔面板调度器进入「只排程不执行」状态（pretime/nexttime 每分钟推进、
rem 零执行；干净重启 btTask/btPanel 均无效），额度监控改由本 schtasks 任务触发。
rem 双击运行 → UAC 点「是」即可；装完可删本文件。
net session >nul 2>&1
if not %errorlevel%==0 (
  echo Need elevation - relaunching with UAC prompt...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)
schtasks /create /tn "bm-quota-watch" /tr "\"D:\Github\backlink_skills\cdp\bm-quota-watch.bat\"" /sc minute /mo 1 /ru SYSTEM /f
if %errorlevel%==0 (
  echo.
  echo TASK CREATED OK:
  schtasks /query /tn "bm-quota-watch"
  echo.
  echo RUN ONCE NOW:
  schtasks /run /tn "bm-quota-watch"
) else (
  echo.
  echo CREATE FAILED - errorlevel %errorlevel%
)
