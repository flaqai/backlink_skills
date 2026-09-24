<?php
/** 9227 额度管家专属 Chrome 自愈决策（bat step 2.5 调用；2026-09-21 改造：唯一采样实例）：
 *  采样结果含 CHROME_DOWN / ALL_PORTS_DOWN 时放行拉起。退出码 1=放行拉起 0=冷却中跳过。
 *  2026-09-08 20:04 券过期事故：chrome 19:47 死后抢救窗 27 轮采样全 CHROME_DOWN 无任何
 *  自愈，券作废——本脚本+bat接线补上这一环。
 *  拉起动作=bat 调 schtasks bm-9227-heal（Administrator 身份，DPAPI 稳定）。
 *  冷却只加在本管线（chrome 反复被杀时最多10分钟拉起一次防风暴）。 */
require __DIR__ . '/bm-quota-lib.php';
$marker = __DIR__ . '/BM_CHROME_HEAL';
$last = (float) @file_get_contents($marker);
if ($last > time() - 600) {
    wlog('chrome-heal: 冷却中(距上次拉起' . (int) (time() - $last) . 's<600s)');
    exit(0);
}
file_put_contents($marker, (string) time());
wlog('chrome-heal: CHROME_DOWN → 放行 schtasks bm-9227-heal（10分钟冷却起算）');
exit(1);
