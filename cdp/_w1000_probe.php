<?php
// win1000 0916: source scouting probe. mode=blog (probe /, /signup, /register) | dir (probe /submit.php)
// usage: php _w1000_probe.php <mode> <listfile> <outfile>
// listfile: one "domain" per line
$mode = $argv[1] ?? 'blog';
$listFile = $argv[2] ?? '';
$outFile = $argv[3] ?? "D:/Github/seoadminC/storage/tmp/_w1000_probe_{$mode}_out.json";
$domains = array_filter(array_map('trim', file($listFile) ?: []), fn($d) => $d && !str_starts_with($d, '#'));
$domains = array_values(array_unique($domains));
if (!$domains) { fwrite(STDERR, "empty list\n"); exit(1); }

// known sets
$envFile = file_get_contents('D:/Github/seoadminC/.env');
$env = [];
foreach (['DB_HOST','DB_PORT','DB_DATABASE','DB_USERNAME','DB_PASSWORD'] as $k) {
    if (preg_match('/^' . $k . '=(.*)$/m', $envFile, $m)) $env[$k] = trim($m[1]);
}
$pdo = new PDO("mysql:host={$env['DB_HOST']};port={$env['DB_PORT']};dbname={$env['DB_DATABASE']}", $env['DB_USERNAME'], $env['DB_PASSWORD']);
if ($mode === 'blog') {
    $known = $pdo->query("SELECT DISTINCT platform FROM blog_accounts WHERE platform IS NOT NULL")->fetchAll(PDO::FETCH_COLUMN);
} else {
    $known = $pdo->query("SELECT DISTINCT url FROM backlinks")->fetchAll(PDO::FETCH_COLUMN);
    $known = array_map(fn($u) => parse_url($u, PHP_URL_HOST) ?: '', $known);
}
$known = array_filter(array_map(fn($d) => strtolower(preg_replace('/^www\./', '', $d)), $known));
$archKnown = [];
foreach (glob('D:/Github/backlink_skills/blog-platform-sources-*.md') as $f) {
    foreach (file($f, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (preg_match_all('/([a-z0-9][a-z0-9.-]+\.[a-z]{2,})/i', $line, $mm)) {
            foreach ($mm[1] as $d) $archKnown[strtolower(preg_replace('/^www\./', '', $d))] = true;
        }
    }
}
foreach (glob('D:/Github/backlink_skills/new-sources-*.md') as $f) {
    foreach (file($f, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (preg_match_all('/([a-z0-9][a-z0-9.-]+\.[a-z]{2,})/i', $line, $mm)) {
            foreach ($mm[1] as $d) $archKnown[strtolower(preg_replace('/^www\./', '', $d))] = true;
        }
    }
}

$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
function fetch(string $url, string $ua): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true, CURLOPT_MAXREDIRS => 3,
        CURLOPT_TIMEOUT => 12, CURLOPT_CONNECTTIMEOUT => 8, CURLOPT_USERAGENT => $ua, CURLOPT_SSL_VERIFYPEER => false, CURLOPT_ENCODING => '']);
    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    return [(int)$code, is_string($body) ? $body : '', $err];
}
function classifyBlog(array $probe): array {
    [$code, $body] = $probe;
    if ($code === 0 || $code >= 500 || ($code === 200 && $body === '')) return ['DEAD', ''];
    if ($code === 403 || $code === 503) return ['BLOCK_'. $code, ''];
    if ($code !== 200) return ["HTTP_$code", ''];
    foreach (['/signup', '/signup?', '/register'] as $ep) {
        // signup detection done by caller per-domain sequentially (needs body); here homepage only
    }
    $emailSignup = (stripos($body, 'type="email"') !== false || stripos($body, "type='email'") !== false || stripos($body, 'name="email"') !== false);
    return ['LIVE', $emailSignup ? 'EMAIL_FIELD_ON_HOME' : ''];
}
function classifyDir(array $probe): array {
    [$code, $body] = $probe;
    if ($code === 0 || $body === '') return ['DEAD', ''];
    if ($code !== 200) return ["HTTP_$code", ''];
    $hasForm = stripos($body, '<form') !== false;
    $cap = '';
    if (stripos($body, 'recaptcha') !== false) $cap = 'recaptcha';
    elseif (stripos($body, 'captcha.php') !== false || stripos($body, 'imagehash') !== false) $cap = 'phpLD_captcha';
    elseif (stripos($body, 'hcaptcha') !== false) $cap = 'hcaptcha';
    if (!$hasForm) return ['LIVE_NOSUB', ''];
    return ['SUBMIT_FORM', $cap ?: 'nocap'];
}

