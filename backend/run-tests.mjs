#!/usr/bin/env node
/**
 * Run backend tests with node --test. Ensures correct file discovery on all platforms.
 */
import { run } from "node:test";
import { spec } from "node:test/reporters";
import { readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const testsDir = join(__dirname, "__tests__");

function collectTestFiles(dir, files = []) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) collectTestFiles(full, files);
    else if (ent.name.endsWith(".test.js")) files.push(resolve(full));
  }
  return files;
}

const filter = process.argv[2]; // "unit" | "integration" | undefined
let paths = collectTestFiles(testsDir);
if (filter === "unit") paths = paths.filter((p) => p.includes("lib"));
else if (filter === "integration") paths = paths.filter((p) => p.includes("integration"));

const stream = run({ files: paths });
stream.compose(spec).pipe(process.stdout);
