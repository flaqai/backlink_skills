<?php
// _win1000_validate.php: 候选批量curl验活(curl_multi并发)
// 用法: php _win1000_validate.php dir|blog < domains.txt
// 输出TSV: domain|http_code|final_url|form_inputs|signup_hint|oauth_only_guess
$kind = $argv[1] ?? 'dir';
$doms = array_filter(explode("\n", trim(file_get_contents('php://stdin'))));
$UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

function fetchMulti(array $urls): array {
    $mh = curl_multi_init(); $ch = [];
    foreach ($urls as $i => $u) {
        $c = curl_init($u);
        curl_setopt_array($c, [
            CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true, CURLOPT_MAXREDIRS => 4,
            CURLOPT_TIMEOUT => 14, CURLOPT_CONNECTTIMEOUT => 9, CURLOPT_USERAGENT => $GLOBALS['UA'],
            CURLOPT_SSL_VERIFYPEER => false, CURLOPT_SSL_VERIFYHOST => 0, CURLOPT_ENCODING => '',
        ]);
        curl_multi_add_handle($mh, $c); $ch[$i] = $c;
    }
    do { $st = curl_multi_exec($mh, $active); if ($active) curl_multi_select($mh, 0.3); } while ($active && $st === CURLM_OK);
    $out = [];
    foreach ($ch as $i => $c) {
        $body = curl_multi_getcontent($c);
        $out[$i] = ['code' => curl_getinfo($c, CURLINFO_RESPONSE_CODE), 'final' => curl_getinfo($c, CURLINFO_EFFECTIVE_URL), 'body' => substr((string)$body, 0, 220000)];
        curl_multi_remove_handle($mh, $c); curl_close($c);
    }
    curl_multi_close($mh);
    return $out;
}

$jobs = [];
foreach ($doms as $d) {
    $d = trim(strtolower($d)); if (!$d) continue;
    $jobs[] = ['dom' => $d, 'urls' => ["https://{$d}/"]];
}
$BATCH = 40;
for ($i = 0; $i < count($jobs); $i += $BATCH) {
    $slice = array_slice($jobs, $i, $BATCH);
    $urls = []; $idx = [];
    foreach ($slice as $j => $job) { $urls[] = $job['urls'][0]; $idx[] = $job['dom']; }
    $res = fetchMulti($urls);
    foreach ($idx as $j => $dom) {
        $r = $res[$j];
        $body = $r['body'];
        $inputs = preg_match_all('/<input/i', $body);
        $forms = preg_match_all('/<form/i', $body);
        $signupHint = '';
        if ($kind === 'blog') {
            foreach (['/signup','/register','/join','/create-account'] as $p) {
                if (preg_match('~href="https?://[^"]*' . preg_quote($dom,'~') . preg_quote($p,'~') . '~i', $body) || preg_match('~href="' . preg_quote($p,'~') . '"~i', $body)) { $signupHint = $p; break; }
            }
        } else {
            foreach (['submit','add-url','addurl','add_url','suggest','add.php','submit.php'] as $p) {
                if (stripos($body, $p) !== false) { $signupHint = $p; break; }
            }
        }
        $oauth = preg_match('/accounts\.google\.com\/(o\/oauth2|signin)|facebook\.com\/(v[0-9.]+\/)?dialog\/oauth|oauth/i', $body) ? 1 : 0;
        $pw = preg_match('/type=["\']?password/i', $body) ? 1 : 0;
        echo implode('|', [$dom, $r['code'], substr($r['final'], 0, 60), $forms . '/' . $inputs, $signupHint, "pw={$pw},oauth={$oauth}"]) . "\n";
    }
}
