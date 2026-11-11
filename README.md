# 3D 游戏合集

三个纯前端 3D 网页游戏，各自打包为单文件 HTML，统一托管在一个静态站点。

## 内容

| 游戏 | 源码目录 | 站点路径 |
| --- | --- | --- |
| 鹈鹕骑自行车 | `pelican-bike/` | `/pelican-bike/` |
| 穿越火线 · 运输船 | `cf-transport-ship/` | `/transport-ship/` |
| QQ 飞车 3D | `qq-speed/` | `/qq-speed/` |

所有模型、纹理、动画与音效均由代码实时生成，运行时不请求任何外部资源，也没有后端服务。

## 构建

```bash
npm run build     # 构建三个子工程，输出到 public/
```

三个子工程保留独立依赖（three 版本不同，不能合并到根目录）。构建产物 `public/` 已入库，因此部署侧无需安装依赖、无需执行构建命令。

## 部署

站点托管在 Cloudflare Pages，push 到 `main` 会自动发布。构建配置、备用部署方式与自定义域名说明见 [DEPLOY.md](./DEPLOY.md)。

与《穿越火线》《QQ 飞车》原厂无关。
