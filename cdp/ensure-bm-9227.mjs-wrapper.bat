@echo off
rem wrapper target of scheduled task "bm-9227-heal" (name must match the /tr registered
rem via elevation). ensure-bm-9227.mjs relaunches the user-login monitor browser in the
rem Administrator interactive session - SYSTEM must never launch it directly (DPAPI).
"C:\Program Files\nodejs\node.exe" D:\Github\backlink_skills\cdp\ensure-bm-9227.mjs >> D:\Github\backlink_skills\cdp\bm-watch.log 2>&1
