#!/usr/bin/env node
// build-excalidraw.mjs — .excalidraw 场景 → 可嵌入单文件 HTML
// 用法: node build-excalidraw.mjs <scene.excalidraw> <out.html> [--title 标题] [--deps <node_modules 目录，默认 /tmp/ztocc-diagram>]
// 依赖目录需有 react/react-dom/@excalidraw/excalidraw/esbuild（pnpm add 一次）
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const args = process.argv.slice(2);
const sceneFile = args[0], outFile = args[1];
if (!sceneFile || !outFile) { console.error('usage: node build-excalidraw.mjs <scene.excalidraw> <out.html> [--title t] [--deps dir]'); process.exit(1); }
const tIdx = args.indexOf('--title'); const title = tIdx > -1 ? args[tIdx + 1] : '系统架构图（可编辑）';
const dIdx = args.indexOf('--deps'); const deps = dIdx > -1 ? resolve(args[dIdx + 1]) : '/tmp/ztocc-diagram';
const scene = readFileSync(sceneFile, 'utf8');
const require = createRequire(resolve(deps, 'noop.js'));
const esbuild = require('esbuild');

const entry = `
import React from "react";
import { createRoot } from "react-dom/client";
import { Excalidraw, exportToBlob } from "@excalidraw/excalidraw";
const scene = JSON.parse(window.__SCENE__);
let api = null;
function dl(url, name){ const a=document.createElement("a"); a.href=url; a.download=name; a.click(); }
function App(){
  return React.createElement("div", { style: { height: "100%", display: "flex", flexDirection: "column" } },
    React.createElement("div", { style: { background: "#1b1f27", color: "#fff", padding: "8px 14px", display: "flex", gap: "10px", alignItems: "center", fontSize: "13px" } },
      React.createElement("b", null, ${JSON.stringify(title)}),
      React.createElement("span", { style: { color: "#9fb0c9" } }, "拖动/缩放/编辑"),
      React.createElement("span", { style: { flex: 1 } }),
      React.createElement("button", { onClick: async () => { if (!api) return; const els = api.getSceneElements(); const blob = await exportToBlob({ elements: els, appState: { exportBackground: true, viewBackgroundColor: "#ffffff" }, files: api.getFiles(), mimeType: "image/png" }); dl(URL.createObjectURL(blob), "diagram.png"); }, style: { background: "#4c6ef5", color: "#fff", border: 0, borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontWeight: 600 } }, "导出 PNG"),
      React.createElement("button", { onClick: () => { const els = api ? api.getSceneElements() : scene.elements; dl(URL.createObjectURL(new Blob([JSON.stringify({ type: "excalidraw", version: 2, source: "jt-design-review", elements: els }, null, 1)], { type: "application/json" })), "diagram.edited.excalidraw"); }, style: { background: "#3b4252", color: "#cbd2dc", border: 0, borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontWeight: 600 } }, "导出 .excalidraw")),
    React.createElement("div", { style: { flex: 1, minHeight: 0 } },
      React.createElement(Excalidraw, { initialData: { elements: scene.elements, appState: { viewBackgroundColor: "#ffffff", zoom: { value: 0.5 } } }, excalidrawAPI: (a) => { api = a; }, theme: "light" })));
}
createRoot(document.getElementById("app")).render(React.createElement(App));
`;

await esbuild.build({
  stdin: { contents: entry, resolveDir: deps, loader: 'jsx' },
  bundle: true, minify: true, outfile: outFile + '.tmp.js', jsx: 'automatic',
  define: { 'process.env.IS_PREACT': 'false' },
});
const js = readFileSync(outFile + '.tmp.js', 'utf8');
const page = `<!DOCTYPE html><html lang="zh"><head><meta charset="utf-8"><title>${title}</title>
<script>window.__SCENE__ = ${JSON.stringify(JSON.parse(scene))};</script>
<style>html,body{margin:0;height:100%}#app{height:100vh}</style></head>
<body><div id="app"></div><script>${js}</script></body></html>`;
writeFileSync(outFile, page);
console.log(`✔ ${outFile} (${(page.length / 1024).toFixed(0)}KB)`);
