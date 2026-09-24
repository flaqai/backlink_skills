<?php
/** 第1步（bat调用）：节流门。退出码 1=放行采样 0=跳过
 *  额度耗尽休眠：BM_EXHAUSTED 存在且未到重置时刻 → 直接跳过；到点自动清除恢复监控
 *  ★作息（2026-09-21 用户定稿）：工作日 09:00-18:00 白天死区，只在额度刷新点前后各采一条——
 *  刷新点 R（最后一条记录的 reset_at "HH:MM"，写库时即「下一个刷新点」，链式自续）
 *  前 = R-600s ≤ now < R 且上一条早于 R-600s（重置前~10分钟一条）
 *  后 = R+240s ≤ now < R+360s 且上一条早于 R+240s（重置后~5分钟一条）
 *  两边各恰好一条，状态由上一条相对 R 的位置决定，天然限频不走常规节流；
 *  「重置未落地重拍」兜底到 R+900s（重置常迟到1-3分钟，不补拍断链）。
 *  死区外（工作日 18:00-09:00 + 周末全天）常规监控照常，节流最小240秒（5分钟一条，盯券/临期券抢救）。
 *  阈值必须留足 60 秒相位余量：触发按 wall-clock 每5分钟，写库时刻（采样完成后 NOW()）
 *  落在触发网格的相位是 0~60s 任意值 → 下个5分钟点 age 最少 300-60=240s。
 *  取整值（300/600）或余量不足（570）都会在相位最坏时卡线跳过，退化成下一档（10/15分钟一档）。
 *  BM_SAMPLING 防重：放行时创建、record 收尾删除；150s 内视为上一轮仍在采样（多触发源并发双写防护）
 *  ★账号过滤（2026-09-21）：本表走 RDS 高频同步，B 机 d-独立 池的行会同步进来——
 *  刷新点定位/节流/临期券判读一律只认本机 account_key（bm-account.json，缺省 shared）的行。
 */
require __DIR__ . '/bm-quota-lib.php';

$smpFile = __DIR__ . '/BM_SAMPLING';
$ak = bm_account_key();

// 手动总暂停（2026-09-20 用户指定）：bm-pause.flag 存在 → 全链停，优先级高于一切——
// 防重放行/耗尽唤醒/重置点前采样/临期券抢救全都会产生采样，暂停中一律不放行
// （work bat 首步已有同款门，此处兜底防绕过 bat 直跑管线；旧 00:00-09:00 静默窗已删 2026-09-21）
if (inQuietWindow()) { wlog('skip: 手动总暂停（bm-pause.flag 存在）额度系统暂停'); exit(0); }

// 采样进行中防重（上轮放行后 150s 内的并发触发直接跳过，超时视为残留自动失效；
// 必须排在耗尽休眠之前——前置采样放行路径 exit 1 直接返回，放后面挡不住连跑重放）
if (file_exists($smpFile)) {
    $smpAt = (float) @file_get_contents($smpFile);
    if ($smpAt > time() - 150) { wlog('skip: 采样进行中(防重)'); exit(0); }
    @unlink($smpFile);
}

// 新登录验证放行（2026-09-21 cookie 自持改造续用）：专属 Chrome 里换号/重登后挂 BM_VERIFY_COOKIE
// 旗标 → 无条件放行一次采样，当场验证登录态可用 + 接回刷新点链，优先级高于耗尽休眠/死区/节流。
// 旗标由 record.php 入库成功后摘除；采样失败旗标保留，300s 冷却一轮重试、30 分钟未成功自动过期。
$vFile = __DIR__ . '/BM_VERIFY_COOKIE';
if (file_exists($vFile)) {
    $vBorn = (float) @file_get_contents($vFile);
    if ($vBorn <= 0 || time() - $vBorn >= 1800) {
        @unlink($vFile);
        @unlink(__DIR__ . '/BM_VERIFY_ATTEMPT');
        wlog('登录验证: 旗标超时(30分钟)未成功，过期清除');
    } else {
        $aFile = __DIR__ . '/BM_VERIFY_ATTEMPT';
        $aAt = (float) @file_get_contents($aFile);
        if ($aAt > 0 && time() - $aAt < 300) { wlog('skip: 登录验证冷却(距上轮' . (time() - $aAt) . 's<300s)'); exit(0); }
        file_put_contents($aFile, (string) time());
        wlog('登录验证: 新登录旗标 → 放行一次采样');
        file_put_contents($smpFile, (string) time());
        exit(1);
    }
}

