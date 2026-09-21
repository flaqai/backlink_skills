<?php
/** 共用：日志 + DB 连接（宝塔 php 禁用全部 shell 函数，node 由 bat 调用） */
function wlog(string $line): void
{
    @file_put_contents(__DIR__ . '/bm-watch.log', date('[m-d H:i:s] ') . $line . "\n", FILE_APPEND);
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO('mysql:host=127.0.0.1;dbname=seoadmin;charset=utf8mb4', 'root', 'root', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    }
    return $pdo;
}

/** 账号池配置（2026-09-21 用户定稿：五机两账号池）
 *  机器本地 cdp/bm-account.json（gitignore，不随仓库走）：
 *    { "account_key": "shared",  "poke": true }   ← C 机（A/B/C/E 共享订阅池）
 *    { "account_key": "d-独立", "poke": false }   ← B 机（D 的独立账号2；poke/续跑/抢救推
 *                                                    只有 ZCode 登录账号2 的 D 机能做，B 只采样/用券/到期提醒）
 *  coding_plan_quota_logs 走 RDS 高频同步——B 机 d-独立 行会同步进本机库，
 *  本管线一切读写都必须按 account_key 过滤（缺省 shared 保证 C 机开箱即用）。 */
function bm_account_key(): string
{
    static $key = null;
    if ($key === null) {
        $j = json_decode((string) @file_get_contents(__DIR__ . '/bm-account.json'), true);
        $key = (is_array($j) && !empty($j['account_key'])) ? (string) $j['account_key'] : 'shared';
    }
    return $key;
}

/** 本机是否允许 poke 计时激活/续跑会话/抢救推（依赖本机 ZCode 登录对应账号；B 机=false） */
function bm_poke_allowed(): bool
{
    $j = json_decode((string) @file_get_contents(__DIR__ . '/bm-account.json'), true);
    return !is_array($j) || !array_key_exists('poke', $j) ? true : (bool) $j['poke'];
}

/** 常规监控窗口：周末全天 + 工作日 18:00-次日09:00（in_gift_window 字段按此记录；
 *  2026-09-21 用户定稿作息——此窗口=常规监控照常，工作日 09:00-18:00 白天死区只剩
 *  重置点前~10分钟/后~5分钟各一条采样，见 bm-quota-gate.php 死区分支） */
function inWindow(): bool
{
    $w = (int) date('w'); // 0=周日 6=周六
    $H = (int) date('G');
    return ($w === 0 || $w === 6) || $H >= 18 || $H < 9;
}

/** 手动总暂停（2026-09-20 18:40 用户指定）：cdp/bm-pause.flag 存在 → 全链（采样/用券/
 *  poke/保活/resume）一律停；恢复 = 删掉 flag 文件，下一轮 1 分钟内自动恢复。
 *  旧「静默窗 00:00-09:00 全停」逻辑已按 2026-09-21 用户指令删除（原规则本就 09-20 到期失效）。 */
function inQuietWindow(?int $now = null): bool
{
    return is_file(__DIR__ . '/bm-pause.flag');
}

/** 激活事件历史（2026-09-13 用户要求「每日额度」页标出哪次是主动激活）：
 *  type = manual(主动激活，主会话触发/自身首耗) | poke(监控管线自动计时激活) | voucher(用券重置)。
 *  追加写 bm-activate-history.json，控制器按事件时间把「窗口激活」标到其后 45 分钟内第一条采样行。 */
function bm_activate_event(string $type, string $note): void
{
    $f = __DIR__ . '/bm-activate-history.json';
    $hist = json_decode((string) @file_get_contents($f), true);
    if (!is_array($hist)) { $hist = []; }
    $hist[] = ['t' => time(), 'at' => date('Y-m-d H:i:s'), 'type' => $type, 'note' => $note];
    @file_put_contents($f, json_encode(array_slice($hist, -300), JSON_UNESCAPED_UNICODE), LOCK_EX);
}
