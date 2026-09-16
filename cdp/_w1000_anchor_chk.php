<?php
// win1000 0916: 24h published posts anchor check (curl-level, promo posts check anchor href)
$envFile = file_get_contents('D:/Github/seoadminC/.env');
$env = [];
foreach (['DB_HOST','DB_PORT','DB_DATABASE','DB_USERNAME','DB_PASSWORD'] as $k) {
    if (preg_match('/^' . $k . '=(.*)$/m', $envFile, $m)) $env[$k] = trim($m[1]);
}
$pdo = new PDO("mysql:host={$env['DB_HOST']};port={$env['DB_PORT']};dbname={$env['DB_DATABASE']}", $env['DB_USERNAME'], $env['DB_PASSWORD'], [PDO::ATTR_TIMEOUT => 5]);
$rows = $pdo->query("SELECT id,target_url,published_url FROM blog_writer_posts WHERE status='published' AND published_at>='2026-09-15 10:00:00' ORDER BY published_at")->fetchAll(PDO::FETCH_ASSOC);
$posts = array_map(fn($r) => ['id' => $r['id'], 'target_url' => $r['target_url'], 'published_url' => $r['published_url']], $rows);
if (!$posts) { fwrite(STDERR, "QUERY EMPTY\n"); exit(1); }
$taskHosts = ['smogcheck-nearme.com','generatorforhouse.org','zakaihu.com','spravs.com','aiimageeditorfree.com','aivideogeneratorfree.org','aitoolsdirectory.vip','qrcodegenerator.vip'];
$mh = curl_multi_init();
$ch = [];
$idx = 0;
foreach ($posts as $p) {
    if (empty($p['published_url'])) { echo $p['id']."|NOURL|".$p['target_url']."\n"; continue; }
    $c = curl_init();
    curl_setopt_array($c, [
        CURLOPT_URL => $p['published_url'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 4,
        CURLOPT_TIMEOUT => 18,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_ENCODING => '',
    ]);
    curl_multi_add_handle($mh, $c);
    $ch[$idx] = ['c' => $c, 'post' => $p];
    $idx++;
}
// run in batches of 10 to bound memory
$running = null;
do {
    curl_multi_exec($mh, $running);
    if ($running) curl_multi_select($mh, 0.5);
} while ($running > 0);
$pass = 0; $chk = 0; $dead = 0; $warm = 0;
foreach ($ch as $i => $entry) {
    $body = curl_multi_getcontent($entry['c']);
    $code = curl_getinfo($entry['c'], CURLINFO_RESPONSE_CODE);
    $err = curl_error($entry['c']);
    $p = $entry['post'];
    $tHost = parse_url($p['target_url'], PHP_URL_HOST) ?: '';
    $isPromo = in_array($tHost, $taskHosts);
    if ($code != 200 || $body === false || $body === '') {
        echo $p['id']."|DEAD|http=$code err=".substr($err,0,40)."|".$p['published_url']."|".$p['target_url']."\n";
        $dead++; curl_multi_remove_handle($mh, $entry['c']); curl_close($entry['c']); continue;
    }
    if (!$isPromo) {
        echo $p['id']."|WARM200|".$p['published_url']."\n";
        $warm++; curl_multi_remove_handle($mh, $entry['c']); curl_close($entry['c']); continue;
    }
    // promo: look for href containing target host
    $found = false;
    if (preg_match_all('/<a[^>]+href=["\']([^"\']*)["\']/i', $body, $m)) {
        foreach ($m[1] as $href) {
            $h = html_entity_decode($href);
            if (stripos($h, $tHost) !== false) { $found = true; break; }
        }
    }
    if ($found) { echo $p['id']."|ANCHOR_OK|".$p['published_url']."|".$tHost."\n"; $pass++; }
    else { echo $p['id']."|CHK_NOANCHOR|".$p['published_url']."|".$tHost."\n"; $chk++; }
    curl_multi_remove_handle($mh, $entry['c']); curl_close($entry['c']);
}
curl_multi_close($mh);
echo "== SUMMARY promo_pass=$pass chk_noanchor=$chk dead=$dead warming200=$warm total=" . count($posts) . " ==\n";
