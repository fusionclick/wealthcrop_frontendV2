#!/usr/bin/env bash
# OBSOLETE for normal deploys — /api/bse ab container nginx (deploy/nginx.conf) mein hai.
# CI image push + wc-image-update.timer se auto aa jata hai; SSH ki zaroorat nahi.
# Ye script sirf emergency host-nginx fallback ke liye rakha hai.
#   sudo bash deploy/add-bse-nginx-proxy.sh
set -euo pipefail

SITE=/etc/nginx/sites-available/wealthcrop-frontend
NODE=http://13.203.216.202:3000

if [ ! -f "$SITE" ]; then
  echo "!! $SITE nahi mila"
  exit 1
fi

if grep -q 'location /api/bse/' "$SITE"; then
  echo "ok — /api/bse/ pehle se hai"
else
  BACKUP="$SITE.bak-bse-$(date +%Y%m%d-%H%M%S)"
  cp -a "$SITE" "$BACKUP"
  echo "backup: $BACKUP"

  # Insert /api/bse/ block right before the catch-all location /
  python3 - <<'PY' "$SITE" "$NODE"
import sys
path, node = sys.argv[1], sys.argv[2]
text = open(path).read()
block = f"""
    # ponytail: HTTPS → Node BSE
    location /api/bse/ {{
        proxy_pass {node}/api/;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_connect_timeout 10s;
    }}

"""
marker = "    location / {"
if marker not in text:
    raise SystemExit("location / {{ not found — manual edit needed")
text = text.replace(marker, block + marker, 1)
open(path, "w").write(text)
print("inserted /api/bse/")
PY
fi

nginx -t
systemctl reload nginx
echo "verify: curl -sS -X POST https://wealthcrop.co.in/api/bse/master-scheme-list -H 'Content-Type: application/json' -d '{\"start\":0,\"length\":1}' | head -c 200"
