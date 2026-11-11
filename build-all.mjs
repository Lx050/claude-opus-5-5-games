#!/usr/bin/env node
/**
 * 三个游戏 -> 一个 Cloudflare Pages 站点
 * 产物：public/index.html（导航首页）+ public/<slug>/index.html（各游戏单文件）
 *
 * 设计要点：
 * 1. 每个子工程保留独立 node_modules（three 版本不同：0.186 / 0.186 / 0.169，不能合并到根）
 * 2. 强制走 registry.npmjs.org，绕开原 lockfile 里字节内网 bnpm.byted.org 的不可达地址
 * 3. 不依赖子工程的 npm scripts（其中两个原本没有 build 脚本），直接执行 node build.mjs
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, copyFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const games = [
  {
    dir: 'pelican-bike',
    slug: 'pelican-bike',
    emoji: '🚲',
    title: '鹈鹕骑自行车',
    sub: 'Pelican on a Bike',
    desc: '海岸公路休闲骑行 · 布料围巾 / 昼夜循环 / Gerstner 海浪 / 实时合成音乐',
    keys: 'W/S 加减速 · A/D 变道 · 空格跳跃 · T 抬前轮',
    size: '~800 KB',
  },
  {
    dir: 'cf-transport-ship',
    slug: 'transport-ship',
    emoji: '🔫',
    title: '穿越火线 · 运输船',
    sub: 'CF Transport Ship',
    desc: 'FPS 团队枪战 · 弹道后坐力 / bots AI / 击杀播报 / 程序化音效',
    keys: 'WASD 移动 · 鼠标瞄准射击 · 触屏支持',
    size: '~840 KB',
  },
  {
    dir: 'qq-speed',
    slug: 'qq-speed',
    emoji: '🏎️',
    title: 'QQ 飞车 3D',
    sub: 'QQ Speed 3D',
    desc: '竞速漂移 · 四张赛道 / 小喷双喷 / 氮气 / 道具赛',
    keys: '方向键驾驶 · Shift 漂移 · Ctrl 氮气 · R 复位',
    size: '~700 KB',
  },
];

for (const g of games) {
  const cwd = join(root, g.dir);
  // 只有在缺依赖时才安装；本地重复构建很快，CI 首次构建会装
  if (!existsSync(join(cwd, 'node_modules', 'esbuild'))) {
    console.log(`\n[install] ${g.dir}`);
    execFileSync(
      npm,
      ['install', '--omit=dev', '--registry=https://registry.npmjs.org', '--no-audit', '--no-fund'],
      { cwd, stdio: 'inherit' },
    );
  }
  console.log(`[build]   ${g.dir}`);
  execFileSync(process.execPath, ['build.mjs'], { cwd, stdio: 'inherit' });

  const outDir = join(root, 'public', g.slug);
  mkdirSync(outDir, { recursive: true });
  copyFileSync(join(cwd, 'dist', 'index.html'), join(outDir, 'index.html'));
  console.log(`[output]  public/${g.slug}/index.html`);
}

const cards = games
  .map(
    (g) => `      <a class="card" href="./${g.slug}/">
        <div class="thumb">${g.emoji}</div>
        <div class="body">
          <h2>${g.title}</h2>
          <div class="sub">${g.sub}</div>
          <p>${g.desc}</p>
          <div class="keys">${g.keys}</div>
        </div>
        <div class="meta"><span>${g.size}</span><span class="go">开始游玩 →</span></div>
      </a>`,
  )
  .join('\n');

const home = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>Three.js 3D 游戏合集</title>
<meta name="description" content="三个纯前端 3D 网页游戏：鹈鹕骑自行车、穿越火线运输船、QQ 飞车。" />
<style>
  :root { color-scheme: dark; --bg:#0a0e18; --card:#131a2a; --line:rgba(255,255,255,.09);
          --txt:#eef2fb; --muted:#93a0bb; --accent:#ffb547; }
  * { box-sizing:border-box }
  body { margin:0; min-height:100vh; background:radial-gradient(1200px 600px at 50% -10%,#1b2942 0%,var(--bg) 60%);
         color:var(--txt); font-family:"PingFang SC","Microsoft YaHei",system-ui,-apple-system,sans-serif; }
  .wrap { max-width:1080px; margin:0 auto; padding:64px 24px 80px }
  header { text-align:center; margin-bottom:48px }
  h1 { font-size:clamp(28px,5vw,44px); margin:0 0 12px; letter-spacing:-.5px }
  header p { color:var(--muted); margin:0; font-size:15px }
  .badges { margin-top:18px; display:flex; gap:8px; justify-content:center; flex-wrap:wrap }
  .badge { font-size:12px; color:var(--muted); border:1px solid var(--line); border-radius:99px; padding:5px 12px }
  .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:20px }
  .card { display:flex; flex-direction:column; background:var(--card); border:1px solid var(--line);
          border-radius:18px; overflow:hidden; text-decoration:none; color:inherit;
          transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease }
  .card:hover { transform:translateY(-4px); border-color:rgba(255,181,71,.45); box-shadow:0 18px 50px rgba(0,0,0,.4) }
  .thumb { height:120px; display:grid; place-items:center; font-size:56px;
           background:linear-gradient(135deg,#1d2b47,#0f1726) }
  .body { padding:20px 20px 8px; flex:1 }
  .body h2 { margin:0; font-size:20px }
  .sub { color:var(--muted); font-size:12px; margin-top:4px; letter-spacing:.4px }
  .body p { color:var(--muted); font-size:13px; line-height:1.7; margin:14px 0 }
  .keys { font-size:12px; color:#7f8dab; border-top:1px solid var(--line); padding-top:12px }
  .meta { display:flex; justify-content:space-between; align-items:center; padding:14px 20px;
          font-size:12px; color:var(--muted); border-top:1px solid var(--line) }
  .go { color:var(--accent); font-weight:600 }
  footer { text-align:center; margin-top:56px; color:#65738f; font-size:12px; line-height:1.8 }
</style>
</head>
<body>
  <div class="wrap">
    <header>
      <h1>Three.js 3D 游戏合集</h1>
      <p>三个纯前端单文件游戏 · 无后端 · 无外部素材 · 打开即玩</p>
      <div class="badges">
        <span class="badge">Cloudflare Pages</span>
        <span class="badge">Three.js</span>
        <span class="badge">esbuild 内联打包</span>
        <span class="badge">单文件 HTML</span>
      </div>
    </header>
    <div class="grid">
${cards}
    </div>
    <footer>
      源码来自 <a href="https://github.com/riba2534/claude-opus-5-5-demo" style="color:#93a0bb">riba2534/claude-opus-5-5-demo</a> · Claude Opus 5.5 one-shot 生成<br />
      游戏为能力测试用途的致敬作品，与《穿越火线》《QQ 飞车》原厂无关
    </footer>
  </div>
</body>
</html>
`;

mkdirSync(join(root, 'public'), { recursive: true });
writeFileSync(join(root, 'public', 'index.html'), home);
writeFileSync(
  join(root, 'public', '_headers'),
  '/*.html\n  Cache-Control: public, max-age=0, must-revalidate\n\n/*\n  X-Content-Type-Options: nosniff\n',
);
console.log('\n[done] public/ 已就绪，可直接 wrangler pages deploy public');
