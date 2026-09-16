# -*- coding: utf-8 -*-
"""win0600 phpLD 三步式+视觉码引擎(持久session两阶段):
阶段A: python _w0600_phpld_vis.py <domain> <task> <cat> <suffix>          -> 存图+cookie+hash
阶段B: python _w0600_phpld_vis.py <domain> <task> <cat> <suffix> <code>   -> 复用session提交"""
import sys, re, html as H, pickle, os
import urllib.request, urllib.parse, http.cookiejar, ssl

DOMAIN = sys.argv[1]
TASK = sys.argv[2]
CAT = sys.argv[3]
SUFFIX = sys.argv[4] if len(sys.argv) > 4 else ""
CAPTCHA_CODE = sys.argv[5] if len(sys.argv) > 5 else ""
STATE = f"D:/Github/seoadminC/storage/tmp/_w1000_capstate_{DOMAIN.split('.')[0]}.pkl"

TASKS = {
    "2": ("Smog Check Near Me", "https://smogcheck-nearme.com", "Find licensed smog check stations near you, compare test prices and STAR certified locations, and get your vehicle ready to pass emissions testing on the first try."),
    "7": ("Zakaihu", "https://zakaihu.com", "Zakaihu publishes practical personal finance guides, budgeting templates and investment explainers in plain language, helping readers build savings habits and smarter money decisions."),
    "8": ("Generator for House", "https://generatorforhouse.org", "Generator for House is a free home backup power resource with wattage calculators, fuel type comparisons and installation checklists that help homeowners pick the right generator for outages."),
    "9": ("Spravs", "https://spravs.com", "Spravs offers detailed home appliance guides, buying checklists and maintenance tips, covering everything from refrigerators to HVAC so families choose and maintain equipment with confidence."),
}
NAME, URL, DESC = TASKS[TASK]
if SUFFIX:
    NAME = f"{NAME} - {SUFFIX}"

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj), urllib.request.HTTPSHandler(context=ctx))

def get(url, binary=False):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with opener.open(req, timeout=20) as r:
        d = r.read(800000)
        return (d if binary else d.decode("utf-8", "ignore")), r.geturl()

def post(url, data):
    body = urllib.parse.urlencode(data).encode()
    req = urllib.request.Request(url, data=body, headers={
        "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded",
        "Referer": url, "Origin": f"https://{DOMAIN}"})
    with opener.open(req, timeout=25) as r:
        return r.read(800000).decode("utf-8", "ignore"), r.geturl()

base = f"https://{DOMAIN}"
sub_url = base + "/submit.php?c=" + CAT

h1, u1 = get(sub_url + f"?c={CAT}")
print(f"[s1] GET ({len(h1)}b)")
h2, u2 = post(sub_url, {"LINK_TYPE": "normal"})
print(f"[s2] ({len(h2)}b)")
m = re.search(r'name="IMAGEHASH"[^>]*value="([a-f0-9]+)"', h2)
if not m:
    print("[s2] NO IMAGEHASH - maybe no captcha or wrong page")
    open("_w1000_gma_s2.html", "w", encoding="utf-8").write(h2)
    sys.exit(1)
imagehash = m.group(1)
img_m = re.search(r'<img[^>]*src="([^"]*captcha[^"]*)"', h2[h2.find("IMAGEHASH")-200:h2.find("IMAGEHASH")+800], re.I)
img_url = img_m.group(1) if img_m else None
if img_url and img_url.startswith("/"):
    img_url = base + img_url
print(f"[s2] IMAGEHASH={imagehash} img={img_url}")

if not CAPTCHA_CODE:
    # phase A: save captcha image + persist session
    if img_url:
        data, _ = get(img_url, binary=True)
        open("_w1000_gma_captcha.png", "wb").write(data)
        with open(STATE, "wb") as f:
            pickle.dump({"cookies": [(c.name, c.value, c.domain, c.path) for c in cj], "imagehash": imagehash, "sub_url": sub_url}, f)
        print(f"[cap] saved captcha png ({len(data)}b) + state; read code and rerun with arg6")
    else:
        print("[cap] no captcha img url found; dump s2 html")
        open("_w1000_gma_s2.html", "w", encoding="utf-8").write(h2)
    sys.exit(0)

# phase B: restore session
with open(STATE, "rb") as f:
    st = pickle.load(f)
imagehash = st["imagehash"]
sub_url = st["sub_url"]
for name, value, domain, path in st["cookies"]:
    c = http.cookiejar.Cookie(0, name, value, None, False, domain, True, False, path, True, False, None, False, None, None, {})
    cj.set_cookie(c)
print(f"[s3] restored session imagehash={imagehash}")

# phase B: full submit (no s1/s2 re-run)
q = None
payload = {
    "formSubmitted": "1",
    "LINK_TYPE": "normal",
    "CATEGORY_ID": CAT,
    "TITLE": NAME,
    "URL": URL,
    "DESCRIPTION": DESC,
    "OWNER_NAME": "Leo Xm",
    "OWNER_EMAIL": "dir.gmawebdirectory@92ng.com",
    "IMAGEHASH": imagehash,
    "CAPTCHA": CAPTCHA_CODE,
    "submit": "Continue",
    "AGREERULES": "on",
    "RECPR_URL": "",
}
if q:
    a, op, b = int(q.group(1)), q.group(2), int(q.group(3))
    payload["DO_MATH"] = str(a + b if op == "+" else (a - b if op == "-" else a * b))
    print(f"[s3] DO_MATH {q.group(0)} = {payload['DO_MATH']}")

h3, u3 = post(sub_url, payload)
print(f"[s3] ({len(h3)}b)")
low = re.sub(r'<[^>]+>', ' ', h3).lower()
low = re.sub(r'\s+', ' ', low)
ok = False
for kw in ["link submitted", "thank you", "submitted for approval", "has been sent", "successfully"]:
    if kw in low:
        i = low.find(kw)
        print(f"[OK] '{kw}':", low[max(0, i-120):i+180].strip()[:250])
        ok = True
        break
if not ok:
    for kw in ["error", "not valid", "already", "incorrect", "required"]:
        if kw in low:
            i = low.find(kw)
            print(f"[FAIL] '{kw}':", low[max(0, i-120):i+180].strip()[:250])
            break
open("_w1000_gma_last.html", "w", encoding="utf-8").write(h3)
print("RESULT:", "PASS" if ok else "CHECK")
