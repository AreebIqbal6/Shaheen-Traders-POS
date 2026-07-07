import re

with open('src/mockData.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'"stock": (\d+)\s*\}', r'"stock": \1,\n    "pcsPerBox": 12,\n    "boxPerCtn": 6\n  }', content)

with open('src/mockData.ts', 'w', encoding='utf-8') as f:
    f.write(content)
