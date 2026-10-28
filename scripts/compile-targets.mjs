/*
 * Compiles MindAR image targets (.mind) in Node.
 *
 * mind-ar's offline compiler imports the native `canvas` package, which often
 * fails to build (node-gyp/pixman/cairo) — especially on CI like Vercel. So
 * package.json overrides it with the fully-prebuilt @napi-rs/canvas binary:
 *
 *   "overrides": { "mind-ar": { "canvas": "npm:@napi-rs/canvas@^1.0.13" } }
 *
 * The aliased copy lands in node_modules/mind-ar/node_modules/canvas, which is
 * exactly what mind-ar's `import 'canvas'` resolves to. This script draws with
 * @napi-rs/canvas directly (devDependency). Deploy builds never run this —
 * the compiled public/targets/menu.mind is committed.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();

const compilerUrl = pathToFileURL(path.join(ROOT, 'node_modules/mind-ar/src/image-target/offline-compiler.js')).href;
const { OfflineCompiler } = await import(compilerUrl);
const { loadImage } = await import('@napi-rs/canvas');

const TARGETS = [
  { name: 'menu', file: 'public/images/menu.jpg' },
];

const compiler = new OfflineCompiler();
const inputs = [];
for (const t of TARGETS) {
  const img = await loadImage(path.join(ROOT, t.file));
  inputs.push(img);
  console.log(`loaded ${t.file} ${img.width}x${img.height}`);
}

console.log('compiling image targets (this can take a while)...');
await compiler.compileImageTargets(inputs, (p) => process.stdout.write(`\r  ${Math.round(p)}%`));
process.stdout.write('\n');

// Each compiled entry maps 1:1 to the entries in TARGETS.
fs.mkdirSync(path.join(ROOT, 'public/targets'), { recursive: true });
const data = await compiler.exportData();
const outPath = path.join(ROOT, 'public/targets', 'menu.mind');
fs.writeFileSync(outPath, data);
console.log(`wrote ${outPath} (${(data.length / 1024).toFixed(0)} kb)`);
console.log('done');
