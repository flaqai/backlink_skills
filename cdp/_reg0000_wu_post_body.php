<?php
// reg0000: writeupcafe 养号文落库
$html = <<< 'EOF'
<p>I have kept notes in paper notebooks for years, mostly about bicycles I fix during the week and the small things I notice on my route to the shop. A friend who writes here suggested I try putting a few of those notes online, so this is my first attempt at doing that.</p>
<p>My plan is simple. I will write about the bikes that come through the shop, the odd weather we get in my corner of Oregon, and whatever book has my attention at the moment. Nothing long, nothing polished. The point is to practice putting sentences together that a stranger might actually enjoy reading.</p>
<p>What I like about the idea of a blog, as old-fashioned as it sounds, is that there is no feed pushing anything at me. I write when something is worth writing down, and anyone who wanders past can read it or not. That feels like a healthier way to spend a bit of each week.</p>
<p>If you are reading this, hello. I hope to have a proper first entry up soon, probably about a cargo bike I rebuilt last month that taught me a lesson in patience.</p>
<p>Yesterday a student came in with a frame that had been stored in a damp shed for two winters. The chain was rusted solid and the bearings were gritty, but the frame itself was sound. Saving it took most of the afternoon, and there was a moment near the end when the front wheel finally spun freely again and I felt the same small satisfaction I always feel when something broken starts working. Those moments are a big part of why I wanted a place to write things down.</p>
<p>I also want to keep track of what I read. At the moment that is a lot of old paperback science fiction from the stall by the station, where everything costs less than a coffee. Last month it was a collection of stories about slow robots tending gardens on a quiet future earth, which sounds strange and was exactly right. Writing a few lines about each book here seems like a good habit to build, and if it helps someone else pick their next read, even better.</p>
EOF;
$body = [
    'blog_account_id' => 73,
    'title' => 'Settling In: First Notes From a New Writing Spot',
    'body' => $html,
    'theme' => 'account-warming',
    'target_url' => 'https://writeupcafe.com',
];
file_put_contents("D:/Github/backlink_skills/cdp/_reg0000_wu_post.json", json_encode($body));
echo "wordcount=" . str_word_count(strip_tags($html)) . "\n";
