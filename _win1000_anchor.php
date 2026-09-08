<?php
// 近24h发文锚链线上批量核查：抓 published_url 页面，查 <a href> 是否含 target_url 域
$pdo = new PDO('mysql:host=127.0.0.1;dbname=seoadmin;charset=utf8mb4','root','root');
$rows = $pdo->query("SELECT id, blog_account_id, keyword_group_id, theme, target_url, published_url, published_at FROM blog_writer_posts WHERE published_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) AND published_url IS NOT NULL AND published_url != '' ORDER BY id")->fetchAll(PDO::FETCH_ASSOC);
function fetch($url){
  $ch = curl_init($url);
  curl_setopt_array($ch,[
    CURLOPT_RETURNTRANSFER=>true, CURLOPT_FOLLOWLOCATION=>true, CURLOPT_TIMEOUT=>25,
    CURLOPT_CONNECTTIMEOUT=>12,
    CURLOPT_USERAGENT=>'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    CURLOPT_ENCODING=>'', CURLOPT_SSL_VERIFYPEER=>false,
  ]);
  $html = curl_exec($ch);
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $final = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
  curl_close($ch);
  return [$code, (string)$html, $final];
}
foreach($rows as $r){
  $tHost = strtolower(parse_url($r['target_url'], PHP_URL_HOST) ?: '');
  $tHost = preg_replace('/^www\./','',$tHost);
  [$code,$html,$final] = fetch($r['published_url']);
  if($code!=200 || $html===''){ echo $r['id'], "\tHTTP $code\tBAD_FETCH\t", $r['published_url'], "\n"; continue; }
  // 找所有 <a href>
  preg_match_all('/<a\b[^>]*href\s*=\s*["\']([^"\']*)["\'][^>]*>(.*?)<\/a>/is', $html, $m, PREG_SET_ORDER);
  $found = [];
  foreach($m as $a){
    $href = html_entity_decode($a[1]);
    if(stripos($href, $tHost) !== false){
      $anchor = trim(preg_replace('/\s+/u',' ', strip_tags($a[2])));
      $rel = (stripos($a[0],'nofollow')!==false)?'nofollow':'dofollow';
      $found[] = $anchor.' | '.$href.' | '.$rel;
    }
  }
  // 裸文本 URL 也算弱链
  $bare = (stripos($html, $tHost) !== false);
  $n = count($found);
  if($n>0){
    echo $r['id'], "\tOK($n)\t", implode(' ;; ', array_slice($found,0,3)), "\t", $r['published_url'], "\n";
  } elseif($bare){
    echo $r['id'], "\tWEAK\tURL出现在正文但无<a>锚链\t", $r['published_url'], "\n";
  } else {
    echo $r['id'], "\tMISS\t页面无该域锚链也无裸URL(客户端渲染?)\t", $r['published_url'], "\n";
  }
}
