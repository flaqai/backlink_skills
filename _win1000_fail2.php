<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=seoadmin;charset=utf8mb4','root','root');
// failed 按站点聚合 top15
foreach($pdo->query("SELECT b.domain, COUNT(*) c, MAX(l.created_at) last_at FROM backlink_publish_logs l LEFT JOIN backlinks b ON b.id=l.backlink_id WHERE l.status='failed' GROUP BY b.domain ORDER BY c DESC LIMIT 15") as $r){
  echo str_pad((string)$r['domain'],40), " x", $r['c'], "\tlast=", $r['last_at'], "\n";
}
echo "--- 近5条failed明细 ---\n";
foreach($pdo->query("SELECT l.id, b.domain, l.note, l.created_at FROM backlink_publish_logs l LEFT JOIN backlinks b ON b.id=l.backlink_id WHERE l.status='failed' ORDER BY l.id DESC LIMIT 5") as $r){
  echo $r['id'], "\t", $r['domain'], "\t", mb_substr((string)$r['note'],0,110), "\t", $r['created_at'], "\n";
}
