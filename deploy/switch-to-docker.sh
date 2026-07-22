#!/usr/bin/env bash
# Frontend ko static-files se Docker container par le jata hai.
#   sudo bash deploy/switch-to-docker.sh
# Tarteeb jaan boojh kar aisi hai: nginx ko tab hi chheda jata hai jab container
# pehle se sahi jawab de raha ho. Container na chale to config waisi ki waisi rehti hai.
set -euo pipefail

SITE=/etc/nginx/sites-available/wealthcrop-frontend
OLD_ROOT=/var/www/wealthcrop-frontend

command -v docker >/dev/null || {
  echo "== docker install =="
  apt-get update -qq && apt-get install -y docker.io docker-compose-v2
}

echo "== container chalu =="
cd /home/ubuntu/wealthcrop_frontendV2
docker compose up -d
sleep 5

echo "== container verify (nginx isse pehle nahi chhera jayega) =="
if ! curl -fsS --max-time 10 http://127.0.0.1:8080/ | grep -q 'id="root"'; then
  echo "!! container 8080 par sahi jawab nahi de raha. nginx waisa hi hai, kuch nahi toota."
  docker compose ps
  docker compose logs --tail 40 web
  exit 1
fi
echo "ok — container index.html serve kar raha hai"

BACKUP="$SITE.bak-$(date +%Y%m%d-%H%M%S)"
cp -a "$SITE" "$BACKUP"
echo "== nginx backup: $BACKUP =="

cat >"$SITE" <<'NGINX'
server {
    server_name wealthcrop.co.in www.wealthcrop.co.in;

    # Certbot ka HTTP-01 challenge purane webroot se hi serve hota rahe,
    # warna kuch hafton baad cert renewal chup chaap fail hone lagega.
    location /.well-known/acme-challenge/ {
        root /var/www/wealthcrop-frontend;
    }

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/wealthcrop.co.in/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/wealthcrop.co.in/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = www.wealthcrop.co.in) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    if ($host = wealthcrop.co.in) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name wealthcrop.co.in www.wealthcrop.co.in;
    return 404; # managed by Certbot
}
NGINX

echo "== nginx -t =="
if ! nginx -t; then
  echo "!! config galat — purani wapas laga raha hoon"
  cp -a "$BACKUP" "$SITE"
  nginx -t
  exit 1
fi

systemctl reload nginx
echo "== nginx reload ho gaya =="

# purana rasta band: ab deploy container ke through hota hai
systemctl disable --now wc-frontend.timer 2>/dev/null || true
echo "purana wc-frontend.timer band kar diya"

echo
echo "verify: curl -sI https://wealthcrop.co.in | head -1"
echo "rollback: cp -a $BACKUP $SITE && nginx -t && systemctl reload nginx && systemctl enable --now wc-frontend.timer"
