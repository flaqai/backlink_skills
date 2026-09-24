# reg0000 0916: lessons.json 更新——diigo proven(halfway态) + walls复判3条
import json

P = 'D:/Github/seoadminC/shared/sync-data/lessons.json'
d = json.load(open(P, encoding='utf-8'))

# 1) diigo 注册配方入 proven（激活未完，发文待续）
d['proven']['diigo.com'] = {
    "type": "proven-blog",
    "date": "2026-09-16",
    "shift": "reg0000",
    "machine": "C",
    "dr": 77,
    "account": "leoxm26 / diigo@92ng.com / Xx@Diigo26!Xm (blog_accounts#172 registered, backlink_accounts#202523, login.mjs default/diigo.com.json 10条cookie)",
    "register": "★入口=https://www.diigo.com/sign-up?plan=free(/sign-up裸路径301到/premium付费页勿用; /signup /register全404): username(6~16字符)+email+password三件套insertText→reCAPTCHA v2 checkbox→Create Account→'Your account has been created'+激活信。表单字段name是md5混淆(id正常), value赋值或insertText均可。★免费档页面底部挂支付区(Complete Your Payment)是页面结构, 免费注册不填它",
    "recaptcha": "锚点iframe几何必须实测(querySelector('iframe[src*=anchor]')取x/y/w/h), checkbox中心=iframe内(30,39)。本例(487,377)——点(456,374)差1px落在iframe外零反应。判图3轮: 公交4x4选4格✓→自行车3x3(山地车/红衣骑手/车库自行车+r1c1疑似蓝骑手=误判多选, 请重试)→公交3x3(红大巴/远处白公交/白大巴车头3格✓)过。多轮挑战时验证钮y随窗口高度变化, 每轮重新截图定位",
    "halfway": "注册成功(0210)但激活信20分钟未到(agently+search diigo空)——激活信可能延迟或入垃圾。恢复序: ①agently-cli message +search --q diigo 收信 ②点激活链接(diigo.com/activate类)登录 ③9224 cookie已存(default/diigo.com.json 10条), 掉登录用 node login.mjs use diigo.com ④探发文路径: diigo是bookmark型, 站内blog功能入口=/post或setting里My Blog, 确认可发文则发200-400词养号文(theme=account-warming, target_url=https://www.diigo.com) ⑤POST /api/seo1/blog-writer/posts 落库→mark-published",
    "pitfalls": ["sign-up裸路径=付费页301, 必须?plan=free", "reCAPTCHA锚点iframe差1px点击落空=零反应无报错, 必须按iframe几何计算坐标", "激活信延时未到勿重复注册(同邮箱重注册会报已存在)"],
}

# 2) walls 复判更新
w = d['walls']
if 'suomiblog.com' in w:
    n = w['suomiblog.com']
    if isinstance(n, dict):
        n['updated'] = '2026-09-16'
        n['note'] = n.get('note', '') + ' | [reg0000 0916 C机复判] 站已改版: /register curl 8KB全表单(captcha_window九宫格款, imgs.php?N+ajax.php校验)但9224有头渲染纯白(bodyLen=0, htmlLen=39空文档)——同模板blogacep对照渲染正常(forms=1), 定性=站级IP/指纹白屏防御维持勿攻'
    else:
        w['suomiblog.com'] = {'note': str(n) + ' | [0916复判] curl 200有体/浏览器白屏, 站级防御维持'}
if 'mpeblog.com' in w:
    n = w['mpeblog.com']
    if isinstance(n, dict):
        n['updated'] = '2026-09-16'
        n['note'] = n.get('note', '') + ' | [reg0000 0916 C机复判] /signup curl 3.5KB有表单(captcha_window款)但9224渲染空文档(htmlLen=39)——同suomiblog站级白屏防御, curl探活200仍假阳性勿再判活'
# 新增: sooperarticles CF widget墙(C机侧)
w['sooperarticles-cf-widget-c'] = {
    "domain": "sooperarticles.com",
    "type": "wall-cf-widget-no-render",
    "date": "2026-09-16",
    "note": "[reg0000 0916 C机] CF托管挑战turnstile widget不挂载: /signup盾页出中文「请稍候」但iframe数组空=交互checkbox是静态占位, CDP真实点击→挑战重置(RayID变), 系统级SendInput无处落点(目标不存在)。9224环境被CF打标。A机0906一击过盾(249,306)说明站本身可过——差异在浏览器profile/环境分。已进手工登录队列(id81), 用户手工过盾后AI按A机proven续全链"
}

json.dump(d, open(P, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('lessons updated: proven=', len(d['proven']), 'walls=', len(d['walls']))
