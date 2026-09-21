@echo off
rem 2026-09-12: this file became a detach-launcher (was the full pipeline body -> now
rem bm-quota-watch-work.bat). Why: the Bt panel scheduler entered a schedule-only state
rem (pretime/nexttime advancing every minute, zero executions; survived clean restarts of
rem btTask AND btPanel services) and the 09-10 20:02 round hung with no END line - a long
rem body inside the trigger file means one hang blocks/peppers every later round. Trigger
rem now lives in schtasks task "bm-quota-watch" (every 1 min, SYSTEM). This launcher exits
rem in <1s so overlapping instances are structurally impossible; overlapping WORK rounds
rem are guarded by bm-quota-gate.php BM_SAMPLING 150s anti-reentry.
rem Panel task id=2 (智普额度) is kept as a paused backup/manual-run surface - do not
rem re-enable it while this schtasks task exists (double trigger, harmless but noisy).
rem zcode.cjs needs the user-level model config: SYSTEM context HOME/USERPROFILE points to
rem systemprofile (no .zcode there) - "Model config is missing" since 2026-08-29. Redirect.
set "HOME=C:\Users\Administrator"
set "USERPROFILE=C:\Users\Administrator"
start "" /min cmd /c D:\Github\backlink_skills\cdp\bm-quota-watch-work.bat
exit /b
