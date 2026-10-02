import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("frontend auto-update unit cannot overwrite backend", () => {
  const script = readFileSync("deploy/install-autoupdate.sh", "utf8");
  assert.match(script, /wc-frontend-image-update/);
  assert.doesNotMatch(script, /cat >\/etc\/systemd\/system\/wc-image-update\.service/);
});

test("SPA HTML is never served from a stale browser cache", () => {
  const nginx = readFileSync("deploy/nginx.conf", "utf8");
  assert.match(nginx, /Cache-Control "no-store"/);
});

test("BSE proxy uses the backend private address for HTTP and sockets", () => {
  const nginx = readFileSync("deploy/nginx.conf", "utf8");
  assert.match(nginx, /proxy_pass http:\/\/172\.31\.10\.161:3000\/api\/;/);
  assert.match(nginx, /proxy_pass http:\/\/172\.31\.10\.161:3000\/api\/socket\.io;/);
  assert.doesNotMatch(nginx, /13\.203\.216\.202/);
});
