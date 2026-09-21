<?php
/**
 * bm-quota-save.php — 把 bm-quota-check.mjs 的 JSON 采样写入 seoadmin.coding_plan_quota_logs
 * 用法：node bm-quota-check.mjs | /c/BtSoft/php/82/php.exe bm-quota-save.php
 * stdin 为 READ_FAIL 或非 JSON 行时静默跳过（exit 1），正常插入输出 SAVED id=N
 */
$line = trim(stream_get_contents(STDIN));
if ($line === '' || $line[0] !== '{') {
    fwrite(STDERR, "SKIP: no json input\n");
    exit(1);
}
$d = json_decode($line, true);
if (!is_array($d) || !isset($d['pct']) || $d['pct'] === null) {
    fwrite(STDERR, "SKIP: invalid data\n");
    exit(1);
}

// 赠送窗口：周末全天；工作日 18:00-09:00
$w = (int) date('w'); // 0=周日 6=周六
$hour = (int) date('G');
$inWindow = ($w === 0 || $w === 6) || $hour >= 18 || $hour < 9;

$resetAt = isset($d['resetTime']) ? trim(str_replace('重置时间：', '', $d['resetTime'])) : null;
$refreshedAt = isset($d['refreshedAt']) ? trim(str_replace('最近刷新时间：', '', $d['refreshedAt'])) : null;

$pdo = new PDO(
    'mysql:host=127.0.0.1;dbname=seoadmin;charset=utf8mb4',
    'root',
    'root',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);
$stmt = $pdo->prepare(
    'INSERT INTO coding_plan_quota_logs
        (usage_percent, has_voucher, reset_at, page_refreshed_at, in_gift_window, account_key, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())'
);
$stmt->execute([
    min(100, max(0, (int) $d['pct'])),
    !empty($d['hasBtn']) ? 1 : 0,
    $resetAt ?: null,
    $refreshedAt ?: null,
    $inWindow ? 1 : 0,
    'shared', // 手动保存通道只存在于采样机（C=shared）；B 机请走管线 bm-account.json 配置
]);
echo 'SAVED id=' . $pdo->lastInsertId() . " pct={$d['pct']}% voucher=" . (!empty($d['hasBtn']) ? 1 : 0) . " window=" . ($inWindow ? 1 : 0) . "\n";
