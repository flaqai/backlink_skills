<?php

// 直连优先、失败代理兜底（出口IP总政策 2026-09-16 curl-df口径）
function _df_px() { $f = @fsockopen('127.0.0.1', 5780, $e, $c, 2); if ($f) { fclose($f); return 'http://127.0.0.1:5780'; } return ''; }

// win1200: writefreely两站(dranik/linuxat) token登录→collection→养号文→API落库
function api($url, $method, $body, $token = null) {
    $hdr = ['Content-Type: application/json'];
    if ($token) $hdr[] = "Authorization: Bearer $token";
    $opts = [CURLOPT_RETURNTRANSFER => true, CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => $hdr, CURLOPT_POSTFIELDS => $body ? json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null,
        CURLOPT_TIMEOUT => 30, CURLOPT_SSL_VERIFYPEER => false];
    $ch = curl_init($url);
    curl_setopt_array($ch, $opts);
    $out = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if (($out === false || $code === 0) && _df_px()) {
        curl_close($ch);
        $opts[CURLOPT_PROXY] = _df_px();
        $ch = curl_init($url);
        curl_setopt_array($ch, $opts);
        $out = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    }
    curl_close($ch);
    return [$code, json_decode($out, true)];
}
function plainBody($html) {
    $b = preg_replace('/<h2[^>]*>\s*(.*?)\s*<\/h2>\s*/is', "\n\n\$1\n\n", $html);
    $b = preg_replace('/<h3[^>]*>\s*(.*?)\s*<\/h3>\s*/is', "\n\n\$1\n\n", $b);
    $b = preg_replace('/<li[^>]*>\s*(.*?)\s*(<\/li>)?\s*/is', "• \$1\n", $b);
    $b = preg_replace('/<\/?(ul|ol|p|br|strong|em|b|i)[^>]*>/i', '', $b);
    $b = preg_replace("/\n{3,}/", "\n\n", $b);
    return trim(strip_tags($b));
}
$plan = [
    ['acc' => 204573, 'host' => 'wf.dranik.party', 'user' => 'leoxm', 'pass' => 'Xx@Dran26!Xm'],
    ['acc' => 204583, 'host' => 'writefreely.linuxat.de', 'user' => 'leoxm', 'pass' => 'Xx@Lxat26!Xm'],
];
foreach ($plan as $p) {
    echo "==== {$p['host']} acc#{$p['acc']} ====\n";
    [$c0, $r0] = api("https://{$p['host']}/api/auth/login", 'POST', ['alias' => $p['user'], 'pass' => $p['pass']]);
    $tok = $r0['data']['access_token'] ?? null;
    if (!$tok) { echo "  LOGIN_FAIL $c0\n"; continue; }
    echo "  LOGIN_OK\n";
    // collection 状态
    [$c1, $r1] = api("https://{$p['host']}/api/collections/{$p['user']}", 'GET', null, $tok);
    if ($c1 !== 200) {
        [$c2, $r2] = api("https://{$p['host']}/api/collections", 'POST', ['alias' => $p['user'], 'title' => "Leo's Notes"], $tok);
        echo "  COLLECTION create => $c2 " . json_encode($r2) . "\n";
    } else {
        echo "  COLLECTION exists\n";
    }
    // 养号料
    $wc = json_decode(file_get_contents("http://127.0.0.1/api/seo1/blog-writer/warming-content?platform={$p['host']}"), true);
    $d = $wc['data'] ?? null;
    if (!$d || empty($d['body'])) { echo "  NO_WARMING_CONTENT\n"; continue; }
    $txt = plainBody($d['body']);
    $slug = 'leo-notes-' . substr(md5($p['host'] . $d['source_post_id']), 0, 6);
    [$c3, $r3] = api("https://{$p['host']}/api/collections/{$p['user']}/posts", 'POST', [
        'title' => $d['title'], 'body' => "# {$d['title']}\n\n$txt", 'slug' => $slug,
    ], $tok);
    $postSlug = $r3['data']['posts'][0]['slug'] ?? ($r3['data']['slug'] ?? null);
    if ($c3 !== 200 && $c3 !== 201) { echo "  POST_FAIL $c3 " . json_encode($r3) . "\n"; continue; }
    if (!$postSlug) $postSlug = $slug;
    $url = "https://{$p['host']}/{$p['user']}/$postSlug";
    echo "  POST_OK url=$url\n";
    sleep(2);
    $pub = @file_get_contents($url, false, stream_context_create(['http' => ['timeout' => 15], 'ssl' => ['verify_peer' => false]]));
    $pubOk = $pub !== false && strpos($pub, mb_substr($d['title'], 0, 20)) !== false;
    echo "  SSR " . ($pubOk ? 'HIT(' . strlen($pub) . 'B)' : 'MISS') . "\n";
    if (!$pubOk) { echo "  SKIP-DB\n"; continue; }
    $payload = ['blog_account_id' => $p['acc'], 'title' => $d['title'], 'body' => $txt, 'theme' => 'account-warming', 'source_post_id' => $d['source_post_id']];
    $f = "D:/Github/seoadminC/storage/tmp/_w1200_wf_post_{$p['acc']}.json";
    file_put_contents($f, json_encode($payload, JSON_UNESCAPED_UNICODE));
    $ch = curl_init("http://127.0.0.1/api/seo1/blog-writer/posts");
    curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_HTTPHEADER => ['Content-Type: application/json'], CURLOPT_POSTFIELDS => file_get_contents($f), CURLOPT_TIMEOUT => 20]);
    $r4 = json_decode(curl_exec($ch), true);
    $code4 = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $newId = $r4['data']['id'] ?? null;
    echo "  DB_POST code=$code4 id=" . var_export($newId, true) . "\n";
    if (!$newId) continue;
    $ch = curl_init("http://127.0.0.1/api/seo1/blog-writer/posts/{$newId}/mark-published");
    curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_HTTPHEADER => ['Content-Type: application/json'], CURLOPT_POSTFIELDS => json_encode(['published_url' => $url]), CURLOPT_TIMEOUT => 20]);
    $r5 = json_decode(curl_exec($ch), true);
    echo "  MARK_PUB code=" . curl_getinfo($ch, CURLINFO_HTTP_CODE) . "\n";
    curl_close($ch);
    usleep(400000);
}
echo "DONE\n";
