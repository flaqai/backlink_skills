<?php
/** 手动总暂停判定门：bm-quota-watch-work.bat 每轮最先调用。
 *  退出码 1=手动总暂停中（bm-pause.flag 存在）→ 整轮全跳过（不查额度/不用券/不poke/不保活）；0=放行。
 *  旧「静默窗 00:00-09:00 全停」逻辑已删（2026-09-21 用户指定，规则 09-20 已自然到期失效）。
 *  bm-quota-gate.php 顶部有同款兜底（防绕过 work bat 直跑管线）。
 */
require __DIR__ . '/bm-quota-lib.php';

if (inQuietWindow()) {
    wlog('skip: 手动总暂停（bm-pause.flag 存在）——不查额度、不用券、不poke、不保活');
    exit(1);
}
exit(0);
