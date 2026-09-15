# 修复 lessons.json 缺逗号型损坏（迭代到解析通过）
import json

P = 'D:/Github/seoadminC/shared/sync-data/lessons.json'
s = open(P, encoding='utf-8').read()
fixed = 0
for _ in range(20):
    try:
        d = json.loads(s)
        open(P, 'w', encoding='utf-8').write(json.dumps(d, ensure_ascii=False, indent=1))
        print('WRITTEN OK after', fixed, 'fixes; top keys:', len(d))
        break
    except json.JSONDecodeError as e:
        pos = e.pos
        # 打印现场
        print('ERR at', pos, ':', repr(s[max(0, pos - 60):pos + 60]))
        # 常见损坏: ']\n  "key"' 缺逗号 / '"val"\n"key2"' 缺逗号
        before = s[:pos].rstrip()
        after = s[pos:]
        if before.endswith(']') or before.endswith('}') or before.endswith('"'):
            s = before + ',\n' + after.lstrip(',\n ')
            fixed += 1
        else:
            print('unhandled pattern, stop')
            break
else:
    print('still broken')
