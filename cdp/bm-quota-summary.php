<?php
/** 宝塔计划任务日志可视化（2026-08-29 用户指定）：每轮 bat 收尾固定打印一行「时间 额度 券数」
 *  输出示例：2026-08-29 10:51:32 89% 1 —— 时间=最新采样时刻，额度=5小时窗口用量%，券数=可用重置券
 */
require __DIR__ . '/bm-quota-lib.php';
$row = db()->query('SELECT usage_percent, voucher_count, created_at FROM coding_plan_quota_logs WHERE account_key = ' . db()->quote(bm_account_key()) . ' ORDER BY id DESC LIMIT 1')->fetch(PDO::FETCH_ASSOC);
if (!$row) {
    echo date('Y-m-d H:i:s'), " no-data\n";
    exit(0);
}
echo $row['created_at'], ' ', $row['usage_percent'], '% ', (int) $row['voucher_count'], "\n";
