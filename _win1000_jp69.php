<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=seoadmin;charset=utf8mb4','root','root');
foreach($pdo->query("SELECT id,platform,username,email,machine,status,is_active,remark,cookies FROM blog_accounts WHERE platform='journoportfolio'") as $r){
  echo "ACC{$r['id']}\t{$r['username']}\t{$r['email']}\tm={$r['machine']}\tst={$r['status']}\ta={$r['is_active']}\n";
  echo "REMARK=", mb_substr((string)$r['remark'],0,400), "\n";
  echo "COOKIES=", mb_substr((string)$r['cookies'],0,200), "\n";
}
