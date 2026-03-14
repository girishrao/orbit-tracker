#!/usr/bin/env node
// Copies CesiumJS static assets to public/cesium so they're served at /cesium/
const { cpSync, mkdirSync } = require("fs");
const { join } = require("path");

const root = join(__dirname, "..");
const src = join(root, "node_modules", "cesium", "Build", "Cesium");
const dest = join(root, "public", "cesium");

mkdirSync(dest, { recursive: true });

for (const dir of ["Workers", "Assets", "Widgets", "ThirdParty"]) {
  cpSync(join(src, dir), join(dest, dir), { recursive: true });
}

console.log("✓ CesiumJS static assets copied to public/cesium/");
