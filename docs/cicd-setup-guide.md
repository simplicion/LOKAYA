# 🚀 Lokaya Production Container Registry, CI/CD & Deployment Guide

This guide documents the production multi-stage Docker containerization, automated GitHub Container Registry (GHCR) publishing, and centralized deployment pipeline for the **Backend API**, **User Application**, and **Admin Web Portal**.

---

## 1. Architecture & Container Registry Matrix

All three applications are packaged as multi-stage, hardened Docker containers and automatically published to GitHub Container Registry (GHCR):

| Application | Monorepo Path | Production Dockerfile | GHCR Container Image Tag | Target Platforms |
| :--- | :--- | :--- | :--- | :--- |
| **Backend API** | `apps/backend` | [`Dockerfile.backend`](file:///c:/Users/saavi/Desktop/LOKAYA/Dockerfile.backend) | `ghcr.io/prince364133/lokaya-backend:latest` | AWS EC2 (Docker/SSM), ECS, Kubernetes |
| **User Web App** | `apps/user-app/web` | [`Dockerfile.user-app`](file:///c:/Users/saavi/Desktop/LOKAYA/Dockerfile.user-app) | `ghcr.io/prince364133/lokaya-user-app:latest` | GHCR, Cloudflare Pages, AWS EC2 / Docker |
| **Admin Web Portal** | `apps/admin-web` | [`Dockerfile.admin-web`](file:///c:/Users/saavi/Desktop/LOKAYA/Dockerfile.admin-web) | `ghcr.io/prince364133/lokaya-admin-web:latest` | GHCR, Cloudflare Pages, AWS EC2 / Docker |

---

## 2. Docker Architecture Features

1. **Next.js Standalone Mode**:
   - `output: 'standalone'` in Next.js bundles only traced dependencies and files.
   - Shrinks web image sizes from ~1.5GB to ~120-150MB.
2. **Layer Caching**:
   - Manifest files (`package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `turbo.json`) are copied and installed first.
   - GitHub Actions leverages GitHub Actions Cache (`type=gha,mode=max`) for lightning-fast sub-minute builds.
3. **Security & Non-Root Execution**:
   - Dedicated unprivileged runtime user (`nextjs:nodejs`, UID 1001).
   - Read-only container root support.
4. **Built-in Health Checks**:
   - Backend: `curl -f http://localhost:4002/health`
   - User App: `curl -f http://localhost:3000/`
   - Admin App: `curl -f http://localhost:3000/`

---

## 3. Running Production Containers Locally or on VM

You can pull and run all three containers with a single command using [`docker-compose.prod.yml`](file:///c:/Users/saavi/Desktop/LOKAYA/docker-compose.prod.yml):

```bash
# 1. Log in to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u <YOUR_GITHUB_USERNAME> --password-stdin

# 2. Pull the latest images for all 3 apps
docker compose -f docker-compose.prod.yml pull

# 3. Start the production stack in the background
docker compose -f docker-compose.prod.yml up -d

# 4. Check service health
docker compose -f docker-compose.prod.yml ps
```

### Direct Docker Run Commands:
```bash
# Backend (Port 4002)
docker run -d --name lokaya-backend -p 4002:4002 --env-file /opt/lokaya/.env ghcr.io/prince364133/lokaya-backend:latest

# User App (Port 3101)
docker run -d --name lokaya-user-app -p 3101:3000 ghcr.io/prince364133/lokaya-user-app:latest

# Admin App (Port 3102)
docker run -d --name lokaya-admin-web -p 3102:3000 ghcr.io/prince364133/lokaya-admin-web:latest
```

---

## 4. GitHub Repository Secrets Reference

Configured in **Repository Settings ➔ Secrets and variables ➔ Actions**:

| Secret Name | Service | Purpose |
| :--- | :--- | :--- |
| `AWS_ACCESS_KEY_ID` | AWS IAM | IAM user access key for EC2 SSM execution |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM | IAM user secret access key |
| `AWS_REGION` | AWS | AWS region (e.g. `ap-south-1` or `us-east-1`) |
| `AWS_EC2_INSTANCE_ID` | AWS EC2 | Target EC2 instance ID |
| `CLOUDFLARE_API_TOKEN` | Cloudflare | API Token with Pages Edit permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare | Cloudflare Account ID |
| `NEXT_PUBLIC_API_URL` | Frontend | Production backend API endpoint (`https://api.lokaya.com/api/v1`) |
| `NEXT_PUBLIC_SOCKET_URL` | Frontend | WebSocket endpoint (`https://api.lokaya.com`) |
| `NEXT_PUBLIC_CDN_DOMAIN` | Frontend | Cloudflare R2 / S3 CDN domain (`https://cdn.lokaya.com`) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID`| Frontend | Google OAuth Client ID |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID`| Frontend | Razorpay Payment Gateway ID |

---

## 5. Automated CI/CD Workflow (`centralized-cicd.yml`)

1. **Path-Filtered Builds**: Changes to `apps/backend/**` rebuild the backend Docker image; changes to `apps/user-app/**` rebuild the user app Docker image & Cloudflare Pages; changes to `apps/admin-web/**` rebuild the admin Docker image & Cloudflare Pages.
2. **Quality & Validation Gate**: Runs full Turbo typecheck and build check before pushing images.
3. **Automated GHCR Push**: Automatically tags images with `:latest` and the commit SHA `:${{ github.sha }}`.
4. **AWS SSM Automated Deployment**: Automatically logs into GHCR on EC2, pulls the fresh image, and restarts the container zero-downtime with health checks.
5. **Manual Dispatch**: Trigger individual builds or all builds on demand via **Actions ➔ Centralized CI/CD ➔ Run workflow**.
