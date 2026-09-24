<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=seoadmin;charset=utf8mb4','root','root');
$cols = $pdo->query("SHOW COLUMNS FROM blog_accounts")->fetchAll(PDO::FETCH_COLUMN);
echo "COLS=", implode(',', $cols), "\n";
foreach($pdo->query("SELECT * FROM blog_accounts WHERE platform LIKE '%neko%' OR id=210") as $r){
  foreach($r as $k=>$v){ if($v!==null && $v!=='') echo "  $k=", mb_substr((string)$v,0,200), "\n"; }
  echo "---\n";
}
echo "=== 996 ===\n";
foreach($pdo->query("SELECT * FROM blog_writer_posts WHERE id=996") as $r){
  foreach($r as $k=>$v){ if($v!==null && $v!=='') echo "$k=", mb_substr((string)$v,0,300), "\n"; }
}
