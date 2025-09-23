# AutoLabelingTool - Development Setup Guide

This guide explains how to set up the development environment for **AutoLabelingTool** with backend (Django + CVAT), frontend (React + CVAT-UI), and required services.

---

## 1. Install Required Packages

```bash
sudo apt-get update && sudo apt-get --no-install-recommends install -y \
  build-essential curl git python3-dev python3-pip python3-venv python3-tk \
  libldap2-dev libsasl2-dev libgeos-dev cargo
```

---

## 2. Install Node.js (v20) & Corepack

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs

# Ensure Corepack is installed
sudo npm -g install corepack

# If old Yarn (1.x) exists, remove it
sudo npm uninstall -g yarn

# Reinstall Corepack
sudo npm install -g corepack

# Verify Yarn version (should be 4.x)
yarn --version
```

---

## 3. Clone Repository & Prepare Environment

```bash
git clone https://github.com/AutoLabeling-dotdot/AutoLabelingTool.git
cd AutoLabelingTool

# Create required folders
mkdir logs keys

# Setup Python virtual environment
python3 -m venv .env
. .env/bin/activate

# Upgrade pip/setuptools
pip install -U pip wheel setuptools

# Install Python dependencies
pip install -r cvat/requirements/development.txt -r dev/requirements.txt
```

---

## 4. Setup CVAT-UI (Frontend)

```bash
# Enable Yarn
corepack enable yarn

# Install dependencies
yarn --immutable
```

---

## 5. Database Initialization

```bash
python manage.py migrate
python manage.py migrateredis
python manage.py collectstatic
python manage.py syncperiodicjobs
```

---

## 6. Run Development Servers

### Backend

```bash
python manage.py runserver 0.0.0.0:7000
```

### Backend Worker

```bash
python manage.py rqworker import export annotation webhooks notifications quality_reports cleaning chunks consensus
```

### Frontend

```bash
yarn run start:cvat-ui
```

---

## 7. Docker Services Setup

### Start DB & Redis Containers

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d \
  cvat_db cvat_redis_inmem cvat_redis_ondisk
```

### Start OPA (Open Policy Agent)

```bash
docker run -d --name cvat_opa -p 8181:8181 \
  --add-host=host.docker.internal:host-gateway \
  openpolicyagent/opa:0.63.0 run --server \
  --set=services.cvat.url=http://host.docker.internal:7000 \
  --set=bundles.cvat.service=cvat \
  --set=bundles.cvat.resource=/api/auth/rules \
  --set=bundles.cvat.polling.min_delay_seconds=5 \
  --set=bundles.cvat.polling.max_delay_seconds=15
```

---

## 8. Access

* **Backend (Django):** [http://localhost:7000](http://localhost:7000)
* **Frontend (CVAT-UI):** [http://localhost:3000](http://localhost:3000)
* **OPA (Policy Agent):** [http://localhost:8181](http://localhost:8181)

---