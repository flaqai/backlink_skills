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

/** 官方赠送窗口：周末全天 + 工作日 18:00-次日09:00（in_gift_window 字段按此记录） */
function inWindow(): bool
{
    $w = (int) date('w'); // 0=周日 6=周六
    $H = (int) date('G');
    return ($w === 0 || $w === 6) || $H >= 18 || $H < 9;
}

/** 静默窗（2026-09-13 用户指定，2026-09-20 00:00 前生效）：每天 00:00-09:00 整个额度系统暂停——
 *  不采样（额度也不查）、不用重置券、不做重置计时激活（poke）、chrome 保活/cookie 注入一并停。
 *  09-20 00:00 起首条件永久为假，规则自然失效；$now 参数仅供边界测试。 */
function inQuietWindow(?int $now = null): bool
{
    $now = $now ?? time();
    return $now < strtotime('2026-09-20 00:00:00') && (int) date('G', $now) < 9;
}
