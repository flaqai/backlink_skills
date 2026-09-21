@echo off
rem bm-9224-heal.bat (2026-09-10) - target of the scheduled task "bm-9224-heal".
rem ensure-9224.mjs delegates here via "schtasks /run /tn bm-9224-heal" when the 1-min
rem cron monitor runs as LocalSystem: SYSTEM-launched chrome cannot decrypt the
rem Administrator profile's DPAPI cookie jar (NO_TOKEN + empty-jar overwrite,
rem 09-08 and 09-09 incidents). This task runs as the logged-on Administrator
rem instead, so the relaunched 9224 chrome uses profile-headed with cookies intact.
"C:\Program Files\nodejs\node.exe" D:\Github\backlink_skills\cdp\ensure-9224.mjs >> D:\Github\backlink_skills\cdp\bm-watch.log 2>&1
