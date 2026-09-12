<?php
/** 第1步（bat调用）：节流门。退出码 1=放行采样 0=跳过
 *  额度耗尽休眠：BM_EXHAUSTED 存在且未到重置时刻 → 直接跳过；到点自动清除恢复监控
 *  工作日 10:00-17:50 死区，但额度刷新点前后各放行一次（2026-08-26 用户指定）：
 *  刷新点 R（最后一条记录的 reset_at "HH:MM"，写库时即「下一个刷新点」，链式自续）
 *  前 = R-600s ≤ now < R 且上一条早于 R-600s（刷新前紧邻一条）
 *  后 = R ≤ now < R+600s 且上一条早于 R（刷新后第一条）
 *  两边各恰好一条，状态由上一条相对 R 的位置决定，天然限频不走常规节流。
 *  窗外/死区外常规节流：赠送窗口内且用量>50% 最小240秒（5分钟档）；其余最小540秒（10分钟档）。
 *  阈值必须留足 60 秒相位余量：宝塔按 wall-clock 每5分钟触发，写库时刻（采样完成后 NOW()）
 *  落在触发网格的相位是 0~60s 任意值 → 下个5分钟点 age 最少 300-60=240s、下个10分钟点最少 540s。
 *  取整值（300/600）或余量不足（570）都会在相位最坏时卡线跳过，退化成下一档（10/15分钟一档）。
 *  BM_SAMPLING 防重：放行时创建、record 收尾删除；150s 内视为上一轮仍在采样（多触发源并发双写防护）
 */
require __DIR__ . '/bm-quota-lib.php';

$smpFile = __DIR__ . '/BM_SAMPLING';

// 静默窗（2026-09-13 用户指定）：2026-09-20 前每天 00:00-09:00 全系统暂停，优先级高于一切——
// 防重放行/新cookie验证/耗尽唤醒/重置点前采样/临期券抢救全都会产生采样或激活，静默窗内一律不放行
// （work bat 首步已有同款门，此处兜底防绕过 bat 直跑管线）
if (inQuietWindow()) { wlog('skip: 静默窗 00:00-09:00（2026-09-20 前）额度系统暂停'); exit(0); }

// 采样进行中防重（上轮放行后 150s 内的并发触发直接跳过，超时视为残留自动失效；
// 必须排在耗尽休眠之前——前置采样放行路径 exit 1 直接返回，放后面挡不住连跑重放）
if (file_exists($smpFile)) {
    $smpAt = (float) @file_get_contents($smpFile);
    if ($smpAt > time() - 150) { wlog('skip: 采样进行中(防重)'); exit(0); }
    @unlink($smpFile);
}

