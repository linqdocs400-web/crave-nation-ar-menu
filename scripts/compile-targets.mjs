/*
 * Compiles MindAR image targets (.mind) in Node.
 *
 * The sub-trees in mind-ar's offline compiler need the `canvas` npm package,
 * which often fails to build natively on Node 22+ (node-gyp). We only need to
 * draw images on 2D canvases, so we replace `node_modules/canvas` with a thin
 * shim that forwards to the prebuilt `@napi-rs/canvas` binary, then run the
 * OfflineCompiler as usual.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();

function setupCanvasShim() {
  const canvasDir = path.join(ROOT, 'node_modules', 'canvas');
  fs.mkdirSync(canvasDir, { recursive: true });
  fs.writeFileSync(
    path.join(canvasDir, 'package.json'),
    JSON.stringify({ name: 'canvas', version: '0.0.0-shim', type: 'module', main: 'index.mjs' }, null, 2)
  );
  fs.writeFileSync(
    path.join(canvasDir, 'index.mjs'),
    "import * as napi from '@napi-rs/canvas';\nexport const createCanvas = napi.createCanvas;\nexport const loadImage = napi.loadImage;\nexport default napi;\n"
  );
}

setupCanvasShim();

// mind-ar package has an integeral package.json (no exports map), so a direct
// file URL import works fine once the shim is in place.
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

// Each compiled entry maps 1:1 to the characteristics in TARGETS.
fs.mkdirSync(path.join(ROOT, 'public/targets'), { recursive: true });
const data = await compiler.exportData();
const outPath = path.join(ROOT, 'public/targets', 'menu.mind');
fs.writeFileSync(outPath, data);
console.log(`wrote ${outPath} (${(data.length / 1024).toFixed(0)} kb)`);
console.log('done');
