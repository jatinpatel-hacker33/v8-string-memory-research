/**
 * node-repro.js — a runnable, independent cross-check of the substring
 * memory-retention behavior described in README.md, using Node.js's
 * embedded V8 (a different V8 host embedding than the Chrome build the
 * original observations in this repo were made against).
 *
 * This does NOT reproduce the exact Chrome/V8 revision or methodology used
 * for the Key Observations section above — it is a separate, smaller,
 * independently-runnable test added so the repo has at least one experiment
 * anyone can execute and verify themselves, rather than relying solely on
 * narrative description.
 *
 * Usage:
 *   node --expose-gc node-repro.js
 *
 * (--expose-gc is required: without it, global.gc() is unavailable and the
 * script will fall back to an unforced measurement, which is noisier.)
 */

'use strict';

const PARENT_SIZE_MB = 4;
const PARENT_LENGTH = PARENT_SIZE_MB * 1024 * 1024; // ~4,194,304 chars

function heapMB() {
  return process.memoryUsage().heapUsed / (1024 * 1024);
}

function forceGcIfAvailable() {
  if (typeof global.gc === 'function') {
    global.gc();
    return true;
  }
  return false;
}

function runTrial(label, substringLength) {
  const gcAvailable = forceGcIfAvailable();
  const baseline = heapMB();

  // Build a large parent string, deliberately not a literal so V8 can't
  // constant-fold it away.
  let parent = '';
  for (let i = 0; i < PARENT_LENGTH / 1024; i++) {
    parent += 'x'.repeat(1024);
  }
  const afterParent = heapMB();

  // Take a short substring, then drop the parent reference.
  let child = parent.slice(0, substringLength);
  parent = null; // eslint-disable-line no-unused-vars

  const afterSlice = heapMB();
  forceGcIfAvailable();
  const afterGc = heapMB();

  console.log(`\n[${label}] substring length = ${substringLength}, gc available = ${gcAvailable}`);
  console.log(`  baseline heap:            ${baseline.toFixed(2)} MB`);
  console.log(`  after building ${PARENT_SIZE_MB}MB parent: ${afterParent.toFixed(2)} MB (delta ${(afterParent - baseline).toFixed(2)} MB)`);
  console.log(`  after slice + drop parent: ${afterSlice.toFixed(2)} MB`);
  console.log(`  after forced GC:           ${afterGc.toFixed(2)} MB (delta from peak: ${(afterGc - afterParent).toFixed(2)} MB)`);

  // Keep `child` alive through the measurement so V8 can't collect it early
  // and so the variable isn't flagged unused by a stricter linter.
  return { label, substringLength, baseline, afterParent, afterSlice, afterGc, childLength: child.length };
}

console.log('V8 (Node.js) substring memory-retention cross-check');
console.log(`Node version: ${process.version}, platform: ${process.platform} ${process.arch}`);

const results = [
  runTrial('short-substring', 10),   // below the ~13-char boundary cited in README.md
  runTrial('long-substring', 5000),  // well above it
];

console.log('\nSummary:');
for (const r of results) {
  const retainedMB = r.afterGc - r.baseline;
  console.log(`  ${r.label}: heap retained after GC vs baseline = ${retainedMB.toFixed(2)} MB`);
}

console.log(
  '\nNote: this is a heap-size measurement, not a retaining-path proof (no heap snapshot was ' +
  'taken). It shows whether overall reported heap usage returns toward baseline after the parent ' +
  'reference is dropped and GC runs — consistent with, but not independent proof of, the ' +
  'SlicedString-retention mechanism described in README.md for the original Chrome-based tests.'
);