// 新cookie验证放行（2026-09-01 用户指定）：inject 成功挂 BM_VERIFY_COOKIE 旗标 → 无条件放行一次采样，
// 当场验证新 cookie 可用 + 接回刷新点链，优先级高于耗尽休眠/死区/节流（08-31 NO_TOKEN 断链后注入成功
// 却被死区卡到晚上的死锁即此症的根治）。旗标由 record.php 入库成功后摘除；采样失败旗标保留，
// 300s 冷却一轮重试、30 分钟未成功自动过期（防坏 cookie 无限空采）。
$vFile = __DIR__ . '/BM_VERIFY_COOKIE';
if (file_exists($vFile)) {
    $vBorn = (float) @file_get_contents($vFile);
    if ($vBorn <= 0 || time() - $vBorn >= 1800) {
        @unlink($vFile);
        @unlink(__DIR__ . '/BM_VERIFY_ATTEMPT');
        wlog('注入验证: 旗标超时(30分钟)未成功，过期清除');
    } else {
        $aFile = __DIR__ . '/BM_VERIFY_ATTEMPT';
        $aAt = (float) @file_get_contents($aFile);
        if ($aAt > 0 && time() - $aAt < 300) { wlog('skip: 注入验证冷却(距上轮' . (time() - $aAt) . 's<300s)'); exit(0); }
        file_put_contents($aFile, (string) time());
        wlog('注入验证: 新cookie旗标 → 放行一次采样');
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
            $last = db()->query('SELECT created_at FROM coding_plan_quota_logs ORDER BY id DESC LIMIT 1')->fetch(PDO::FETCH_ASSOC);
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
// 抢救窗（临终6分钟无论用量直接用）内必有采样落点——常态下 360s 窗短于最坏采样间隔
// （240s节流+相位→实际300-540s），本就可能整窗零落点；09-02 事故（券03:13:34作废）则是
// 抢救窗整窗落在宝塔调度70分钟断档里。只加密监控密度，不改变用券时机。
// 下限-300s：券过期后短窗内仍放行（DB 状态已脏，放行一条采样刷新券库存；Chrome down 时
// 空采不落库无副作用，恢复后首条自然修正）。
$lastV = db()->query('SELECT voucher_expire_at FROM coding_plan_quota_logs ORDER BY id DESC LIMIT 1')->fetch(PDO::FETCH_ASSOC);
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

// 死区：工作日 10:00-17:50，仅额度刷新点前后监控（2026-08-28 适配1分钟cron）
$wd = (int) date('N'); // 1=周一 7=周日
$minutes = ((int) date('G')) * 60 + (int) date('i');
if ($wd <= 5 && $minutes >= 600 && $minutes < 1070) {
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
    $rows = db()->query('SELECT created_at, reset_at FROM coding_plan_quota_logs ORDER BY id DESC LIMIT 5')->fetchAll(PDO::FETCH_ASSOC);
    $L = $rows ? strtotime($rows[0]['created_at']) : 0; // 全局最新一条采样时刻
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
        if ($R - 180 <= $T && $T < $R && $L < $R - 180) {
            $go = true; $why = "刷新前(R=" . date('H:i', $R) . ")"; // 重置前3分钟窗口第一条（1分钟cron下首拍落在R-3m±1m，即「R前最近监控点」）
        } elseif ($R <= $T && $T < $R + 900 && $L < $R) {
            $go = true; $why = "刷新后(R=" . date('H:i', $R) . "首拍)"; // 重置后15分钟窗口第一条
        } elseif ($R <= $T && $T < $R + 900 && $T - $L >= 60
                && preg_match('/^\d{1,2}:\d{2}$/', $lastReset) && strtotime($lastReset) <= $T) {
            // 重置未落地重拍：首拍若早于官方实际落地（常见1-3分钟延迟），拍到的 reset_at 已成过去时，
            // 若就此沉默整段死区无人携带新刷新点→断链。1分钟粒度下逐分钟重拍，
            // 直到拍到新窗口（reset_at变为R+5h>pct任意）或零消耗（null→走poke），窗口15分钟封顶。
            $go = true; $why = '刷新后重置未落地重拍(last=' . $lastReset . ')';
        }
    }
    if (!$go) {
        // 补采（2026-08-26 用户指定）：bigmodel 规则=下个重置时间从刷新后第一个 token 被使用起算 5h，
        // 不用 token 则恒为空。采到空 reset_at 后 3-15 分钟内重采一次（期间若有消耗即带回新重置点；
        // 一直闲置则补也没用，15 分钟上限防白补）；poke/补采带回后本分支自然不再触发。
        if ($rows && $rows[0]['reset_at'] === null) {
            $age = $T - $L;
            if ($age >= 180 && $age <= 900) {
                wlog('补采: 刷新后 reset_at 为空 age=' . $age . 's → 放行重采拿新窗口重置点');
                file_put_contents($smpFile, (string) time());
                exit(1);
            }
        }
        wlog('skip: 工作日白天死区(刷新点' . ($R !== null ? date('H:i', $R) : '?') . '外)');
        exit(0);
    }
    wlog('边缘采样: ' . $why);
    file_put_contents($smpFile, (string) time());
    exit(1); // 刷新点边缘 → 放行（不走常规节流）
}

$inWin = inWindow();
$last = db()->query('SELECT usage_percent, created_at FROM coding_plan_quota_logs ORDER BY id DESC LIMIT 1')->fetch(PDO::FETCH_ASSOC);
if ($last) {
    $age = time() - strtotime($last['created_at']);
    $minGap = ($inWin && (int) $last['usage_percent'] > 50) ? 240 : 540;
    if ($age < $minGap) { wlog('skip: 节流 last=' . $last['usage_percent'] . "% {$age}s<{$minGap}s" . ($inWin ? '' : ' (窗外10分钟制)')); exit(0); }
}
file_put_contents($smpFile, (string) time());
exit(1); // 放行
