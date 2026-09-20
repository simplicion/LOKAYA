const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROFILE = 'simplicion';
const REGION = 'us-east-1';
const INSTANCE_ID = 'i-09f7f4e8ae6805420';

function runAws(cmd) {
  return execSync(`aws ${cmd} --profile ${PROFILE} --region ${REGION} --no-cli-pager --output json`, {
    encoding: 'utf8',
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
  });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function executeRemote(commands) {
  const paramFile = path.join(__dirname, 'ssm-params.json');
  fs.writeFileSync(paramFile, JSON.stringify({ commands }));
  
  const sendRes = JSON.parse(execSync(`aws ssm send-command --profile ${PROFILE} --region ${REGION} --instance-ids "${INSTANCE_ID}" --document-name "AWS-RunShellScript" --parameters "file://${paramFile.replace(/\\/g, '/')}" --output json`, {
    encoding: 'utf8',
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
  }));
  
  const cmdId = sendRes.Command.CommandId;
  console.log(`Sent SSM command ${cmdId}, waiting for execution...`);

  for (let i = 0; i < 20; i++) {
    await sleep(3000);
    const invRes = JSON.parse(execSync(`aws ssm get-command-invocation --profile ${PROFILE} --region ${REGION} --command-id "${cmdId}" --instance-id "${INSTANCE_ID}" --output json`, {
      encoding: 'utf8',
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' }
    }));
    
    if (invRes.Status === 'Success' || invRes.Status === 'Failed' || invRes.Status === 'TimedOut' || invRes.Status === 'Cancelled') {
      console.log(`Status: ${invRes.Status}`);
      console.log('--- STDOUT ---');
      console.log(invRes.StandardOutputContent);
      console.log('--- STDERR ---');
      console.log(invRes.StandardErrorContent);
      return invRes;
    }
    console.log(`Current status: ${invRes.Status}...`);
  }
}

async function main() {
  await executeRemote([
    // 1. Generate self-signed cert for EC2 origin
    'sudo mkdir -p /etc/nginx/ssl',
    'sudo openssl req -x509 -nodes -days 3650 -newkey rsa:2048 -keyout /etc/nginx/ssl/selfsigned.key -out /etc/nginx/ssl/selfsigned.crt -subj "/CN=lokaya.shop"',
    // 2. Configure Nginx for both 80 and 443
    `cat << 'NGINX_CONF' | sudo tee /etc/nginx/sites-available/lokaya
# User Application: lokaya.shop & www.lokaya.shop
server {
    listen 80;
    listen 443 ssl;
    server_name lokaya.shop www.lokaya.shop;

    ssl_certificate /etc/nginx/ssl/selfsigned.crt;
    ssl_certificate_key /etc/nginx/ssl/selfsigned.key;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3101;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Admin Portal: admin.lokaya.shop
server {
    listen 80;
    listen 443 ssl;
    server_name admin.lokaya.shop;

    ssl_certificate /etc/nginx/ssl/selfsigned.crt;
    ssl_certificate_key /etc/nginx/ssl/selfsigned.key;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3102;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Backend API: api.lokaya.shop
server {
    listen 80;
    listen 443 ssl;
    server_name api.lokaya.shop;

    ssl_certificate /etc/nginx/ssl/selfsigned.crt;
    ssl_certificate_key /etc/nginx/ssl/selfsigned.key;

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
NGINX_CONF`,
    'sudo systemctl daemon-reload && sudo systemctl restart nginx',
    'sleep 2',
    'curl -k -i -H "Host: lokaya.shop" https://127.0.0.1/ | head -n 15',
    'curl -k -i -H "Host: admin.lokaya.shop" https://127.0.0.1/ | head -n 15',
    'curl -k -i -H "Host: api.lokaya.shop" https://127.0.0.1/health'
  ]);
}

main().catch(console.error);
