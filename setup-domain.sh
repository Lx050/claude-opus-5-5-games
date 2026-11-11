#!/usr/bin/env bash
# 补齐 Cloudflare Pages 自定义域名的 DNS 记录。
#
# 背景：Pages 项目 claude-opus-5-5-games-git 已绑定
# xiaomimimogames.maniforld.com，但通过 API 添加的自定义域名不会自动写 DNS。
# 当前 wrangler OAuth 登录态只有 zone:read，没有 DNS 写权限，因此需要
# 一个具备 Zone / DNS / Edit 权限的 API Token 来跑这个脚本。
#
# 用法：
#   CF_API_TOKEN=<token> ./setup-domain.sh
# 或先在 Dashboard DNS 手动加一条 CNAME（见 DEPLOY.md）。
set -euo pipefail

if [ -z "${CF_API_TOKEN:-${CLOUDFLARE_API_TOKEN:-}}" ]; then
  echo "缺少 API Token。用法：CF_API_TOKEN=<token> ./setup-domain.sh" >&2
  echo "在 https://dash.cloudflare.com/profile/api-tokens 创建，权限选 Zone / DNS / Edit。" >&2
  exit 1
fi
export CF_API_TOKEN="${CF_API_TOKEN:-${CLOUDFLARE_API_TOKEN}}"

python3 <<'PY'
import os, json, time, urllib.request, urllib.error

TOKEN = os.environ['CF_API_TOKEN']
ZONE_ID = '378e9c86f082170ff42ddac20a26f18b'
ACCOUNT_ID = '2452c588c9b93e2f3f8d894c64c0f240'
PROJECT = 'claude-opus-5-5-games-git'
NAME = 'xiaomimimogames.maniforld.com'
TARGET = 'claude-opus-5-5-games-git.pages.dev'
BASE = 'https://api.cloudflare.com/client/v4'

def api(path, method='GET', body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method, headers={
        'Authorization': 'Bearer ' + TOKEN,
        'Content-Type': 'application/json',
        'User-Agent': 'setup-domain/1.0',
    })
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            return r.status, json.load(r)
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read())
        except Exception:
            return e.code, {}
    except Exception as e:
        return 0, {'errors': [{'message': str(e)}]}

def errs(j):
    return json.dumps(j.get('errors') or [], ensure_ascii=False)

print('==> 校验 API Token')
st, j = api('/user/tokens/verify')
if not j.get('success'):
    print('Token 无效或权限不足：HTTP', st, errs(j)); raise SystemExit(1)
print('    OK:', j['result'].get('status'))

print('==> 检查是否已有同名 CNAME')
st, j = api(f'/zones/{ZONE_ID}/dns_records?type=CNAME&name={NAME}')
if not j.get('success'):
    print('DNS 读取失败：HTTP', st, errs(j)); raise SystemExit(1)
existing = j.get('result') or []
if existing:
    rec = existing[0]
    if (rec.get('content') or '').rstrip('.') == TARGET:
        print('    已存在且指向正确，跳过创建：', rec.get('id'))
    else:
        print('    已存在同名 CNAME 但指向', rec.get('content'), '——为避免误改，脚本停止。')
        print('    请人工核对后在 Dashboard 调整。'); raise SystemExit(1)
else:
    print('==> 创建 CNAME 记录')
    st, j = api(f'/zones/{ZONE_ID}/dns_records', 'POST', {
        'type': 'CNAME',
        'name': 'xiaomimimogames',
        'content': TARGET,
        'ttl': 1,
        'proxied': True,
    })
    if not j.get('success'):
        print('创建失败：HTTP', st, errs(j)); raise SystemExit(1)
    print('    已创建 id', j['result'].get('id'))

print('==> 等待 Pages 域名验证 / 证书签发')
for i in range(12):
    st, j = api(f'/accounts/{ACCOUNT_ID}/pages/projects/{PROJECT}/domains')
    d = next((x for x in (j.get('result') or []) if x.get('name') == NAME), {})
    status = d.get('status')
    verify = (d.get('verification_data') or {}).get('status')
    print(f'    第 {i+1} 次：status={status} verification={verify}')
    if status == 'active':
        print('\n✅ 域名已生效：https://' + NAME + '/')
        break
    time.sleep(15)
else:
    print('\n域名仍为 pending。DNS 已写入，证书签发通常需要几分钟；稍后可直接访问验证。')

print('\n==> 线上校验')
try:
    with urllib.request.urlopen('https://' + NAME + '/', timeout=20) as r:
        body = r.read()
        print('    HTTP', r.status, '|', len(body), 'bytes')
except Exception as e:
    print('    暂不可达（可能仍在签发证书）：', e)
PY
