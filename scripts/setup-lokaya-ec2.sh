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
echo "📁 [4/6] Setting up /opt/lokaya directory..."
sudo mkdir -p /opt/lokaya
sudo chown -R $USER:$USER /opt/lokaya
cd /opt/lokaya

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
