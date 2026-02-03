# AutoLabelingTool (dotdot)

> CVAT 기반 커스텀 컴퓨터 비전 어노테이션 도구

**AutoLabelingTool**은 오픈소스 프로젝트 [CVAT](https://github.com/cvat-ai/cvat) (MIT 라이센스)를 기반으로 커스터마이징한 어노테이션 플랫폼입니다. dotdot이라는 서비스명으로 SaaS 형태로 운영됩니다.

---

## 📋 목차

- [프로젝트 개요](#-프로젝트-개요)
- [주요 기능](#-주요-기능)
- [배포 파이프라인](#-배포-파이프라인)
- [개발 환경 설정](#-개발-환경-설정)
- [기술 스택](#-기술-스택)
- [향후 개발 계획](#-향후-개발-계획)

---

## 프로젝트 개요

### 원본 프로젝트: CVAT
- **라이센스**: MIT License
- **용도**: 컴퓨터 비전을 위한 비디오/이미지 어노테이션 도구
- **개발**: Intel 주도 개발, 현재 cvat.ai에서 운영

### 커스터마이징 방향
- 서비스명 변경: **dotdot**
- 다국어 지원 (예정)
- AI 자동 라벨링 커스텀 및 고도화 (예정)
- Public Cloud 기반 SaaS 운영

---

## 주요 기능

### 어노테이션 기능
- 이미지 및 비디오 어노테이션
- Bounding Box, Polygon, Polyline, Points, Cuboid 등 다양한 형태 지원
- 키포인트 및 스켈레톤 어노테이션
- 3D Point Cloud 어노테이션

### AI 자동 라벨링
- 추후 **part segmentation 모델** 지원 예정
- 기본 제공(현재 지원되지 않음. 필요한 경우 Nuclio 서버리스 함수로 별도 배포해야 사용 가능)
  - **Segment Anything (SAM)**: 인터랙티브 세그멘테이션
  - **YOLO v3/v7**: 객체 탐지
  - **Mask RCNN**: 인스턴스 세그멘테이션
  - **SiamMask, TransT**: 객체 추적
  - 기타 10+ 딥러닝 모델 지원

### 데이터 포맷 지원
30개 이상의 어노테이션 포맷 Import/Export 지원:
- YOLO, MS COCO, Pascal VOC
- Cityscapes, KITTI
- LabelMe, ImageNet
- Ultralytics YOLO (Detection, Segmentation, Pose, OBB, Classification)
- 기타 다수

### 협업 기능
- 팀 프로젝트 관리
- 작업 할당 및 진행 상황 추적
- 품질 관리 및 리뷰 시스템

---

## 배포 파이프라인

### 브랜치 전략

#### `develop` 브랜치 → 사내 개발 서버
- **배포 환경**: Self-hosted 서버 (172.16.0.172)
- **트리거**:
  - `develop` 브랜치로 push
  - `develop` 브랜치로 PR merge
- **배포 방식**:
  - GitHub Actions self-hosted runner 사용
  - Docker Compose 기반 배포
  - 자동 빌드 및 재배포

**워크플로우**: [`.github/workflows/deploy-dev.yml`](.github/workflows/deploy-dev.yml)

#### `main` 브랜치 → AWS 프로덕션 서버
- **배포 환경**: AWS (ap-southeast-1 리전)
- **트리거**: `main` 브랜치로 push
- **배포 방식**:
  - GitHub Actions (ubuntu-latest runner)
  - Docker 이미지 빌드
  - AWS ECR에 이미지 푸시
  - 이미지 태그: `bytesize/cvat-dotdot-server:prod`, `bytesize/cvat-dotdot-ui:prod`

**워크플로우**: [`.github/workflows/deploy-prod.yml`](.github/workflows/deploy-prod.yml)

### 배포 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                    GitHub Repository                     │
│                                                          │
│  develop branch ──────────┐    main branch ──────────┐  │
└───────────────────────────┼──────────────────────────┼──┘
                            │                          │
                            ▼                          ▼
                   ┌─────────────────┐      ┌──────────────────┐
                   │  GitHub Actions │      │ GitHub Actions   │
                   │  (self-hosted)  │      │ (ubuntu-latest)  │
                   └────────┬────────┘      └────────┬─────────┘
                            │                        │
                            ▼                        ▼
                   ┌─────────────────┐      ┌──────────────────┐
                   │   Dev Server    │      │    AWS ECR       │
                   │  172.16.0.172   │      │  ap-southeast-1  │
                   │                 │      │                  │
                   │ Docker Compose  │      │ Docker Images:   │
                   │  - cvat-server  │      │  - server:prod   │
                   │  - cvat-ui      │      │  - ui:prod       │
                   │  - postgresql   │      └──────────────────┘
                   │  - redis        │
                   └─────────────────┘
```

---

## 개발 환경 설정

> ⚠️ **필수 요구사항**: Ubuntu 22.04

### 1. 시스템 패키지 설치

```bash
sudo apt-get update && sudo apt-get --no-install-recommends install -y \
  build-essential curl git python3-dev python3-pip python3-venv python3-tk \
  libldap2-dev libsasl2-dev libgeos-dev cargo
```

### 2. Node.js 20 및 Corepack 설치

```bash
# Node.js 20 설치
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs

# Corepack 설치
sudo npm -g install corepack

# npm 버전 업그레이드 필요
sudo npm install -g npm@11.8.0  # 버전은 달라질 수 있음, notice 확인

# corepack 사용
sudo corepack enable
yarn set version stable

# Yarn 버전 확인 (4.x 이어야 함 아니라면 아래 진행)
yarn --version

# 기존 Yarn 1.x 제거 (있는 경우)
sudo npm uninstall -g yarn

# Corepack 재설치
sudo npm install -g corepack

# Yarn 버전 확인 (4.x 이어야 함)
yarn --version
```

### 3. 저장소 클론 및 환경 준비

```bash
git clone https://github.com/AutoLabeling-dotdot/AutoLabelingTool.git
cd AutoLabelingTool

# 필수 디렉토리 생성
mkdir logs keys

# Python 가상환경 설정
python3 -m venv .env
source .env/bin/activate

# pip 업그레이드
pip install -U pip wheel setuptools

# Python 의존성 설치
pip install -r cvat/requirements/development.txt -r dev/requirements.txt
```

### 4. 프론트엔드 설정 (CVAT-UI)

```bash
# Yarn 활성화
corepack enable yarn

# 의존성 설치
yarn --immutable
```

### 5. 데이터베이스 초기화

#### DB 및 Redis 컨테이너 시작

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d \
  cvat_db cvat_redis_inmem cvat_redis_ondisk
```

#### DB 초기화

```bash
python manage.py migrate
python manage.py migrateredis
python manage.py collectstatic
python manage.py syncperiodicjobs
```

### 6. Docker 서비스 시작

#### OPA (Open Policy Agent) 시작

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

### 7. 개발 서버 실행

3개의 터미널에서 각각 실행:

#### 터미널 1: Django 백엔드

```bash
source .env/bin/activate
python manage.py runserver 0.0.0.0:7000
```

#### 터미널 2: 백엔드 워커

```bash
source .env/bin/activate
python manage.py rqworker import export annotation webhooks notifications quality_reports cleaning chunks consensus
```

#### 터미널 3: React 프론트엔드

```bash
yarn run start:cvat-ui
```

### 8. 접속 정보

- **백엔드 (Django API)**: http://localhost:7000
- **프론트엔드 (CVAT UI)**: http://localhost:3000
  - 참고: 최초 실행 시 느림
- **OPA (정책 엔진)**: http://localhost:8181

---

## OPA (Open Policy Agent)?

**OPA (Open Policy Agent)**는 정책 기반 접근 제어(Policy-Based Access Control) 엔진.

- CVAT에서의 역할

  - 사용자 권한 관리 (누가 어떤 작업을 할 수 있는지)
  - 조직/프로젝트/태스크 레벨의 접근 제어
  - 역할 기반 권한 체크 (Admin, Worker, Supervisor 등)

- 작동 방식:

  - CVAT 서버가 권한 체크가 필요할 때 OPA에 질의
  - OPA는 정책 규칙(Rego 언어로 작성)을 기반으로 허용/거부 결정
  - 예를 들어, "이 사용자가 이 프로젝트의 어노테이션을 수정할 수 있는가?" 판단

---

## 🔧 기술 스택

### 백엔드
- **프레임워크**: Django 3.x
- **언어**: Python 3.x
- **작업 큐**: RQ (Redis Queue)
- **인증/인가**: OPA (Open Policy Agent)
- **API**: RESTful API, OpenAPI/Swagger

### 프론트엔드
- **프레임워크**: React
- **언어**: TypeScript
- **패키지 관리**: Yarn 4.x
- **캔버스**: Custom Canvas (2D/3D)

### 데이터베이스
- **주 DB**: PostgreSQL
- **캐시**: Redis (in-memory + on-disk)

### 인프라
- **컨테이너**: Docker, Docker Compose
- **오케스트레이션**: Kubernetes (Helm Charts)
- **CI/CD**: GitHub Actions
- **클라우드**: AWS (ECR, ap-southeast-1)

### AI/ML
- **프레임워크**: PyTorch, OpenVINO, ONNX, TensorFlow
- **서버리스**: Nuclio Functions
- **주요 모델**: SAM, YOLO, Mask RCNN, SiamMask 등

---

## 📄 라이센스 관련

원본 프로젝트 CVAT은 MIT 라이센스이므로 상업적 사용이 가능합니다.

### 주의사항
- `/serverless` 디렉토리의 코드는 MIT 라이센스이지만, 다운로드되는 AI 모델 및 가중치는 별도의 라이센스를 가질 수 있습니다.
- FFmpeg는 LGPL/GPL 라이센스를 따릅니다. 자세한 내용은 [FFmpeg Legal](https://www.ffmpeg.org/legal.html)을 참조.

---

## 참고 자료

### 공식 문서
- [CVAT 공식 문서](https://docs.cvat.ai/)
- [CVAT GitHub](https://github.com/cvat-ai/cvat)
- [Datumaro 데이터셋 프레임워크](https://github.com/cvat-ai/datumaro)

### API 및 SDK
- [REST API 문서](https://docs.cvat.ai/docs/api_sdk/api/)
- [Python SDK](https://docs.cvat.ai/docs/api_sdk/sdk/) - `pip install cvat-sdk`
- [CLI 도구](https://docs.cvat.ai/docs/api_sdk/cli/) - `pip install cvat-cli`

### 가이드
- [설치 가이드](https://docs.cvat.ai/docs/administration/basics/installation/)
- [사용자 매뉴얼](https://docs.cvat.ai/docs/manual/)
- [어노테이션 포맷](https://docs.cvat.ai/docs/manual/advanced/formats/)
- [XML 포맷 상세](https://docs.cvat.ai/docs/manual/advanced/xml_format/)
