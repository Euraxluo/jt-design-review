#!/usr/bin/env node
// embed.mjs — 构建后处理（本 skill 扩展）：
//  1. spec 里 image 节点的 src=evidence/... 相对路径 → base64 data URI 内嵌（单文件离线）
//  2. 校验 htmlBefore/htmlAfter/embedHtml 中的哨兵残留（防 </script> 破坏外层脚本）
// 用法: node embed.mjs <preview.html> [--root <项目根，默认 cwd>]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const args = process.argv.slice(2);
const file = args[0];
const rootIdx = args.indexOf('--root');
const root = rootIdx > -1 ? resolve(args[rootIdx + 1]) : process.cwd();
if (!file) { console.error('usage: node embed.mjs <preview.html> [--root <dir>]'); process.exit(1); }

let html = readFileSync(file, 'utf8');
let n = 0;
html = html.replace(/"src":"(evidence\/[^"]+?)"/g, (m, rel) => {
  try {
    // src 形如 evidence/current-pages/x.png 或 <area>/evidence/...；在 root 下自动探测其真实位置
    // existsSync 已在顶部 import
    let fp = null;
    for (const cand of [join(root, rel), join(root, 'docs/plans', rel), join(root, 'docs/plans', 'openapi-workers', rel)]) {
      if (existsSync(cand)) { fp = cand; break; }
    }
    if (!fp) { console.error('  ⚠ 未找到', rel); return m; }
    const b64 = readFileSync(fp).toString('base64');
    n++;
    return `"src":"data:image/png;base64,${b64}"`;
  } catch { return m; }
});
if (html.includes('\u0000S\u0000') || /\\u0000S\\u0000/.test(html)) {
  console.error('✖ 发现未还原的哨兵(\\u0000S\\u0000)——重新用哨兵法生成 spec 后再 build');
  process.exit(1);
}
writeFileSync(file, html);
console.log(`✔ 内嵌截图 ${n} 张；哨兵校验通过；size ${(html.length / 1024).toFixed(0)}KB`);
