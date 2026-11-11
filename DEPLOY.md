# 部署说明

三个纯静态 Three.js 游戏，源码经 `build-all.mjs` 打包为单文件 HTML，聚合到 `public/`。

## 线上地址

| 用途 | 地址 | 更新方式 |
| --- | --- | --- |
| **自定义域名（目标）** | https://xiaomimimogames.maniforld.com/ | 与 Git 项目同一套部署；需先补一条 DNS CNAME，见下文 |
| **正式（自动部署，当前可用）** | https://claude-opus-5-5-games-git.pages.dev/ | push 到 `main`，Cloudflare Pages Git 集成自动发布 |
| 初始 Direct Upload 版 | https://claude-opus-5-5-games.pages.dev/ | 手动 `wrangler pages deploy`，不随 push 更新 |

Cloudflare Pages 项目 `claude-opus-5-5-games-git` 配置：`build_command` 为空、`destination_dir = public`、`root_dir = /`、`production_branch = main`。仓库里的 `public/` 是已构建产物，所以 Cloudflare 侧无需安装依赖、无需跑构建。

## 自定义域名

`xiaomiMIMOgames.maniforld.com` 已作为 custom domain 添加到 Pages 项目 `claude-opus-5-5-games-git`（Cloudflare API 会把主机名规范化为小写 `xiaomimimogames.maniforld.com`；DNS / URL 的主机名大小写不敏感，输入原样大小写同样可访问）。

**当前状态：域名处于 `pending`，等待 DNS 记录。** `maniforld.com` 上存在 `*.maniforld.com` 泛解析，请求会落到 Cloudflare 边缘但没有路由到 Pages（返回 200 空响应）。需要补一条：

| 字段 | 值 |
| --- | --- |
| Type | `CNAME` |
| Name | `xiaomimimogames`（完整名 `xiaomimimogames.maniforld.com`） |
| Target | `claude-opus-5-5-games-git.pages.dev` |
| Proxy | Proxied（橙色云）或 DNS only 均可 |

具体记录优先于泛解析，无需删除任何既有记录。两种方式二选一：

1. **一键脚本**（需要 `Zone / DNS / Edit` 权限的 API Token）：
   ```bash
   CF_API_TOKEN=<token> ./setup-domain.sh
   ```
   脚本会先验证 token、检查同名 CNAME 是否冲突（不覆盖已有异值记录）、创建记录，再轮询域名状态并校验线上可访问。
2. **Dashboard 手动**：`maniforld.com` → DNS → Add record，按上表填写，保存后等证书自动签发。

> 现有 wrangler OAuth 登录态只有 `zone:read`，没有 DNS 写权限，因此 API 直接创建记录会返回 `403 code 10000`。这也是上面需要单独 token 的原因。

## 本地构建

```bash
npm run build     # 依次构建三个子工程，输出到 public/<slug>/index.html 并生成首页
```

三个子工程保留独立 `node_modules`（three 版本分别为 0.186 / 0.186 / 0.169，不能合并）。lockfile 已重新生成指向 `registry.npmjs.org`——原仓库两份 lockfile 指向内网镜像 `bnpm.byted.org`，公网无法解析。

## 手动部署（备用）

```bash
./deploy.sh                       # 首次会自动创建 Pages 项目，之后直接上传 public/
```

或在 GitHub Actions 里手动 dispatch `deploy.yml`（需 `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`）。日常更新不需要这一步，直接 push 即可。

`setup-domain.sh` 只负责补 DNS 记录，不参与日常部署；DNS 生效后无需再运行。

## 目录

```
public/index.html              导航首页
public/pelican-bike/           鹈鹕骑自行车
public/transport-ship/         穿越火线·运输船
public/qq-speed/               QQ 飞车
pelican-bike/ cf-transport-ship/ qq-speed/   源码（逻辑未改动）
```

与《穿越火线》《QQ 飞车》原厂无关。
