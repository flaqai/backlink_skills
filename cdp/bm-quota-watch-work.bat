@echo off
rem step -2 (2026-09-13 user): quiet window - until 2026-09-20, every day 00:00-09:00 the
rem WHOLE quota system pauses: no sampling (= no quota queries at all), no voucher
rem activation, no reset-time poke, and keep-alive/cookie-inject skipped too. Helper
rem writes one skip line per round to bm-watch.log; gate.php has the same guard in case
rem the pipeline is ever run directly. 09:00 rounds resume automatically.
C:\BtSoft\php\82\php.exe D:\Github\backlink_skills\cdp\bm-quiet-window.php
if %errorlevel%==1 exit /b
rem zcode.cjs needs the user-level model config: btTask runs this bat as LocalSystem whose
rem HOME/USERPROFILE points to systemprofile (no .zcode there) - poke/resume all failed
rem with "Model config is missing" until 2026-08-29. Redirect to Administrator profile.
set "HOME=C:\Users\Administrator"
set "USERPROFILE=C:\Users\Administrator"
rem step -1 (2026-09-10): keep-alive for both monitor chromes EVERY round, dead-zone included.
rem 12:26 incident: a work window swept 9225+9226 by process name (9224 survived) while the
rem gate was in daytime dead zone - no sample path ran, so the step-2.5 heal never fired and
rem the monitor stayed down for hours. ensure self-checks aliveness and exits in ~0.2s when up.
rem 9227 (user-login browser) MUST be relaunched via schtasks as Administrator - SYSTEM cannot
rem (DPAPI wipes the user's hand-login cookie jar); falls back to schtasks bm-9224-heal style.
"C:\Program Files\nodejs\node.exe" D:\Github\backlink_skills\cdp\ensure-bm-9226.mjs >nul 2>&1
curl -s -m 3 http://127.0.0.1:9227/json/version >nul 2>&1
if %errorlevel%==1 schtasks /run /tn bm-9227-heal >nul 2>&1
rem step 0: manual cookie from extension save-button (fast exit when no pending file)
"C:\Program Files\nodejs\node.exe" D:\Github\backlink_skills\cdp\bm-cookie-inject.mjs >nul 2>&1
rem step 1: window + throttle gate (php shell funcs disabled, node called by bat directly)
C:\BtSoft\php\82\php.exe D:\Github\backlink_skills\cdp\bm-quota-gate.php
if not %errorlevel%==1 goto :end
rem step 2: api sample -> bm-last.json
"C:\Program Files\nodejs\node.exe" D:\Github\backlink_skills\cdp\bm-quota-check.mjs > D:\Github\backlink_skills\cdp\bm-last.json 2>nul
rem step 2.5: 9226 monitor-chrome self-heal (2026-09-10: monitoring moved to a dedicated
rem chrome instance, isolated from the work-window 9224/9225 churn that caused the
rem 09-02/09-08/09-09 outages. Cooldown 600s lives in bm-chrome-heal.php at this bat
rem layer only - ensure-bm-9226.mjs itself stays unconditional)
findstr /C:"CHROME_DOWN" D:\Github\backlink_skills\cdp\bm-last.json >nul 2>&1
if errorlevel 1 goto :record
C:\BtSoft\php\82\php.exe D:\Github\backlink_skills\cdp\bm-chrome-heal.php
if not %errorlevel%==1 goto :record
"C:\Program Files\nodejs\node.exe" D:\Github\backlink_skills\cdp\ensure-bm-9226.mjs >> D:\Github\backlink_skills\cdp\bm-watch.log 2>&1
rem 2026-09-10: chrome died+relaunched means the cookie jar we injected into may be wiped
rem (disposable monitor profile, any relaunch identity). Drop the archive marker so step 0
rem next round re-seeds the bigmodel cookie automatically - keeps sampling from going blind.
if exist D:\Github\backlink_skills\cdp\bm-archive-injected.json del /q D:\Github\backlink_skills\cdp\bm-archive-injected.json
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