// 耗尽休眠检查（优先于一切）
$exFile = __DIR__ . '/BM_EXHAUSTED';
if (file_exists($exFile)) {
    // 标记为 JSON {reset,wake}（2026-08-29 起 record 写入）；纯数字旧格式按 wake 兼容
    $j = json_decode((string) @file_get_contents($exFile), true);
    $wakeEpoch = is_array($j) ? (float) ($j['wake'] ?? 0) : (float) @file_get_contents($exFile);
    $resetEpoch = is_array($j) && !empty($j['reset']) ? (float) $j['reset'] : null;
    $now = microtime(true);
    if ($wakeEpoch > $now) {
        // ★重置点前采样（2026-08-29 用户指定）：耗尽休眠不吞刷新点前监控——自然重置前3分钟
        // 窗口恰好放行一条（DB判重：窗口内已有采样则不放行），赶早落地/临期发券都能抓到；
        // 仍是100%无券时 record 原样保留休眠标记继续睡到 wake 点，不破坏原休眠节奏
        if ($resetEpoch !== null && $now >= $resetEpoch - 180 && $now < $resetEpoch) {
            $last = db()->query("SELECT created_at FROM coding_plan_quota_logs WHERE account_key = " . db()->quote($ak) . " ORDER BY id DESC LIMIT 1")->fetch(PDO::FETCH_ASSOC);
            if (!$last || strtotime($last['created_at']) < $resetEpoch - 180) {
                wlog('重置前采样: 耗尽休眠中放行一条（重置点 ' . date('H:i', $resetEpoch) . ' 前）');
                file_put_contents($smpFile, (string) time());
                exit(1);
            }
        }
        wlog('skip: 额度耗尽休眠中，距唤醒' . (int) (($wakeEpoch - $now) / 60) . 'm');
        exit(0);
    }
    @unlink($exFile);
    wlog('耗尽休眠到期，标记清除，恢复监控');
}

// 临期券加密监控（2026-09-02 用户指定）：最后一条采样的最早到期券剩余寿命≤1500s →
// 绕过节流/死区放行，密度由 BM_SAMPLING 防重(150s)兜底。目的：保证 record 的 360s 到期
// 抢救窗（临终6分钟无论用量直接用）内必有采样落点——常态下 360s 窗短于最坏采样间隔，
// 本就可能整窗零落点；09-02 事故（券03:13:34作废）则是抢救窗整窗落在调度断档里。
// 只加密监控密度，不改变用券时机。
// 下限-300s：券过期后短窗内仍放行（DB 状态已脏，放行一条采样刷新券库存；Chrome down 时
// 空采不落库无副作用，恢复后首条自然修正）。
$lastV = db()->query("SELECT voucher_expire_at FROM coding_plan_quota_logs WHERE account_key = " . db()->quote($ak) . " ORDER BY id DESC LIMIT 1")->fetch(PDO::FETCH_ASSOC);
if ($lastV && !empty($lastV['voucher_expire_at'])) {
    $vTs = strtotime($lastV['voucher_expire_at']);
    if ($vTs !== false) {
        $vLeft = $vTs - time();
        if ($vLeft <= 1500 && $vLeft >= -300) {
            wlog('临期券加密: 最早到期券剩' . $vLeft . 's → 放行采样（保 record 360s 抢救窗有落点）');
            file_put_contents($smpFile, (string) time());
            exit(1);
        }
    }
}

