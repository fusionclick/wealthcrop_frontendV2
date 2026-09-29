// The cache policy has been lost twice — applied to the live .htaccess on 20 Sep and again
// on 29 Sep, wiped both times by the very next deploy.
//
// The mechanism: Vite copies public/.htaccess into dist/, and deploy-wealthcrop.mjs does
// uploadFromDir(dist, /public_html), which overwrites whatever is on the server. So a
// server-side edit survives exactly until someone ships a frontend change, and the symptom
// — QA seeing a pre-deploy page for hours — looks nothing like its cause.
//
// This pins the policy in the repo, which is the only copy that survives a deploy.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const htaccess = readFileSync("public/.htaccess", "utf8");

test("index.html is never cached", () => {
  // It is the only unhashed file and it points at every hashed one, so a cached index.html
  // pins the whole app to an old build.
  assert.match(htaccess, /<FilesMatch "\^index\\.html\$">/);
  assert.match(htaccess, /Header set Cache-Control "no-store/);
});

test("fingerprinted assets are cached hard", () => {
  // Vite renames on every content change, so the old name is simply never requested again.
  assert.match(htaccess, /Header set Cache-Control "public, max-age=31536000, immutable"/);
});

test("the rules that make the app work at all are still there", () => {
  // Same file, and losing either of these is worse than losing the cache policy.
  assert.match(htaccess, /RewriteRule \^api\/bse\/\?\(\.\*\)\$ \/api\/bse\/index\.php/, "the BSE proxy rule");
  assert.match(htaccess, /RewriteRule \. \/index\.html \[L\]/, "the SPA fallback");
  assert.match(htaccess, /AddHandler application\/x-httpd-ea-php83___lsphp/, "cPanel's PHP handler");
});
