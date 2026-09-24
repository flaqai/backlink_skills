<?php
/** bm-cookie-expiry.php — bigmodel_token_production cookie 到期检查（定时任务入口）
 *  优先读采样器侧车 bm-cookie-expiry.json（采样时经 CDP Storage.getCookies 写入，不受 Chrome 文件锁影响）；
 *  侧车缺失/过期时退回直接拷 Cookies 库读取（流水线占用 Chrome 时常拷不动，故侧车为主）。
 *  输出单行 JSON：{ok, expires_at, days_left, status}  status: ok / expiring(≤48h) / expired / missing
 *  用法：C:/BtSoft/php/82/php.exe D:/Github/backlink_skills/cdp/bm-cookie-expiry.php
 */
date_default_timezone_set('Asia/Shanghai');
$dir = __DIR__;
$src = 'D:/Github/backlink_skills/cdp/profile-headed/Default/Network/Cookies';
$tmp = sys_get_temp_dir() . '/bm-cookies-check.db';

function emit(array $out): void {
    echo json_encode($out, JSON_UNESCAPED_UNICODE), PHP_EOL;
    $status = $out['status'] ?? 'err';
    exit(isset($out['ok']) && $out['ok'] ? 0 : ($status === 'missing' ? 0 : 1));
}

// ① 侧车（每次成功采样都会刷新；工作日死区前最后一采样约 09:59，10:30 检查时约半小时旧，够用）
$sidecar = $dir . '/bm-cookie-expiry.json';
if (is_file($sidecar)) {
    $sc = json_decode((string) @file_get_contents($sidecar), true);
    $fresh = $sc && !empty($sc['checked_at']) && (time() - strtotime($sc['checked_at'])) < 86400;
    if ($fresh && !empty($sc['expires_epoch'])) {
        emit([
            'ok' => true,
            'expires_at' => $sc['expires_at'] ?: date('Y-m-d H:i:s', (int) $sc['expires_epoch']),
            'days_left' => round(($sc['expires_epoch'] - time()) / 86400, 2),
            'status' => $sc['expires_epoch'] <= time() ? 'expired' : (($sc['expires_epoch'] - time()) <= 172800 ? 'expiring' : 'ok'),
            'source' => 'sidecar',
        ]);
    }
}

// ② 直接拷库（Chrome 空闲时可行；被流水线锁住则失败）
$copyOk = false;
for ($i = 0; $i < 3 && !$copyOk; $i++) {
    $copyOk = @copy($src, $tmp);
    if (!$copyOk) usleep(300000);
}
if (!$copyOk) {
    emit(['ok' => false, 'err' => 'copy_fail(chrome锁定且侧车缺失)', 'status' => 'err']);
}

$db = new PDO('sqlite:' . $tmp);
$row = $db->query("SELECT expires_utc FROM cookies
    WHERE host_key LIKE '%bigmodel.cn' AND name = 'bigmodel_token_production' LIMIT 1")->fetch(PDO::FETCH_ASSOC);
@unlink($tmp);

if (!$row) {
    emit(['ok' => false, 'status' => 'missing']);
}

$expTs = (int) ($row['expires_utc'] / 1000000) - 11644473600; // Chrome utc(1601纪元,微秒) → unix
emit([
    'ok' => true,
    'expires_at' => date('Y-m-d H:i:s', $expTs),
    'days_left' => round(($expTs - time()) / 86400, 2),
    'status' => $expTs <= time() ? 'expired' : (($expTs - time()) <= 172800 ? 'expiring' : 'ok'),
    'source' => 'cookies-db',
]);
