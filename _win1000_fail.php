<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=seoadmin;charset=utf8mb4','root','root');
$n = $pdo->query("SELECT COUNT(*) FROM backlink_publish_logs WHERE status='fail'")->fetchColumn();
echo "FAIL_TOTAL=$n\n";
// 近期fail分布
foreach($pdo->query("SELECT status, COUNT(*) c FROM backlink_publish_logs WHERE status NOT IN ('completed') GROUP BY status") as $r){
  echo $r['status'], "=", $r['c'], "\n";
}
// 最近的fail样本10条
echo "--- recent fail 10 ---\n";
foreach($pdo->query("SELECT id, backlink_id, backlink_publish_task_id, note, created_at FROM backlink_publish_logs WHERE status='fail' ORDER BY id DESC LIMIT 10") as $r){
  echo $r['id'], "\t", $r['backlink_id'], "\ttask=", $r['backlink_publish_task_id'], "\t", mb_substr((string)$r['note'],0,90), "\t", $r['created_at'], "\n";
}
