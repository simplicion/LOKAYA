#!/bin/bash
# ==============================================================================
# Lokaya Production EC2 Bootstrap & Zero-Downtime Docker Setup Script
# Target OS: Ubuntu 22.04 / 24.04 LTS (x86_64 or ARM64)
# ==============================================================================
set -e

echo "================================================================================"
echo "🚀 Starting Lokaya EC2 Production Bootstrap..."
echo "================================================================================"

# 1. Update and install prerequisites
echo "📦 [1/6] Updating system packages & installing dependencies..."
sudo apt-get update -y
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release ufw nginx git

# 2. Configure 2GB Swap Memory for 1GB RAM Free Tier instances (Prevents OOM Crashes)
echo "💾 [2/6] Configuring 2GB Swapfile for memory resilience..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    sudo sysctl vm.swappiness=10
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    echo "✅ 2GB Swap enabled successfully."
else
    echo "ℹ️ Swapfile already exists. Skipping."
fi

# 3. Install Docker Engine & Docker Compose Plugin
echo "🐳 [3/6] Installing Docker Engine & Docker Compose..."
if ! command -v docker &> /dev/null; then
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo usermod -aG docker $USER
    echo "✅ Docker installed successfully."
fi

# 4. Prepare /opt/lokaya deployment workspace
echo "📁 [4/6] Setting up /opt/lokaya directory & production environment..."
sudo mkdir -p /opt/lokaya
sudo chown -R $USER:$USER /opt/lokaya
cd /opt/lokaya

cat << 'ENVEOF' | sudo tee /opt/lokaya/.env > /dev/null
NODE_ENV=production
PORT=4002

DATABASE_URL=postgresql://lokaya_user:e0137DxFhGt00xXfJZaTvgMm77IHVTvs@dpg-daigdi7qj5pc73a0ns5g-a.oregon-postgres.render.com/lokaya?sslmode=require
DIRECT_URL=postgresql://lokaya_user:e0137DxFhGt00xXfJZaTvgMm77IHVTvs@dpg-daigdi7qj5pc73a0ns5g-a.oregon-postgres.render.com/lokaya?sslmode=require

REDIS_URL=rediss://red-dafi1ftbedkc739bbovg:YP3C2SCtDTlvZL2un0PgQ12OUAiSlcud@virginia-keyvalue.render.com:6379
REDIS_HOST=virginia-keyvalue.render.com
REDIS_PORT=6379
REDIS_USERNAME=red-dafi1ftbedkc739bbovg
REDIS_PASSWORD=YP3C2SCtDTlvZL2un0PgQ12OUAiSlcud
REDIS_TLS=true

JWT_SECRET=cce165b61b8a327dba615226ec9d266e4401434b552aa7b36eb5125e378ac0a0
JWT_REFRESH_SECRET=0288403b131b825471e4122027b90c31f29cedaf84b37d34d78de2db79ee0094
SUPER_ADMIN_JWT_SECRET=93a5fca43bd1644fa9b08aa171d8591119c2b54050f9122fd6938be7eb86a0ca

CLIENT_URL=https://lokaya.shop
FRONTEND_URL=https://lokaya.shop,https://www.lokaya.shop,https://admin.lokaya.shop,http://localhost:3101
ADMIN_URL=https://admin.lokaya.shop
APP_BASE_URL=https://api.lokaya.shop
BACKEND_API_URL=https://api.lokaya.shop/api/v1

ADMIN_EMAIL=admin@lokaya.shop
ADMIN_PASSWORD=AdminPassword123!

GOOGLE_CLIENT_ID=924762867355-6lfudinvj763rl4usv256svhtu3muemi.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

RAZORPAY_KEY_ID=rzp_live_TJ4cJdMCagilvq
RAZORPAY_KEY_SECRET=c5RbhL5k0DIQKTDOQot3cyei
RAZORPAY_WEBHOOK_SECRET=whsec_lokaya_live_2026_x8F2n9Lp4Qv7Mw1A
RAZORPAY_WEBHOOK_URL=https://api.lokaya.shop/api/v1/payments/webhook

CLOUDFLARE_ACCOUNT_ID=7158d01d5e0dd9e7f5be050ed3717b14
R2_ACCOUNT_ID=7158d01d5e0dd9e7f5be050ed3717b14
R2_ACCESS_KEY_ID=0fc5788e73739c590c9458c2953ebcb1
R2_ACCESS_KEY=0fc5788e73739c590c9458c2953ebcb1
R2_SECRET_ACCESS_KEY=6acdb20aa6540405077e90c99b96de2fd2148edc3058f0c09a1edf770dfa275a
R2_SECRET_KEY=6acdb20aa6540405077e90c99b96de2fd2148edc3058f0c09a1edf770dfa275a
R2_BUCKET_NAME=lokaya-cdn
R2_ENDPOINT=https://7158d01d5e0dd9e7f5be050ed3717b14.r2.cloudflarestorage.com
NEXT_PUBLIC_CDN_DOMAIN=https://7158d01d5e0dd9e7f5be050ed3717b14.r2.cloudflarestorage.com/lokaya-cdn

AWS_REGION=us-east-1
AWS_S3_RAW_BUCKET=lokaya-cdn
AWS_S3_PROCESSED_BUCKET=lokaya-cdn

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=simplicion.com@gmail.com
SMTP_PASS=vbaqzpfnslttmcaf
SMTP_SECURE=true
SMTP_FROM_EMAIL=noreply@lokaya.shop
EMAIL_FROM=Lokaya <noreply@lokaya.shop>
ENVEOF

sudo chmod 600 /opt/lokaya/.env
sudo chown $USER:$USER /opt/lokaya/.env
echo "✅ /opt/lokaya/.env created successfully."

# 5. Configure Nginx Reverse Proxy for api.lokaya.shop with WebSockets
echo "🌐 [5/6] Configuring Nginx for api.lokaya.shop..."
cat << 'EOF' | sudo tee /etc/nginx/sites-available/api.lokaya.shop
server {
    listen 80;
    server_name api.lokaya.shop;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:4002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/api.lokaya.shop /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# 6. Configure Firewall
echo "🛡️ [6/6] Configuring UFW Firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo "================================================================================"
echo "🎉 Lokaya EC2 Production Bootstrap Completed Successfully!"
echo "Next Steps:"
echo "1. Place your .env file at: /opt/lokaya/.env"
echo "2. Place your docker-compose.prod.yml at: /opt/lokaya/docker-compose.yml"
echo "3. Run: docker compose pull && docker compose up -d"
echo "================================================================================"
