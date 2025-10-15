#!/bin/bash
# Upstream 동기화 스크립트

set -e

echo "🔄 upstream sync process를 시작..."

# 현재 브랜치 저장
CURRENT_BRANCH=$(git branch --show-current)

# Step 1: develop 브랜치 업데이트
echo "📥 dotdot develop 브랜치를 업데이트(upstream의 develop과 동기화)..."
git checkout develop
git pull origin develop
git fetch upstream
git merge upstream/develop
git push origin develop

# Step 2: dev 브랜치에서 sync 브랜치 생성
echo "🌿 sync용 브랜치를 생성..."
SYNC_BRANCH="sync-upstream-$(date +%Y%m%d)"
git checkout dev
git pull origin dev
git checkout -b "$SYNC_BRANCH"

# Step 3: develop 내용을 sync 브랜치에 merge
echo "🔀 $SYNC_BRANCH 브랜치에 develop 브랜치를 병합(충돌있으면 여기서 해결)..."
if git merge develop --no-edit; then
    echo "✅ Merge successful! No conflicts."
    echo ""
    echo "Next steps:"
    echo "1. Test the changes locally"
    echo "2. Run: git push origin $SYNC_BRANCH"
    echo "3. Create PR: $SYNC_BRANCH -> dev"
else
    echo "⚠️  Conflicts detected! Please resolve them manually:"
    echo "1. Fix conflicts in the listed files"
    echo "2. Run: git add ."
    echo "3. Run: git commit"
    echo "4. Run: git push origin $SYNC_BRANCH"
    echo "5. Create PR: $SYNC_BRANCH -> dev"
fi

echo ""
echo "📊 upstream으로부터의 변경 사항(커스텀 사항) 요약:"
git log dev..develop --oneline