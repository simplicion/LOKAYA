# 🚀 Lokaya Centralized CI/CD & Deployment Guide

This guide explains how the centralized Monorepo CI/CD pipeline deploys the **Backend on AWS** and the **User App & Admin App on Cloudflare Pages**.

---

## 1. Architecture Summary

| Component | Target Platform | Deployment Trigger | Output / Project |
| :--- | :--- | :--- | :--- |
| **Backend API** (`apps/backend`) | **AWS EC2** | `push` to `main`, `workflow_dispatch` | Docker Container via GHCR & AWS SSM |
| **User Web App** (`apps/user-app/web`) | **Cloudflare Pages** | `push` to `main`, PR preview, `workflow_dispatch` | `lokaya-user-app` |
| **Admin Portal** (`apps/admin-web`) | **Cloudflare Pages** | `push` to `main`, PR preview, `workflow_dispatch` | `lokaya-admin-app` |

---

## 2. GitHub Repository Secrets Setup

Navigate to your GitHub repository: **Settings ➔ Secrets and variables ➔ Actions** and add the following repository secrets:

### A. Cloudflare Deployment Secrets
1. `CLOUDFLARE_API_TOKEN`:
   - Go to [Cloudflare Dashboard ➔ My Profile ➔ API Tokens](https://dash.cloudflare.com/profile/api-tokens).
   - Click **Create Token** ➔ Use template **"Create Custom Token"** or **"Cloudflare Pages"**.
   - Permissions needed: `Account ➔ Cloudflare Pages ➔ Edit`.
   - Copy the generated token.
2. `CLOUDFLARE_ACCOUNT_ID`:
   - Found in your Cloudflare dashboard URL or on the right sidebar of any domain overview (`Account ID`).

### B. AWS Deployment Secrets
1. `AWS_ACCESS_KEY_ID`: IAM user access key with AmazonEC2FullAccess and AmazonSSMFullAccess.
2. `AWS_SECRET_ACCESS_KEY`: IAM user secret access key.
3. `AWS_REGION`: AWS Region where EC2 is hosted (e.g. `us-east-1` or `ap-south-1`).
4. `AWS_EC2_INSTANCE_ID`: Target EC2 Instance ID (e.g. `i-0a1b4f249d8a965c6`).

### C. Frontend Public Environment Variables (Secrets or Actions Variables)
- `NEXT_PUBLIC_API_URL`: e.g. `https://api.lokaya.com/api/v1`
- `NEXT_PUBLIC_SOCKET_URL`: e.g. `https://api.lokaya.com`
- `NEXT_PUBLIC_CDN_DOMAIN`: e.g. `https://cdn.lokaya.com`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`: Your Razorpay Key ID
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Your Google OAuth Client ID

---

## 3. Cloudflare Pages Projects Setup

Before the first automatic GitHub Actions deploy, create the two Cloudflare Pages projects in your Cloudflare Dashboard (or run the CLI command below):

```bash
# In your terminal (with CLOUDFLARE_API_TOKEN & CLOUDFLARE_ACCOUNT_ID set):
npx wrangler pages project create lokaya-user-app --production-branch main
npx wrangler pages project create lokaya-admin-app --production-branch main
```

### Custom Domains on Cloudflare Pages:
1. In Cloudflare Dashboard ➔ **Workers & Pages** ➔ Select `lokaya-user-app`.
2. Go to **Custom domains** tab ➔ Click **Set up a custom domain**.
3. Add `lokaya.com` or `app.lokaya.com`.
4. Repeat for `lokaya-admin-app` with `admin.lokaya.com`.

---

## 4. Local CLI One-Command Deployments

You can trigger builds and direct Cloudflare deployments directly from your terminal anytime:

```bash
# 1. Deploy User App to Cloudflare Pages
pnpm deploy:user

# 2. Deploy Admin App to Cloudflare Pages
pnpm deploy:admin

# 3. Deploy Both Frontend Apps
pnpm deploy:all
```

---

## 5. Manual Pipeline Dispatch from GitHub Actions

You can trigger a manual deployment for any specific service without making code changes:
1. Go to **GitHub ➔ Actions ➔ Centralized CI/CD Pipeline**.
2. Click **Run workflow**.
3. Select the branch and choose:
   - **Component**: `all`, `backend`, `user-app`, or `admin-app`.
   - **Target Environment**: `production` or `preview`.
4. Click **Run workflow**.
