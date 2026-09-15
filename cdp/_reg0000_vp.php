<?php
// reg0000: verify-pending 全池复核 (C机 pending 且有凭据的行)
$d = json_decode(file_get_contents("D:/Github/backlink_skills/cdp/_reg0000_accs3.json"), true);
$rows = $d['data']['data'] ?? $d['data'];
$c = 0;
foreach ($rows as $r) {
    if (($r['machine'] ?? '') === 'C' && in_array($r['status'], ['pending', 'halfway']) && !empty($r['email'])) {
        echo $r['id'] . " " . $r['domain'] . " st=" . $r['status'] . " email=" . $r['email'] . " src=" . $r['source'] . "\n";
        $c++;
    }
}
echo "C-machine pending/halfway with-email = $c\n";