$results = [];
// homepage probes in parallel batches
$mh = curl_multi_init();
$handles = [];
foreach ($domains as $i => $d) {
    $url = $mode === 'dir' ? "https://{$d}/submit.php" : "https://{$d}/";
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true, CURLOPT_MAXREDIRS => 3,
        CURLOPT_TIMEOUT => 12, CURLOPT_CONNECTTIMEOUT => 8, CURLOPT_USERAGENT => $ua, CURLOPT_SSL_VERIFYPEER => false, CURLOPT_ENCODING => '']);
    curl_multi_add_handle($mh, $ch);
    $handles[$i] = $ch;
}
$running = null;
do { curl_multi_exec($mh, $running); if ($running) curl_multi_select($mh, 0.3); } while ($running > 0);

foreach ($domains as $i => $d) {
    $body = curl_multi_getcontent($handles[$i]);
    $code = curl_getinfo($handles[$i], CURLINFO_RESPONSE_CODE);
    $err = curl_error($handles[$i]);
    curl_multi_remove_handle($mh, $handles[$i]); curl_close($handles[$i]);
    $clean = strtolower(preg_replace('/^www\./', '', $d));
    $inDb = isset($known[$clean]) ? 'DB' : (isset($archKnown[$clean]) ? 'ARCH' : 'NET-NEW');
    if ($mode === 'dir') {
        [$state, $note] = classifyDir([(int)$code, is_string($body) ? $body : '']);
    } else {
        [$state, $note] = classifyBlog([(int)$code, is_string($body) ? $body : '']);
        if ($state === 'LIVE' && !$note) {
            // probe /signup then /register for email field
            foreach (['/signup', '/register'] as $ep) {
                [$c2, $b2] = fetch("https://{$d}{$ep}", $ua);
                if ($c2 === 200 && $b2 && (stripos($b2, 'type="email"') !== false || stripos($b2, "type='email'") !== false || stripos($b2, 'name="email"') !== false || stripos($b2, 'name="user_email"') !== false)) {
                    $state = 'EMAIL_SIGNUP'; $note = "ep={$ep}"; break;
                }
                if ($c2 === 200 && $b2 && strlen($b2) > 1500) { $state = 'SIGNUP_PAGE'; $note = "ep={$ep} no-email-field"; }
            }
        }
    }
    $results[] = ['domain' => $d, 'state' => $state, 'note' => $note, 'known' => $inDb, 'err' => substr($err, 0, 30)];
}
curl_multi_close($mh);
file_put_contents($outFile, json_encode($results, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
// console summary
$sum = [];
$netnew = 0;
foreach ($results as $r) {
    $sum[$r['state']] = ($sum[$r['state']] ?? 0) + 1;
    if ($r['known'] === 'NET-NEW' && !str_starts_with($r['state'], 'DEAD') && !str_starts_with($r['state'], 'HTTP')) $netnew++;
}
echo "MODE=$mode total=" . count($results) . " netnew_alive=$netnew\n";
foreach ($sum as $s => $c) echo "  $s=$c\n";
foreach ($results as $r) {
    if ($r['known'] === 'NET-NEW') echo "  NETNEW {$r['domain']} {$r['state']} {$r['note']}\n";
}
