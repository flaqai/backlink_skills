@echo off
rem One-time elevated install: register the "bm-9227-heal" scheduled task
rem (Administrator interactive context). Needed once per machine that runs the
rem quota-manager pipeline (C machine already has it; B machine runs this when
rem deploying the account-2 manager, 2026-09-21).
rem Why: the 1-min watch loop runs as LocalSystem - launching chrome directly
rem under SYSTEM re-keys DPAPI and wipes the self-held login cookie jar
rem (09-08/09-09 incidents). With this task, SYSTEM-side code only does
rem "schtasks /run /tn bm-9227-heal" and chrome relaunches as the logged-on
rem Administrator with cookies intact.
rem Double-click -> accept the UAC prompt. The task itself is only ever
rem triggered on demand (sc once, far-future dummy time); safe to re-run.
net session >nul 2>&1
if not %errorlevel%==0 (
  echo Need elevation - relaunching with UAC prompt...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)
schtasks /create /tn "bm-9227-heal" /tr "\"D:\Github\backlink_skills\cdp\ensure-bm-9227.mjs-wrapper.bat\"" /sc once /st 23:59 /sd 2099/01/01 /f
if %errorlevel%==0 (
  echo.
  echo TASK CREATED OK:
  schtasks /query /tn "bm-9227-heal"
) else (
  echo.
  echo CREATE FAILED - errorlevel %errorlevel%
)
pause
