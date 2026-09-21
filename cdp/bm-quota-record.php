<?php
/** 第3步（bat调用）：读 bm-last.json → 入库 + 阈值标记。退出码 1=刚立标记需发邮件 0=正常/跳过
 *  ★account_key（2026-09-21 用户定稿）：INSERT 带 bm-account.json 的账号池标识（C=shared/B=d-独立），
 *  决策类 SELECT 同步按 account_key 过滤（本表走 RDS 高频同步，跨池行会混进来）。
 *  ★poke/resume/rescue 只在本机配置允许时触发（bm_poke_allowed；B 机=false——账号2 的
 *  计时激活只有 ZCode 登录账号2 的 D 机能做，B 只采样/用券/到期提醒）。 */
require __DIR__ . '/bm-quota-lib.php';
$dir = __DIR__;
$marker = $dir . '/BM_ACTIVATE_NOW';
$ak = bm_account_key();

// gate 放行时建的防重标记，无论本轮结果如何收尾必须清（残留150s后也会自动失效）
register_shutdown_function(function () use ($dir) { @unlink($dir . '/BM_SAMPLING'); });

// bm-last.json 可能带 "SOURCE_PORT <port>" 前缀行（check.mjs v5 双通道起），取第一行 JSON
$lines = @file($dir . '/bm-last.json', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
$json = '';
foreach ($lines as $ln) {
    $ln = trim($ln);
    if ($ln !== '' && $ln[0] === '{') { $json = $ln; break; }
}
if ($json === '') { wlog('skip: 采样失败 → ' . substr(implode(' ', $lines), 0, 120)); exit(0); }
$d = json_decode($json, true);
if (!is_array($d) || !isset($d['pct']) || $d['pct'] === null) { wlog('skip: JSON 无效'); exit(0); }

// 入库（与 bm-quota-save.php 同逻辑；in_gift_window 按实际窗口状态记录）
// reset_at 脏值过滤：bigmodel 规则=下个重置时间从刷新后第一个 token 被使用起算 5h，不用 token 则恒为空
// （历史曾产出 'NaN:NaN' 致页面脏显示+gate 定位失效），非 HH:MM 一律存 null，有消耗后下条采样自然带回
$resetAt = isset($d['resetTime']) ? trim(str_replace('重置时间：', '', $d['resetTime'])) : null;
if ($resetAt !== null && !preg_match('/^\d{1,2}:\d{2}$/', $resetAt)) {
    $resetAt = null;
}
$refreshedAt = isset($d['refreshedAt']) ? trim(str_replace('最近刷新时间：', '', $d['refreshedAt'])) : null;
db()->prepare('INSERT INTO coding_plan_quota_logs (usage_percent, has_voucher, voucher_count, voucher_expire_at, reset_at, page_refreshed_at, in_gift_window, account_key, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())')
    ->execute([
        min(100, max(0, (int) $d['pct'])),
        !empty($d['hasBtn']) ? 1 : 0,
        max(0, (int) ($d['voucherCount'] ?? 0)),
        !empty($d['voucherExpireAt']) ? $d['voucherExpireAt'] : null,
        $resetAt ?: null,
        $refreshedAt ?: null,
        inWindow() ? 1 : 0,
        $ak,
    ]);
// 新登录验证通过：任意一轮采样入库成功即摘验证旗标（gate 放行的验证采样在此收尾；旗标不存在时为无害空操作）
@unlink(__DIR__ . '/BM_VERIFY_COOKIE');
@unlink(__DIR__ . '/BM_VERIFY_ATTEMPT');

// cookie 到期侧车（Chrome Cookies 库被流水线锁住时，每日到期检查读这份）
if (!empty($d['cookieExpiresEpoch'])) {
    @file_put_contents($dir . '/bm-cookie-expiry.json', json_encode([
        'expires_at' => $d['cookieExpiresAt'] ?? null,
        'expires_epoch' => (float) $d['cookieExpiresEpoch'],
        'checked_at' => date('Y-m-d H:i:s'),
    ], JSON_UNESCAPED_UNICODE));
}

// 券库存快照侧车（2026-09-18 补 weekResets 读取缺口）：DB 只落 5h 券口径（cutoff/休眠/
// 用券决策依赖，周券救不了 5h 窗口不能混入），周额度券写这份机器本地 JSON 供「每日额度」
// 页头部展示全量库存；额度采样机专有文件，其他机器不存在时页面不显示该行
@file_put_contents($dir . '/bm-voucher-inventory.json', json_encode([
    'five_hour' => [
        'count' => (int) ($d['voucherCount'] ?? 0),
        'earliest_expire_at' => $d['voucherExpireAt'] ?? null,
        'earliest_expire_epoch' => isset($d['voucherExpireEpoch']) ? (float) $d['voucherExpireEpoch'] : null,
    ],
    'week' => [
        'count' => (int) ($d['weekVoucherCount'] ?? 0),
        'earliest_expire_at' => $d['weekVoucherExpireAt'] ?? null,
        'earliest_expire_epoch' => isset($d['weekVoucherExpireEpoch']) ? (float) $d['weekVoucherExpireEpoch'] : null,
    ],
    'checked_at' => date('Y-m-d H:i:s'),
], JSON_UNESCAPED_UNICODE));

// ===== 变量准备 =====
$pct = (int) $d['pct'];
$vouchers = (int) ($d['voucherCount'] ?? 0);
$remainReset = isset($d['resetEpoch']) ? floor(((float) $d['resetEpoch']) / 1000) - time() : null;
$voucherLeft = isset($d['voucherExpireEpoch']) && $d['voucherExpireEpoch'] ? floor(((float) $d['voucherExpireEpoch']) / 1000) - time() : null;

// ===== 熔断/恢复标记（2026-08-28 用户指定，阈值90%；bat 拿到退出码 4 → 拉起 ZCode 无头续跑会话）=====
// 熔断点：采样看到 >90% 且无券 → 记 BM_CUTOFF。恢复：后续采样 <90% 且标记存在 → 额度已回来
// （自然重置/官方统一重置/用券均可触发），处于活跃工作窗口 → exit 4 让 bat 拉起续跑
// （会话读 bm-resume-playbook.md 续接剩余时间）。★写入/恢复阈值必须对称：窗口内用量单调上升，
// 不对称会出现「标记刚写下、后续 80-89% 采样」被误判为恢复的情况。
$cutoffFile = __DIR__ . '/BM_CUTOFF';
if ($pct >= 90 && $vouchers === 0) {
    if (!file_exists($cutoffFile)) {
        file_put_contents($cutoffFile, (string) time());
        wlog("CUTOFF: 用量{$pct}%无券 → 记熔断点");
        // 首次熔断 → exit5：bat 立即 RDS push 抢救已落库战果（B 机账号2 管家不做会话续跑类动作）
        if (bm_poke_allowed()) { exit(5); }
    }
} elseif ($pct < 90 && file_exists($cutoffFile)) {
    if (inActiveWindow()) {
        // 续跑会话防重（2026-08-29）：异步拉起后（bm-resume-launch.bat）会话可能跑数小时，
        // 期间再次熔断→恢复不能再拉第二个（双会话双倍烧token）；标记由包装bat开头写/结尾删
        $runFile = __DIR__ . '/BM_RESUME_RUNNING';
        if (file_exists($runFile) && time() - (int) filemtime($runFile) < 6 * 3600) {
            @unlink($cutoffFile); // 额度恢复是事实，清熔断标记；续跑交给已在跑的会话
            wlog('RECOVERY: 额度已恢复(' . $pct . '%)但续跑会话已在跑,不重复拉起');
        } else {
            $resFile = __DIR__ . '/BM_LAST_RESUME';
            if (time() - (int) @file_get_contents($resFile) >= 1200) { // 20分钟冷却防反复拉起
                file_put_contents($resFile, (string) time());
                @unlink($cutoffFile);
                if (bm_poke_allowed()) {
                    wlog("RECOVERY: 额度已恢复({$pct}%) → exit4 拉起续跑会话");
                    exit(4);
                }
                wlog("RECOVERY: 额度已恢复({$pct}%)但本机不允许续跑（账号2 管家），熔断标记清除");
            } else {
                wlog('RECOVERY: 额度恢复但距上次续跑<20分钟,暂不重复拉起');
            }
        }
    } else {
        @unlink($cutoffFile); // 窗口已过，无需续跑
        wlog('RECOVERY: 额度恢复但当前无活跃窗口,熔断标记清除');
    }
}

/** 当前时刻是否处于某个工作窗口（分钟 0-1439；定时表调整时同步改这里和 bm-resume-playbook.md） */
function inActiveWindow(): bool
{
    $wd = (int) date('N'); // 1=周一 7=周日
    $m = (int) date('G') * 60 + (int) date('i');
    if ($wd <= 5) { // 工作日: 00-04:55(task4) 02:00-09:55(闲时+task1) 10:00-13:55(task5) 18:00-01:00(task2+闲时)
        return $m <= 295 || ($m >= 120 && $m <= 595) || ($m >= 600 && $m <= 835) || $m >= 1080;
    }
    // 周末: 00-01:00(闲时尾) 02:00-11:55(闲时+task1) 12:00-17:55(task5) 18:00-23:55(task2+闲时)
    return $m <= 60 || ($m >= 120 && $m <= 715) || ($m >= 720 && $m <= 1075) || $m >= 1080;
}

// ===== 额度耗尽休眠（2026-08-25 用户指定）：100% 且无券 → 睡到 max(自然重置, 下个00:00/18:00边界) =====
// 到唤醒点自动恢复采样；若恰逢 00:00/18:00 边界可能已发新券，恢复后第一轮即可走用券决策
$exFile = __DIR__ . '/BM_EXHAUSTED';
if ($pct >= 100 && $vouchers === 0) {
    if (!file_exists($exFile)) {
        // 标记存 JSON {reset,wake}：reset=自然重置点，gate 据此在重置点前放行一次采样（2026-08-29 用户指定）
        $resetTs = isset($d['resetEpoch']) ? floor(((float) $d['resetEpoch']) / 1000) : time() + 300;
        if ($resetTs <= time() + 60) {
            // 重置迟到：resetEpoch 已过期仍 100% —— 短轮询等重置真正落地，不跨边界长睡
            $wakeAt = time() + 240;
            file_put_contents($exFile, json_encode(['reset' => $resetTs, 'wake' => $wakeAt]));
            wlog('EXHAUSTED: 重置迟到（' . date('H:i', $resetTs) . '应重置仍100%）→ 4分钟后再查');
        } else {
            // 正常耗尽：醒在 min(自然重置, 下个统一边界) + 2分钟（2026-08-26 改 max→min）
            // 官方统一重置(00:00)或发券窗口(18:00)可能早于 5h 自然重置把额度刷满/发新券——
            // 提前醒一次试探：真刷满则立即恢复监控与用券决策；仍 100% 则本分支再睡回自然重置点，只多一次采样
            $b1 = strtotime('tomorrow 00:00');
            $b2 = (date('G') < 18) ? strtotime('today 18:00') : strtotime('tomorrow 18:00');
            $boundary = min($b1, $b2);
            $wakeAt = min($resetTs, $boundary) + 120;
            file_put_contents($exFile, json_encode(['reset' => $resetTs, 'wake' => $wakeAt]));
            wlog('EXHAUSTED: 100%无券 → 睡到 ' . date('m-d H:i', $wakeAt) . '（重置' . date('H:i', $resetTs) . '/边界' . date('m-d H:i', $boundary) . '取早试探）');
        }
    }
    exit(0);
}
if (file_exists($exFile)) {
    @unlink($exFile); // 有券或用量回落 → 清除休眠标记恢复正常监控
    wlog('休眠解除（有券或额度回落）');
}

// ===== 用券决策（bat 拿到退出码后执行 bm-voucher-use.mjs）=====
// ★3小时规则（2026-08-28 用户指定）：只有券剩余寿命≤3小时(10800s)才允许自动用——
//   官方会送有效期好几天的券，这类长命券一律不自动用，等它落到3小时内再按下面两条决策。
//   voucherLeft=最早到期那张的剩余寿命（check.mjs 按到期升序取 v0），天然表达「最短寿命券」。
// ① 激活线：用量≥95% 且有券(≤3h) 且距自然重置≥1小时 → 用（止损：自然重置在即不浪费券）
// ② 到期抢救：券剩余寿命≤360秒 → 无论用量直接用（3小时规则的临终兜底，不用就作废）
// ① 激活线：用量≥95% 且有券(≤3h) 且距自然重置≥1小时 → 用（2026-08-28 90→95：1分钟采样下91%用券浪费近一成存量；
//    实测高耗速率约1%/分钟，95%触发最坏冲到97-98%仍不会击穿100%）
if ($vouchers > 0 && $pct >= 95 && ($remainReset === null || $remainReset >= 3600) && $voucherLeft !== null && $voucherLeft <= 10800) {
    bm_activate_event('voucher', "激活线 pct={$pct}% 距重置" . ($remainReset === null ? '?' : (int) ($remainReset / 60) . 'm') . " 券{$vouchers}张 剩" . (int) ($voucherLeft / 60) . "m");
    wlog("USE-DECISION: 激活线 pct={$pct}% 距重置" . ($remainReset === null ? '?' : (int) ($remainReset / 60) . 'm') . " 券{$vouchers}张 剩" . (int) ($voucherLeft / 60) . "m(≤3h解锁)");
    exit(2);
}
if ($vouchers > 0 && $voucherLeft !== null && $voucherLeft <= 360) {
    bm_activate_event('voucher', "到期抢救 剩{$voucherLeft}s pct={$pct}%");
    wlog("USE-DECISION: 券到期抢救 剩{$voucherLeft}s pct={$pct}%");
    exit(2);
}

// ===== 计时激活 poke（2026-08-28 用户指定，bat 拿到退出码 3 后跑 ZCode 无头单发）=====
// bigmodel 规则：下个重置时间=窗口内第一次 token 消耗+5h；空闲窗口重置后 reset_at 恒为空，
// gate 死区刷新点定位断链。新窗口零消耗首采（pct=0 且 reset_at 空）→ bat 调 zcode.cjs -p "ok"
// 真实 ZCode 客户端烧少量 plan token 激活（★必须走 ZCode 客户端，直连 API 不计入 plan）。
// ★边界激活直通（2026-08-29 用户指定）：重置点刚过(≤30分钟)必须立即激活新5h窗口——
//   已知重置点（最近采样 reset_at 落在过去30分钟内，跨午夜按-24h修正）绕过12h兜底限频，
//   仅保留10分钟冷却（poke失败未注册时下轮采样可重试，30分钟窗口封顶）。12h限频防的是
//   长期闲置反复poke；边界激活是刚需（不激活 gate 拿不到新刷新点、链路断）。
if ($pct === 0 && $resetAt === null) {
    if (!bm_poke_allowed()) {
        // B 机（账号2 管家）：poke 只有 ZCode 登录账号2 的 D 机能做，本机只记录不激活
        wlog('POKE-SKIP: 本机配置不允许 poke（账号2 激活归 D 机），仅记录零消耗状态');
    } else {
    $pokeFile = __DIR__ . '/BM_POKED';
    $lastPoke = (int) @file_get_contents($pokeFile);
    $justReset = false;
    $rows = db()->query("SELECT reset_at, usage_percent FROM coding_plan_quota_logs WHERE account_key = " . db()->quote($ak) . " ORDER BY id DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as $i => $row) {
        // 信号2（2026-08-29 用券案例补）：上一条≥50%本条归零=刚被重置——用券是提前重置，旧 reset_at
        // 还挂在未来，信号1摸不到；自然重置（100%→0）也被此路覆盖。第0条=刚插入的当前样本
        if ($i === 1 && (int) $row['usage_percent'] >= 50) {
            $justReset = true;
        }
        $ra = trim((string) $row['reset_at']);
        if (preg_match('/^(\d{1,2}):(\d{2})$/', $ra, $m)) {
            $ts = mktime((int) $m[1], (int) $m[2], 0);
            if ($ts - time() > 20 * 3600) { $ts -= 86400; } // 跨午夜：算出来在20h后的点其实是昨晚的
            $age = time() - $ts;
            if ($age >= 0 && $age <= 1800) { $justReset = true; }
            break; // 最新一条有效 reset_at 定位（当前样本 reset_at=null 被跳过，取到的是刚过期的那个点）
        }
    }
    if (time() - $lastPoke > 43200 || ($justReset && time() - $lastPoke > 600)) {
        file_put_contents($pokeFile, (string) time());
        bm_activate_event('poke', $justReset ? '重置点刚过→边界直通激活新5h窗口' : '新窗口零消耗→微请求激活计时');
        wlog($justReset
            ? 'POKE-DECISION: 重置点刚过零消耗 → 边界直通激活新5h窗口'
            : 'POKE-DECISION: 新窗口零消耗 reset_at 为空 → 微请求激活计时');
        exit(3);
    }
    }
}
