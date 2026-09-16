# -*- coding: utf-8 -*-
# win1000: informationcrawler direct submit (two-step form, NO captcha, LINK_TYPE=2 free)
import re, sys, pickle, http.cookiejar, urllib.request, urllib.parse, ssl

ctx = ssl.create_default_context(); ctx.check_hostname=False; ctx.verify_mode=ssl.CERT_NONE
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
cj = http.cookiejar.CookieJar()
op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj), urllib.request.HTTPSHandler(context=ctx))
def get(url):
    r = op.open(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=20)
    return r.read(800000).decode("utf-8", "ignore")
def post(url, data):
    body = urllib.parse.urlencode(data).encode()
    r = op.open(urllib.request.Request(url, data=body, headers={"User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded", "Referer": url}), timeout=25)
    return r.read(800000).decode("utf-8", "ignore")

base = "https://www.informationcrawler.com"
sub = base + "/submit.php?c=385"
h1 = get(sub)
print("[s1]", len(h1))
h2 = post(sub, {"LINK_TYPE": "2", "formSubmitted": "1", "continue": "Continue"})
print("[s2]", len(h2), "has-form:", 'id="submitForm"' in h2)
payload = {
    "formSubmitted": "1", "LINK_TYPE": "2", "CATEGORY_ID": "385",
    "TITLE": "Generator for House - r2",
    "URL": "https://generatorforhouse.org",
    "DESCRIPTION": "Generator for House is a free home backup power resource with wattage calculators, fuel type comparisons and installation checklists that help homeowners pick the right generator for outages.",
    "OWNER_NAME": "Leo Xm", "OWNER_EMAIL": "dir.informationcrawler@92ng.com",
    "META_KEYWORDS": "generator, backup power, home generator, wattage calculator, outage",
    "AGREERULES": "on", "continue": "Continue",
}
h3 = post(sub, payload)
print("[s3]", len(h3))
t = re.sub(r"<[^>]+>", " ", h3); t = re.sub(r"\s+", " ", t)
ok = False
for kw in ["submitted", "thank", "approval", "has been"]:
    m = re.search(kw, t, re.I)
    if m:
        i = m.start(); print("[OK?]", kw, "->", t[max(0,i-100):i+160].strip()); ok = True; break
if not ok:
    for kw in ["invalid", "incorrect", "already", "not valid", "required", "error"]:
        m = re.search(kw, t, re.I)
        if m:
            i = m.start(); print("[FAIL]", kw, "->", t[max(0,i-100):i+160].strip()); break
open("_w1000_icw_last.html", "w", encoding="utf-8").write(h3)
print("preserved-title:", "Generator for House" in h3)
