@echo off
rem async wrapper for the cutoff resume session (2026-08-29):
rem main bat "start"s this wrapper and returns immediately so the 1-min cron
rem monitoring pipeline keeps running while the headless session works.
rem BM_RESUME_RUNNING guards double-launch: written at start, deleted at end;
rem record.php skips launching a second one while this file is fresh (<6h).
echo %DATE% %TIME%> D:\Github\backlink_skills\cdp\BM_RESUME_RUNNING
set "HOME=C:\Users\Administrator"
set "USERPROFILE=C:\Users\Administrator"
"C:\Program Files\nodejs\node.exe" "D:\Program Files\ZCode\resources\glm\zcode.cjs" -p "Read D:/Github/backlink_skills/cdp/bm-resume-playbook.md and follow it strictly. Quota has recovered. Step 1: rebuild the missing closing summary of the interrupted window. Step 2: resume that window work until window end time." --cwd D:\Github\seoadminC > D:\Github\backlink_skills\cdp\bm-resume-last.out 2>&1
del D:\Github\backlink_skills\cdp\BM_RESUME_RUNNING
