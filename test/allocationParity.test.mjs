import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

// ponytail: vendored math keeps three independent repositories deployable; publish a
// shared package only when these rules need independent versioned releases.
const backend = new URL('../../Backend/src/mf/', import.meta.url);
test('browser allocation and scheduled review use identical allocation rules', { skip: !existsSync(backend) }, () => {
  for (const name of ['mpt', 'allocation']) {
    const server = readFileSync(new URL(`${name}.mjs`, backend), 'utf8').replace('"./mpt.mjs"', '"./mpt.js"').replaceAll('\r\n', '\n');
    const browser = readFileSync(new URL(`../src/utils/${name}.js`, import.meta.url), 'utf8').replaceAll('\r\n', '\n');
    assert.equal(browser, server, `Sync ${name} rules before releasing either repository.`);
  }
});
