# 部署说明

三个纯静态 Three.js 游戏，源码经 `build-all.mjs` 打包为单文件 HTML，聚合到 `public/`。

## 线上地址

| 用途 | 地址 | 更新方式 |
| --- | --- | --- |
| **正式（自动部署）** | https://claude-opus-5-5-games-git.pages.dev/ | push 到 `main`，Cloudflare Pages Git 集成自动发布 |
| 初始 Direct Upload 版 | https://claude-opus-5-5-games.pages.dev/ | 手动 `wrangler pages deploy`，不随 push 更新 |

Cloudflare Pages 项目 `claude-opus-5-5-games-git` 配置：`build_command` 为空、`destination_dir = public`、`root_dir = /`、`production_branch = main`。仓库里的 `public/` 是已构建产物，所以 Cloudflare 侧无需安装依赖、无需跑构建。

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

## 目录

```
public/index.html              导航首页
public/pelican-bike/           鹈鹕骑自行车
public/transport-ship/         穿越火线·运输船
public/qq-speed/               QQ 飞车
pelican-bike/ cf-transport-ship/ qq-speed/   源码（逻辑未改动）
```

源码来自 [riba2534/claude-opus-5-5-demo](https://github.com/riba2534/claude-opus-5-5-demo)，Claude Opus 5.5 one-shot 生成。游戏为能力测试用途的致敬作品，与《穿越火线》《QQ 飞车》原厂无关。
