<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=seoadmin;charset=utf8mb4','root','root');
// 回填 997 / 998
$pdo->exec("UPDATE blog_writer_posts SET published_url='https://write.as/leoxm/how-to-size-a-home-generator-without-overspending' WHERE id=997 AND (published_url IS NULL OR published_url='')");
$pdo->exec("UPDATE blog_writer_posts SET published_url='https://leoxm.journoportfolio.com/articles/smog-check-preparation-a-first-timers-checklist/' WHERE id=998 AND (published_url IS NULL OR published_url='')");
foreach($pdo->query("SELECT id,published_url FROM blog_writer_posts WHERE id IN (996,997,998)") as $r){ echo $r['id'], "\t", $r['published_url'], "\n"; }
