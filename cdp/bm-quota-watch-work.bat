@echo off
rem step -2 (2026-09-21 user): manual-pause gate only - bm-pause.flag exists = whole
rem quota system pauses (no sampling / voucher use / poke / keep-alive). The OLD
rem 00:00-09:00 quiet-window logic was deleted per the same 2026-09-21 directive
rem (it had already expired on 09-20). Helper writes one skip line per round to
rem bm-watch.log; gate.php has the same guard in case the pipeline is run directly.
C:\BtSoft\php\82\php.exe D:\Github\backlink_skills\cdp\bm-quiet-window.php
if %errorlevel%==1 exit /b
rem zcode.cjs needs the user-level model config: btTask runs this bat as LocalSystem whose
rem HOME/USERPROFILE points to systemprofile (no .zcode there) - poke/resume all failed
rem with "Model config is missing" until 2026-08-29. Redirect to Administrator profile.
set "HOME=C:\Users\Administrator"
set "USERPROFILE=C:\Users\Administrator"
rem step -1 (2026-09-21 quota-manager overhaul): keep-alive for the ONE dedicated
rem quota-manager chrome (9227: own user-data-dir profile-bm-user + --proxy-server=direct://
rem so it never rides the airtcp system proxy - prevents account IP drift). Must relaunch
rem via schtasks bm-9227-heal as Administrator - SYSTEM cannot (DPAPI wipes the self-held
rem login cookie jar). The old 9226 monitor instance is retired.
curl -s -m 3 http://127.0.0.1:9227/json/version >nul 2>&1
if %errorlevel%==1 schtasks /run /tn bm-9227-heal >nul 2>&1
rem (old step 0 cookie-inject DELETED, 2026-09-21 user directive: cookie is now self-held
rem by logging in INSIDE the 9227 dedicated chrome - no import from extension/external.
rem one-off bootstrap tool: node bm-cookie-inject.mjs 9227)
rem step 1: window + throttle gate (php shell funcs disabled, node called by bat directly)
C:\BtSoft\php\82\php.exe D:\Github\backlink_skills\cdp\bm-quota-gate.php
if not %errorlevel%==1 goto :end
rem step 2: api sample -> bm-last.json (9227 dedicated instance)
"C:\Program Files\nodejs\node.exe" D:\Github\backlink_skills\cdp\bm-quota-check.mjs > D:\Github\backlink_skills\cdp\bm-last.json 2>nul
rem step 2.5: 9227 self-heal (cooldown 600s lives in bm-chrome-heal.php at this bat
rem layer; heal action = schtasks bm-9227-heal relaunch as Administrator)
findstr /C:"CHROME_DOWN" /C:"ALL_PORTS_DOWN" D:\Github\backlink_skills\cdp\bm-last.json >nul 2>&1
if errorlevel 1 goto :record
C:\BtSoft\php\82\php.exe D:\Github\backlink_skills\cdp\bm-chrome-heal.php
if not %errorlevel%==1 goto :record
schtasks /run /tn bm-9227-heal >nul 2>&1
rem healed -> immediate re-sample so this round still lands (voucher rescue window needs data)
"C:\Program Files\nodejs\node.exe" D:\Github\backlink_skills\cdp\bm-quota-check.mjs > D:\Github\backlink_skills\cdp\bm-last.json 2>nul
:record
rem step 3: db insert + decision (0=normal 2=use voucher 3=poke timer 4=resume after cutoff)
C:\BtSoft\php\82\php.exe D:\Github\backlink_skills\cdp\bm-quota-record.php
set REC=%errorlevel%
if %REC%==2 (
  rem use reset voucher (>=90%% line or expiring rescue), result in bm-use-last.out
  "C:\Program Files\nodejs\node.exe" D:\Github\backlink_skills\cdp\bm-voucher-use.mjs > D:\Github\backlink_skills\cdp\bm-use-last.out 2>&1
)
if %REC%==3 (
  rem idle window with empty reset_at: real ZCode headless prompt burns plan tokens and starts the 5h timer
  rem (must go through ZCode client for coding-plan attribution; direct API calls don't count)
  "C:\Program Files\nodejs\node.exe" "D:\Program Files\ZCode\resources\glm\zcode.cjs" -p "ok" --cwd D:\Github\seoadminC > D:\Github\backlink_skills\cdp\bm-poke-last.out 2>&1
  rem immediate re-sample: new reset_time (= poke + 5h) is queryable the moment the poke completes
  "C:\Program Files\nodejs\node.exe" D:\Github\backlink_skills\cdp\bm-quota-check.mjs > D:\Github\backlink_skills\cdp\bm-last.json 2>nul
  C:\BtSoft\php\82\php.exe D:\Github\backlink_skills\cdp\bm-quota-record.php
)
if %REC%==5 (
  rem cutoff: rescue-push everything already saved to RDS (the interrupted session lost its tokens before doing its own closing push)
  C:\BtSoft\php\82\php.exe D:\Github\seoadminC\artisan seoadmin:sync-rds --direction=push --limit=2000 > D:\Github\backlink_skills\cdp\bm-rescue-push.out 2>&1
)
if %REC%==4 (
  rem quota recovered after cutoff: relaunch interrupted work via real ZCode headless session (playbook-driven)
  rem async launch (2026-08-29): the resume session runs until window end (hours) - a blocking call here
  rem freezes the whole 1-min cron monitoring pipeline (btTask serializes same task), quota page stops updating.
  rem wrapper writes BM_RESUME_RUNNING so record.php will not double-launch while it works.
  start "" /min cmd /c D:\Github\backlink_skills\cdp\bm-resume-launch.bat
)
:end
rem step 4: heartbeat trail - one status line per round "time pct% vouchers" (was the panel
rem cron log; 2026-09-12 the trigger moved to schtasks bm-quota-watch so the trail lives here)
C:\BtSoft\php\82\php.exe D:\Github\backlink_skills\cdp\bm-quota-summary.php >> D:\Github\backlink_skills\cdp\bm-quota-watch-work.log 2>&1