// ★白天死区（2026-09-21 用户定稿作息）：工作日 09:00-18:00，只在额度刷新点前后各一条
$wd = (int) date('N'); // 1=周一 7=周日
$minutes = ((int) date('G')) * 60 + (int) date('i');
if ($wd <= 5 && $minutes >= 540 && $minutes < 1080) {
    // 熔断恢复探测（2026-08-28）：有熔断标记时每30分钟放行一次采样，让 record 尽早发现额度恢复
    // 拉起续跑会话；否则死区内只能靠刷新点边缘采样，发现恢复最慢要等约2小时
    if (file_exists(__DIR__ . '/BM_CUTOFF')) {
        $probeFile = __DIR__ . '/BM_CUTOFF_PROBE';
        if (time() - (float) @file_get_contents($probeFile) >= 1800) {
            file_put_contents($probeFile, (string) microtime(true));
            wlog('熔断恢复探测: 放行采样检查额度');
            file_put_contents($smpFile, (string) time());
            exit(1);
        }
    }
    $T = time();
    $rows = db()->query("SELECT created_at, reset_at FROM coding_plan_quota_logs WHERE account_key = " . db()->quote($ak) . " ORDER BY id DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
    $L = $rows ? strtotime($rows[0]['created_at']) : 0; // 本账号最新一条采样时刻
    $lastReset = $rows ? trim((string) $rows[0]['reset_at']) : '';
    // 刷新点定位：最新一条 reset_at 可能是 null（零消耗窗口）→ 回溯最近几条找有效且未过期的
    $R = null;
    foreach ($rows as $row) {
        if (!empty($row['reset_at']) && preg_match('/^(\d{1,2}):(\d{2})$/', trim($row['reset_at']), $m)) {
            $r = mktime((int) $m[1], (int) $m[2], 0);
            // 已过期超1小时说明定位陈旧（旧窗口的），放弃继续找（更早的只会更旧）
            if ($T < $r + 3600) { $R = $r; }
            break;
        }
    }
    $go = false; $why = '';
    if ($R !== null) {
        if ($R - 600 <= $T && $T < $R && $L < $R - 600) {
            $go = true; $why = "刷新前(R=" . date('H:i', $R) . ")"; // 重置前~10分钟窗口第一条（1分钟cron下首拍落在R-10m±1m）
        } elseif ($R + 240 <= $T && $T < $R + 360 && $L < $R + 240) {
            $go = true; $why = "刷新后(R=" . date('H:i', $R) . "~5分钟)"; // 重置后4-6分钟窗口第一条（等重置落地）
        } elseif ($R <= $T && $T < $R + 900 && $T - $L >= 60
                && preg_match('/^\d{1,2}:\d{2}$/', $lastReset) && strtotime($lastReset) <= $T) {
            // 重置未落地重拍：R+5min 首拍若早于官方实际落地（常见1-3分钟延迟），拍到的 reset_at
            // 已成过去时，若就此沉默整段死区无人携带新刷新点→断链。1分钟粒度下逐分钟重拍，
            // 直到拍到新窗口（reset_at变为R+5h>pct任意）或零消耗（null→走poke），窗口15分钟封顶。
            $go = true; $why = '刷新后重置未落地重拍(last=' . $lastReset . ')';
        }
    }
    if (!$go) {
        wlog('skip: 工作日白天死区(刷新点' . ($R !== null ? date('H:i', $R) : '?') . '外)');
        exit(0);
    }
    wlog('边缘采样: ' . $why);
    file_put_contents($smpFile, (string) time());
    exit(1); // 刷新点边缘 → 放行（不走常规节流）
}

// 常规窗口（工作日 18:00-09:00 + 周末全天）：5分钟一条（2026-09-21 用户定稿；
// 原两档 240/540 制取消——常规监控全程 240s 盯券/临期券抢救）
$last = db()->query("SELECT usage_percent, created_at FROM coding_plan_quota_logs WHERE account_key = " . db()->quote($ak) . " ORDER BY id DESC LIMIT 1")->fetch(PDO::FETCH_ASSOC);
if ($last) {
    $age = time() - strtotime($last['created_at']);
    $minGap = 240;
    if ($age < $minGap) { wlog('skip: 节流 last=' . $last['usage_percent'] . "% {$age}s<{$minGap}s"); exit(0); }
}
file_put_contents($smpFile, (string) time());
exit(1); // 放行
