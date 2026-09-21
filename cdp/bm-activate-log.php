<?php
/** 主动激活记录器（2026-09-09 用户指定）：主会话主动触发/自身消耗导致的 5h 窗口激活，
 *  必须落记录并标注「主动激活」。
 *  写三处：bm-watch.log 的 ACTIVE-ACTIVATE(主动激活) 行 + bm-activate-last.json 侧车
 *  （后台「每日额度」页头部展示「最近主动激活」）+ bm-activate-history.json 历史事件
 *  （2026-09-13 起页面列表按此把「窗口激活=主动激活」标到对应采样行上）。
 *  用法：php bm-activate-log.php "说明" */
require __DIR__ . '/bm-quota-lib.php';
$note = trim($argv[1] ?? '');
if ($note === '') {
    $note = '主会话token消耗触发首耗激活';
}
file_put_contents(
    __DIR__ . '/bm-activate-last.json',
    json_encode(['at' => date('Y-m-d H:i:s'), 'note' => $note, 'source' => 'main-session'], JSON_UNESCAPED_UNICODE)
);
bm_activate_event('manual', $note);
wlog('ACTIVE-ACTIVATE(主动激活): ' . $note);
echo "ACTIVE-ACTIVATE logged: {$note}\n";
