<?php
/** 静默窗判定门（2026-09-13 用户指定）：bm-quota-watch-work.bat 每轮最先调用。
 *  退出码 1=处于静默窗（2026-09-20 前的每天 00:00-09:00）→ 整轮全跳过（不查额度/不用券/不poke/不保活）；
 *  0=放行走原管线。bm-quota-gate.php 顶部有同款兜底（防绕过 work bat 直跑管线）。
 */
require __DIR__ . '/bm-quota-lib.php';

if (inQuietWindow()) {
    wlog('skip: 静默窗 00:00-09:00（2026-09-20 前）系统全停——不查额度、不用券、不poke、不保活');
    exit(1);
}
exit(0);
