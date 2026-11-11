#!/usr/bin/env node
/**
 * 三个游戏 -> 一个静态站点
 * 产物：public/index.html（导航首页）+ public/<slug>/index.html（各游戏单文件）
 *
 * 设计要点：
 * 1. 每个子工程保留独立 node_modules（three 版本不同：0.186 / 0.186 / 0.169，不能合并到根）
 * 2. 统一走公网 registry，避免 lockfile 指向不可达的镜像地址
 * 3. 不依赖子工程的 npm scripts，直接执行 node build.mjs
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, copyFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const games = [
  { dir: 'pelican-bike', slug: 'pelican-bike', emoji: '🚲', title: '鹈鹕骑自行车' },
  { dir: 'cf-transport-ship', slug: 'transport-ship', emoji: '🔫', title: '穿越火线 · 运输船' },
  { dir: 'qq-speed', slug: 'qq-speed', emoji: '🏎️', title: 'QQ 飞车 3D' },
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
        <div class="body"><h2>${g.title}</h2></div>
        <div class="meta"><span class="go">开始游玩 →</span></div>
      </a>`,
  )
  .join('\n');

const home = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>3D 游戏合集</title>
<meta name="description" content="3D 网页游戏合集" />
<style>
  :root { color-scheme: dark; --bg:#0a0e18; --card:#131a2a; --line:rgba(255,255,255,.09);
          --txt:#eef2fb; --muted:#93a0bb; --accent:#ffb547; }
  * { box-sizing:border-box }
  body { margin:0; min-height:100vh; background:radial-gradient(1200px 600px at 50% -10%,#1b2942 0%,var(--bg) 60%);
         color:var(--txt); font-family:"PingFang SC","Microsoft YaHei",system-ui,-apple-system,sans-serif; }
  .wrap { max-width:1080px; margin:0 auto; padding:64px 24px 80px }
  header { text-align:center; margin-bottom:48px }
  h1 { font-size:clamp(28px,5vw,44px); margin:0; letter-spacing:-.5px }
  .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:20px }
  .card { display:flex; flex-direction:column; background:var(--card); border:1px solid var(--line);
          border-radius:18px; overflow:hidden; text-decoration:none; color:inherit;
          transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease }
  .card:hover { transform:translateY(-4px); border-color:rgba(255,181,71,.45); box-shadow:0 18px 50px rgba(0,0,0,.4) }
  .thumb { height:160px; display:grid; place-items:center; font-size:64px;
           background:linear-gradient(135deg,#1d2b47,#0f1726) }
  .body { padding:22px 20px; flex:1; display:flex; align-items:center }
  .body h2 { margin:0; font-size:20px }
  .meta { display:flex; justify-content:flex-end; align-items:center; padding:14px 20px;
          font-size:12px; color:var(--muted); border-top:1px solid var(--line) }
  .go { color:var(--accent); font-weight:600 }
  footer { text-align:center; margin-top:56px; color:#65738f; font-size:12px; line-height:1.8 }
</style>
</head>
<body>
  <div class="wrap">
    <header>
      <h1>3D 游戏合集</h1>
    </header>
    <div class="grid">
${cards}
    </div>
    <footer>
      与《穿越火线》《QQ 飞车》原厂无关
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
console.log('\n[done] public/ 已就绪');
