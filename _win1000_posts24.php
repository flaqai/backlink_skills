<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=seoadmin;charset=utf8mb4','root','root');
$rows = $pdo->query("SELECT p.id, p.blog_account_id, p.keyword_group_id, p.theme, p.title, p.target_url, p.published_url, p.published_at, p.status, a.platform, a.machine FROM blog_writer_posts p LEFT JOIN blog_accounts a ON a.id=p.blog_account_id WHERE p.published_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) ORDER BY p.published_at DESC")->fetchAll(PDO::FETCH_ASSOC);
echo "COUNT=".count($rows)."\n";
foreach($rows as $r){
  echo implode("\t",[$r['id'],$r['machine'],$r['platform'],$r['blog_account_id'],$r['keyword_group_id'],$r['theme'],$r['target_url'],$r['published_url'],$r['published_at'],$r['status']]),"\n";
}
