#!/usr/bin/env bash
# Frontend EC2 par SIRF EK BAAR:  sudo bash deploy/ec2-setup.sh
# nginx config ko haath nahi lagta — sirf uske web root ki files refresh hoti hain.
# Iske baad box par build karne ki zaroorat nahi: CI build karke `build` branch par daalta hai.
set -euo pipefail

REPO=https://github.com/fusionclick/wealthcrop_frontendV2.git   # public, koi auth nahi
WORK=/opt/wc-dist                                               # root ka, taake git "dubious ownership" na de

# ---- web root khud dhoondo: wahi dir jisme deployed Vite build para hai ----
detect_root() {
  local c
  for c in $(nginx -T 2>/dev/null | sed -nE 's/^[[:space:]]*root[[:space:]]+([^;]+);.*/\1/p' | sort -u) \
           /home/ubuntu/wealthcrop_frontendV2/dist /var/www/html /var/www/wealthcrop /usr/share/nginx/html; do
    if [ -f "$c/index.html" ] && [ -d "$c/assets" ] && grep -q '/assets/' "$c/index.html"; then
      echo "$c"; return 0
    fi
  done
  return 1
}

if ! WEB_ROOT=$(detect_root); then
  echo "!! web root nahi mila — kuch change nahi kiya. Ye output bhej do:"
  echo "--- nginx ---"; nginx -T 2>&1 | grep -E "^\s*(root|server_name|listen)" || echo "(nginx config nahi)"
  echo "--- ports ---"; ss -tlnp | grep -E ':(80|443)' || true
  echo "--- pm2 ---";   su - ubuntu -c 'pm2 ls' 2>/dev/null || echo "(pm2 nahi)"
  exit 1
fi
echo "web root mila: $WEB_ROOT"

# pehla deploy live files replace karega — pehle unki copy rakh lo
BACKUP="/opt/webroot-backup-$(date +%Y%m%d-%H%M%S)"
cp -a "$WEB_ROOT" "$BACKUP"
echo "backup: $BACKUP   (wapas karna ho to: rsync -a --delete $BACKUP/ $WEB_ROOT/)"

[ -d "$WORK/.git" ] || git clone --depth 1 -b build "$REPO" "$WORK"

cat >/usr/local/bin/wc-frontend-deploy <<EOF
#!/usr/bin/env bash
set -euo pipefail
cd "$WORK"
git fetch --quiet --depth 1 origin build
TARGET=\$(git rev-parse origin/build)

# "pehle se deployed hai?" ka jawab WEB ROOT se aata hai, git state se nahi.
# Warna fresh clone HEAD==origin/build hota hai aur pehla deploy skip ho jata hai.
if [ "\$(cat "$WEB_ROOT/.deployed-sha" 2>/dev/null || true)" = "\$TARGET" ]; then
  exit 0
fi

git reset --hard origin/build --quiet
# --delete taake purane hashed assets jama na hon.
# .well-known kabhi mat mitao — certbot ka HTTPS renewal usi par chalta hai.
rsync -a --delete --exclude .git --exclude .well-known ./ "$WEB_ROOT/"
echo "\$TARGET" > "$WEB_ROOT/.deployed-sha"
echo "deployed \${TARGET:0:7}"
EOF
chmod +x /usr/local/bin/wc-frontend-deploy

cat >/etc/systemd/system/wc-frontend.service <<'EOF'
[Unit]
Description=WealthCrop frontend auto-deploy
[Service]
Type=oneshot
ExecStart=/usr/local/bin/wc-frontend-deploy
EOF

cat >/etc/systemd/system/wc-frontend.timer <<'EOF'
[Unit]
Description=WealthCrop frontend auto-deploy every minute
[Timer]
OnBootSec=1min
OnUnitActiveSec=1min
[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable --now wc-frontend.timer

echo "--- pehla deploy chala kar dekhte hain ---"
/usr/local/bin/wc-frontend-deploy
echo "done. logs: journalctl -u wc-frontend -f"
