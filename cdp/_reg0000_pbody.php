<?php
// reg0000: dreamwidth 养号文落库 body
$html = <<< 'EOF'
<p>I have been meaning to slow down online for a while now, and last week I finally made an account here. Most of my internet time lately has been scrolling feeds that never end, and I wanted something that feels more like keeping a notebook than shouting into a crowd. A friend mentioned this place years ago and I am glad I finally listened.</p>
<p>A little about me: I fix bicycles at a small shop, I read mostly old science fiction, and I cook the same five dinners on rotation. My plan for this journal is simple. I want to write about the small repairs I do at work, the books I find at the secondhand stall near the station, and whatever else sticks in my head during the week. Nothing polished, just notes I would be happy to reread in a year.</p>
<p>What surprised me most is how quiet it feels here. There is no feed pushing headlines at me, no counter telling me how many people saw a post. I write when I want, I read a few journals I have discovered while wandering, and then I close the laptop. It reminds me of the forums I loved as a teenager, where a conversation could last a whole month.</p>
<p>If you are passing through, hello. I am mostly here to keep a record of ordinary days, and maybe to learn a few recipes along the way. This corner of the internet seems built for exactly that.</p>
EOF;
$body = [
    'blog_account_id' => 120,
    'title' => 'Finding My Corner on Dreamwidth',
    'body' => $html,
    'theme' => 'account-warming',
    'target_url' => 'https://dreamwleoxm.dreamwidth.org',
];
file_put_contents("D:/Github/backlink_skills/cdp/_reg0000_post.json", json_encode($body));
echo "post_body_written wordcount=" . str_word_count(strip_tags($html)) . "\n";
