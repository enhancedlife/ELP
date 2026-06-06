# Your Enhanced Life (ELP) — Production deployment

Complete guide to run **https://yourenhancedlife.com** in production using Docker Compose on a VPS.

**Stack:** Next.js (frontend) · Django (backend) · MariaDB (database, container only) · Nginx (TLS reverse proxy)

---

## Table of contents

1. [Architecture](#architecture)
2. [What you need before starting](#what-you-need-before-starting)
3. [Server preparation](#server-preparation)
4. [DNS](#dns)
5. [Upload the project](#upload-the-project)
6. [Configure environment (`.env`)](#configure-environment-env)
7. [Generate secrets](#generate-secrets)
8. [TLS certificate (Let's Encrypt)](#tls-certificate-lets-encrypt)
9. [Build and start containers](#build-and-start-containers)
10. [Database setup](#database-setup)
11. [Create admin user](#create-admin-user)
12. [Verify the site](#verify-the-site)
13. [Email (SMTP) test](#email-smtp-test)
14. [Admin dashboard URLs](#admin-dashboard-urls)
15. [Deploying updates](#deploying-updates)
16. [Maintenance mode](#maintenance-mode)
17. [Database backup and restore](#database-backup-and-restore)
18. [Firewall (UFW)](#firewall-ufw)
19. [Useful commands](#useful-commands)
20. [Troubleshooting](#troubleshooting)

---

## Architecture

```
Internet
   │
   ▼
nginx (:80 / :443)  ──► frontend:3000  (Next.js — public site + dashboard UI)
   │                         │
   │                         └──► backend:8000  (via internal HTTP — API rewrites / BFF)
   ├──► backend:8000   (/admin/, /api/health)
   │
backend ──► db:3306   (MariaDB — internal Docker network only, no host port)
```

All four services run via **`docker compose`**. The database lives **only** in the `db` container. There is no host MySQL install.

**Single config file for production:** project root **`.env`** (copy from `.env.deploy.example`). Do **not** use a separate `backend/.env` when using Docker Compose — Compose injects the root `.env` into the backend container.

---

## What you need before starting

| Item | Details |
|------|---------|
| **VPS** | Ubuntu 22.04/24.04 LTS (or similar Linux), 2 GB+ RAM recommended |
| **Domain** | `yourenhancedlife.com` — DNS A records pointing to your VPS public IP |
| **SSH access** | Root or sudo user on the server |
| **SMTP** | Zoho Mail (or other) credentials for outbound email |
| **Git** (optional) | To clone the repo; or upload files via SFTP |

---

## Server preparation

SSH into the VPS and run:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker (official convenience script)
curl -fsSL https://get.docker.com | sudo sh

# Allow your user to run docker without sudo (log out/in after this)
sudo usermod -aG docker $USER

# Install Docker Compose plugin (often included with docker.com install)
docker compose version

# Certbot for TLS (used on the host; certs are mounted into nginx container)
sudo apt install -y certbot

# Directories for Let's Encrypt webroot and certs (mounted into nginx)
sudo mkdir -p /var/www/certbot
sudo chown -R $USER:$USER /var/www/certbot
# /etc/letsencrypt is created by certbot automatically
```

---

## DNS

At your domain registrar, create **A records**:

| Host | Type | Value |
|------|------|--------|
| `@` | A | `YOUR_VPS_PUBLIC_IP` |
| `www` | A | `YOUR_VPS_PUBLIC_IP` |

Wait until DNS propagates (check with `dig yourenhancedlife.com` or an online DNS checker).

---

## Upload the project

**Option A — Git:**

```bash
cd ~
git clone <your-repo-url> elp
cd elp
```

**Option B — SFTP:** Upload the entire `ELP` project folder to e.g. `~/elp` on the server.

The directory must contain `docker-compose.yml`, `Dockerfile`, `backend/`, `app/`, `.env.deploy.example`, etc.

---

## Configure environment (`.env`)

```bash
cd ~/elp   # your project root
cp .env.deploy.example .env
chmod 600 .env
nano .env    # or vim .env
```

Replace **every** `YOUR_*` placeholder. Below is what each variable does.

### Site URL

| Variable | Example | Purpose |
|----------|---------|---------|
| `PUBLIC_SITE_URL` | `https://yourenhancedlife.com` | Public HTTPS URL (Next.js build + browser) |
| `PUBLIC_SITE_BASE_URL` | `https://yourenhancedlife.com` | Links in emails (reset password, unsubscribe) |

### Django

| Variable | Example | Purpose |
|----------|---------|---------|
| `DJANGO_SECRET_KEY` | *(long random string)* | Django signing — **generate, do not reuse dev key** |
| `DJANGO_DEBUG` | `0` | **Must be 0 in production** |
| `DJANGO_ALLOWED_HOSTS` | `yourenhancedlife.com,www.yourenhancedlife.com,YOUR_VPS_IP,127.0.0.1,localhost` | Hostnames Django accepts |

### Database (MariaDB container only)

Credentials are defined **once** in `.env`. Compose passes them to the `db` container on first boot and Django uses `DB_*` to connect.

| Variable | Example | Purpose |
|----------|---------|---------|
| `MYSQL_ROOT_PASSWORD` | *(strong password)* | MariaDB root — **container init only**, not used by Django |
| `DB_HOST` | `db` | Docker service name (**do not change** for Compose deploy) |
| `DB_PORT` | `3306` | MariaDB port |
| `DB_NAME` | `theswolerepublic` | Database name |
| `DB_USER` | `yel` | App user (Django + MariaDB) |
| `DB_PASSWORD` | *(strong password)* | App password (must match what MariaDB creates) |

> **Important:** MariaDB initializes the database **only on first start** (empty volume). If you change `DB_USER` / `DB_PASSWORD` later, you must update MySQL users inside the container or reset the volume (`docker compose down -v` — **destroys all data**).

### Dashboard API (Next.js ↔ Django)

| Variable | Example | Purpose |
|----------|---------|---------|
| `DASHBOARD_SERVER_SECRET` | *(long random string)* | Shared secret for dashboard BFF — **same string everywhere, generate once** |

### Email (Zoho AU example)

| Variable | Example |
|----------|---------|
| `EMAIL_HOST` | `smtp.zoho.com.au` |
| `EMAIL_PORT` | `587` |
| `EMAIL_USE_TLS` | `1` |
| `EMAIL_USE_SSL` | `0` |
| `EMAIL_HOST_USER` | `admin@theswolerepublic.com` |
| `EMAIL_HOST_PASSWORD` | *(Zoho app / SMTP password)* |
| `DEFAULT_FROM_EMAIL` | `admin@theswolerepublic.com` |
| `CONTACT_FORM_TO` | `admin@theswolerepublic.com` |

If the SMTP password contains `$` or `#`, wrap it in **single quotes** in `.env`:

```env
EMAIL_HOST_PASSWORD='your$complex#password'
```

### Other production flags (defaults in `.env.deploy.example` are correct)

- `DASHBOARD_ALLOW_PUBLIC_REGISTRATION=0`
- `PASSWORD_RESET_SEND_PROBE_FOR_UNKNOWN=0`
- `NODE_ENV=production`

---

## Generate secrets

Run on the server (or locally):

```bash
# Django secret key
python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# Dashboard shared secret (and optional MySQL passwords)
openssl rand -hex 32
```

Copy outputs into `.env`:

- `DJANGO_SECRET_KEY=...`
- `DASHBOARD_SERVER_SECRET=...`
- `MYSQL_ROOT_PASSWORD=...`
- `DB_PASSWORD=...`

---

## TLS certificate (Let's Encrypt)

Nginx expects certificates at:

- `/etc/letsencrypt/live/yourenhancedlife.com/fullchain.pem`
- `/etc/letsencrypt/live/yourenhancedlife.com/privkey.pem`

**First-time certificate** (before nginx can serve HTTPS):

```bash
# Nothing must be listening on port 80
sudo systemctl stop nginx 2>/dev/null || true
docker compose down 2>/dev/null || true

sudo certbot certonly --standalone \
  -d yourenhancedlife.com \
  -d www.yourenhancedlife.com \
  --agree-tos \
  -m your-email@example.com \
  --non-interactive

# Verify files exist
sudo ls /etc/letsencrypt/live/yourenhancedlife.com/
```

**Renewal** (add to crontab, e.g. monthly):

```bash
sudo certbot renew --quiet
docker compose -f ~/elp/docker-compose.yml exec nginx nginx -s reload
```

For renewals with webroot (while stack is running):

```bash
sudo certbot renew --webroot -w /var/www/certbot
docker compose exec nginx nginx -s reload
```

---

## Build and start containers

```bash
cd ~/elp

# Build images and start all services in background
docker compose up -d --build
```

This starts:

| Service | Role |
|---------|------|
| `db` | MariaDB 11, data in volume `yel_mysql_data` |
| `backend` | Django + Gunicorn on port 8000 (internal) |
| `frontend` | Next.js on port 3000 (internal) |
| `nginx` | Public entry on ports 80 and 443 |

Wait until all are healthy:

```bash
docker compose ps
```

All services should show `running` (and `healthy` where applicable).

View logs if something fails:

```bash
docker compose logs -f
docker compose logs -f backend
docker compose logs -f db
```

---

## Database setup

Migrations run automatically when the backend container starts (`migrate --noinput` in Dockerfile CMD). To run manually:

```bash
docker compose exec backend python manage.py migrate
```

Optional — collect static files (if you serve static from Django):

```bash
docker compose exec backend python manage.py collectstatic --noinput
```

---

## Create admin user

Dashboard and Django admin require a **superuser**:

```bash
docker compose exec -it backend python manage.py createsuperuser
```

Follow prompts (email, password). Use this account at:

- **Dashboard:** https://yourenhancedlife.com/auth/admin/login  
- **Django admin:** https://yourenhancedlife.com/admin/

---

## Verify the site

```bash
# API health (via nginx)
curl -sS https://yourenhancedlife.com/api/health

# Or from inside the backend container
docker compose exec backend python -c "import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:8000/api/health').read())"
```

In a browser:

1. Open **https://yourenhancedlife.com** — public site loads  
2. Open **https://yourenhancedlife.com/auth/admin/login** — sign in with superuser  
3. Open **https://yourenhancedlife.com/dashboard** — admin dashboard  

---

## Email (SMTP) test

```bash
docker compose exec backend python manage.py sendtestemail your-address@example.com
```

Check inbox and spam. If it fails, verify Zoho credentials in `.env` and restart backend:

```bash
docker compose up -d backend
```

---

## Admin dashboard URLs

| Page | URL |
|------|-----|
| Public site | https://yourenhancedlife.com |
| Admin login | https://yourenhancedlife.com/auth/admin/login |
| Dashboard home | https://yourenhancedlife.com/dashboard |
| Bulk email | https://yourenhancedlife.com/dashboard/email/bulk |
| Email template | https://yourenhancedlife.com/dashboard/email/template |
| Database backup | https://yourenhancedlife.com/dashboard/database |
| Django admin | https://yourenhancedlife.com/admin/ |

---

## Deploying updates

After pulling new code or changing config:

```bash
cd ~/elp
git pull    # if using git

# Rebuild and restart (frontend rebuild required for Next.js code changes)
docker compose up -d --build

# Run new migrations if any
docker compose exec backend python manage.py migrate
```

If you **only** changed `.env` (no code change):

```bash
docker compose up -d
```

---

## Maintenance mode

Shows a maintenance page on the public site (nginx serves 503):

```bash
cd ~/elp
sh deploy/toggle-maintenance.sh    # turn ON
sh deploy/toggle-maintenance.sh    # turn OFF
```

---

## Database backup and restore

Superusers only — in the dashboard:

1. Go to **https://yourenhancedlife.com/dashboard/database**
2. **Export:** click **Download backup** (MySQL → `.sql.gz`)
3. **Import:** upload backup, type `REPLACE`, confirm (**replaces entire database**)

Requires `mysqldump` and `mysql` in the backend container (included in `backend/Dockerfile`).

---

## Firewall (UFW)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

Do **not** expose MariaDB (3306) publicly — the `db` container has no published ports.

---

## Useful commands

```bash
cd ~/elp

# Status
docker compose ps

# Logs
docker compose logs -f backend
docker compose logs -f nginx

# Restart one service
docker compose restart backend

# Stop everything
docker compose down

# Stop and DELETE database volume (⚠ destroys all DB data)
docker compose down -v

# Shell inside backend
docker compose exec backend sh

# MariaDB root CLI (emergency)
docker compose exec db mariadb -u root -p

# Django shell
docker compose exec backend python manage.py shell
```

---

## Troubleshooting

### `docker compose up` fails on `.env`

Ensure all required variables are set — Compose will error if `MYSQL_ROOT_PASSWORD`, `DB_USER`, or `DB_PASSWORD` is missing.

### Backend unhealthy / cannot connect to database

```bash
docker compose logs db
docker compose logs backend
```

- Confirm `db` is `healthy` before backend starts  
- First deploy: wait ~40s for MariaDB init  
- Wrong password: only fixable by updating MySQL user or resetting volume  

### Nginx fails / SSL errors

- Certificates must exist under `/etc/letsencrypt/live/yourenhancedlife.com/`  
- Re-run [TLS certificate](#tls-certificate-lets-encrypt) steps  
- Test nginx config: `docker compose exec nginx nginx -t`

### 502 / site unreachable

```bash
docker compose ps
docker compose logs frontend
docker compose logs nginx
```

Ensure `frontend` and `backend` are running and healthy.

### Dashboard 401 / 403

- Sign in at `/auth/admin/login` with a **superuser** account  
- `DASHBOARD_SERVER_SECRET` in `.env` must be set (non-empty) and identical for frontend + backend (same file)  
- Rebuild frontend if you changed secrets: `docker compose up -d --build frontend`

### Email not sending

- Check `EMAIL_*` in `.env`  
- Test with `sendtestemail` (see above)  
- Zoho: use app-specific password if 2FA is enabled  

### Changed `DB_PASSWORD` after first deploy

MariaDB already initialized with the old password. Either:

1. Update the user inside MariaDB:
   ```bash
   docker compose exec db mariadb -u root -p
   -- ALTER USER 'yel'@'%' IDENTIFIED BY 'new_password'; FLUSH PRIVILEGES;
   ```
2. Or reset everything (data loss): `docker compose down -v` then `docker compose up -d --build`

---

## Quick reference — first production deploy checklist

- [ ] VPS ready, Docker installed  
- [ ] DNS A records for `@` and `www` → VPS IP  
- [ ] Project uploaded to `~/elp`  
- [ ] `cp .env.deploy.example .env` and fill all `YOUR_*` values  
- [ ] Generate `DJANGO_SECRET_KEY` and `DASHBOARD_SERVER_SECRET`  
- [ ] Obtain Let's Encrypt certificate  
- [ ] `docker compose up -d --build`  
- [ ] `docker compose exec backend python manage.py migrate`  
- [ ] `docker compose exec -it backend python manage.py createsuperuser`  
- [ ] `docker compose exec backend python manage.py sendtestemail you@example.com`  
- [ ] Verify https://yourenhancedlife.com and dashboard login  
- [ ] Configure UFW (80, 443, SSH)  
- [ ] Set up certbot renewal cron  

---

## Local development (not production)

For development on your PC without the full stack:

- **Backend:** `cd backend && python manage.py runserver 127.0.0.1:8000` (uses `backend/.env`, SQLite if `DB_NAME` empty)  
- **Frontend:** `npm run dev` (uses `.env.local` from `.env.local.example`)  

Production live mode always uses **Docker Compose + root `.env`** as described above.
