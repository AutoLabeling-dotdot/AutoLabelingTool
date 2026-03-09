# Preload Data Feature — Implementation Plan (완전판)

## 작업 의도

CVAT annotation editor의 Menu 드롭다운에 **"Preload data"** 기능을 추가한다.
사용자가 해당 메뉴를 클릭하면 현재 job에 포함된 모든 프레임 청크를 순서대로 미리 로드하고,
완료 전까지 같은 위치에서 로딩 스피너 + "Cancel preload" 문구를 보여준다.
로딩 중 다시 클릭하면 즉시 중단(cancel)되고, 이미 로드된 청크는 캐시에 유지된다.
중단 후 다시 클릭하면 남은 청크부터 이어서 진행한다.

---

## UI/UX 명세

| 상태 | 메뉴 아이템 표시 |
|------|-----------------|
| 기본 (preload 안 함) | `Preload data` |
| preload 진행 중 | `<LoadingOutlined />  Cancel preload` |
| 완료 / 취소 후 | `Preload data` (원래 상태로 복귀) |

- 메뉴 아이템 위치: **"Remove annotations" (weight 30) 바로 아래**, weight = **35**
- preload 진행 중에도 사용자는 프레임 이동 등 다른 작업을 자유롭게 할 수 있어야 한다 (블로킹 없음)
- 각 청크 로드 완료마다 타임라인 캐시 바를 실시간으로 갱신한다 (`updateCachedChunksAsync()`)

---

## 캐시 아키텍처 분석

### 기존 구조 (디코딩 캐시만 존재)

```
서버 → getChunk(ArrayBuffer) → FrameDecoder.requestDecodeBlock()
                                         ↓
                             decodedChunks: Record<number, ImageBitmap[]>
                             cachedChunksLimit: 최대 10 (해상도·청크크기 기반 동적 계산)
```

**`cachedChunksLimit` 계산식** (`cvat-core/src/frames.ts`, line ~908):
```ts
const decodedBlocksCacheSize = Math.min(
    Math.floor((2048 * 1024 * 1024) / ((mean + stdDev) * 4 * chunkSize)) || 1,
    10,
);
```
- 메모리 상한 2GB, 최대 10개 청크
- 고해상도 이미지(4K)나 큰 chunkSize에서는 3~6개 수준까지 낮아짐

**LRU eviction** (`cvat-data/src/ts/cvat-data.ts`, `cleanup(extra)` 메서드):
```ts
// 새 청크 추가 전 호출: cachedChunksLimit - 1 개만 남기고 나머지 evict
cleanup(extra = 1): void {
    while (length > this.cachedChunksLimit - Math.min(extra, this.cachedChunksLimit)) {
        const lastChunk = this.orderedStack.pop();  // 가장 오래된 청크 제거
        // ...ImageBitmap.close() 호출로 GPU 메모리 해제
    }
}
```

### 문제: 순차 preload 시 early eviction 발생

```
preload 순서: chunk0 → chunk1 → → chunk6 → chunk7
(cachedChunksLimit = 6이라 가정, 총 8청크)

chunk6 추가 시: cleanup() → chunk0 evict → [1,2,3,4,5,6]
chunk7 추가 시: cleanup() → chunk1 evict → [2,3,4,5,6,7]

최종 상태: 앞쪽 청크 사라지고 뒤쪽만 남음 (사용자 관찰과 일치)
```

### 해결책: 압축 청크 별도 캐시 (`compressedChunks`)

getChunk()로 받은 **압축 ArrayBuffer**를 별도 캐시에 저장한다.
- 압축 청크: 10프레임 기준 수백KB (vs 디코딩 ~80MB) → 모든 청크 보관 가능
- LRU 한계 무관, eviction 없음
- 이후 프레임 이동 시 서버 재요청 없이 이 캐시에서 디코딩
- `getCachedChunks()`가 압축 캐시도 포함 → 타임라인 바 전 구간 표시

```
서버 → getChunk() ──→ compressedChunks: Record<number, ArrayBuffer>  ← preload가 여기까지만 채움
                  └──→ FrameDecoder.requestDecodeBlock()               ← 프레임 표시 시 여기까지
                                 ↓
                     decodedChunks (LRU, max 10)
```

---

## 변경 파일 (7개)

### 1. `cvat-core/src/frames.ts` ✅

#### ① `frameDataCache` 타입에 `compressedChunks` 필드 추가

```ts
const frameDataCache: Record<string, {
    // ...기존 필드들...
    compressedChunks: Record<number, ArrayBuffer>;  // 신규
    getChunk: (chunkIndex: number, quality: ChunkQuality) => Promise<ArrayBuffer>;
    // ...
}> = {};
```

#### ② `getFrame()` 내 `frameDataCache[jobID]` 초기화 블록 수정

기존 `getChunk,` 한 줄을 아래 래퍼 함수로 교체:

```ts
frameDataCache[jobID] = {
    // ...기존 필드들...
    compressedChunks: {},                             // 신규
    getChunk: async (chunkIndex, quality) => {        // getChunk 파라미터를 클로저로 캡처
        if (
            quality === ChunkQuality.COMPRESSED &&
            chunkIndex in frameDataCache[jobID].compressedChunks
        ) {
            return frameDataCache[jobID].compressedChunks[chunkIndex];
        }
        const chunk = await getChunk(chunkIndex, quality);  // 원본 파라미터 사용
        if (quality === ChunkQuality.COMPRESSED) {
            frameDataCache[jobID].compressedChunks[chunkIndex] = chunk;
        }
        return chunk;
    },
    getMeta: ...,
};
```

#### ③ `refreshJobCacheIfOutdated()` 내 캐시 초기화에 추가 (line ~772)

```ts
cached.provider.cleanup(Number.MAX_SAFE_INTEGER);
cached.compressedChunks = {};    // 신규 추가
for (const frame of Object.keys(cached.contextCache)) { ... }
```

#### ④ `preloadChunk()` 함수 추가 (export, `getCachedChunks` 바로 위)

```ts
export async function preloadChunk(jobID: number, chunkIndex: number): Promise<void> {
    if (!(jobID in frameDataCache)) return;
    const cache = frameDataCache[jobID];
    if (chunkIndex in cache.compressedChunks) return;  // 이미 캐시됨
    await cache.getChunk(chunkIndex, ChunkQuality.COMPRESSED);
    // getChunk 래퍼가 자동으로 compressedChunks에 저장
}
```

#### ⑤ `getCachedChunks()` 수정 — 압축 캐시 포함

```ts
export function getCachedChunks(jobID: number): number[] {
    if (!(jobID in frameDataCache)) {
        return [];
    }
    const decoded = frameDataCache[jobID].provider.cachedChunks(true);
    const compressed = Object.keys(frameDataCache[jobID].compressedChunks).map(Number);
    return [...new Set([...decoded, ...compressed])].sort((a, b) => a - b);
}
```

> `clear()` 함수는 수정 불필요. `delete frameDataCache[jobID]`로 `compressedChunks`도 함께 GC됨.

---

### 2. `cvat-core/src/session.ts` ✅

#### ① `frames` 타입 정의에 `preload` 추가 (line ~429)

```ts
cachedChunks: () => Promise<number[]>;
preload: (chunkIndex: number) => Promise<void>;    // 신규
frameNumbers: () => Promise<number[]>;
```

#### ② prototype `frames.value` 객체에 메서드 추가 (line ~248, `cachedChunks` 바로 뒤)

`Object.freeze({ value: { ... } })` 블록 내부, `cachedChunks`와 `frameNumbers` 사이에 추가:

```ts
async cachedChunks() {
    const result = await PluginRegistry.apiWrapper.call(this, prototype.frames.cachedChunks);
    return result;
},
async preload(chunkIndex) {          // ← 신규 추가
    const result = await PluginRegistry.apiWrapper.call(
        this,
        prototype.frames.preload,
        chunkIndex,
    );
    return result;
},
async frameNumbers() {
```

> **주의**: 이 단계가 누락되면 `session-implementation.ts`에서 `Object.defineProperty(Job.prototype.frames.preload, ...)` 호출 시 `Job.prototype.frames.preload`가 `undefined`이어서 `TypeError: Object.defineProperty called on non-object` 에러 발생.

#### ③ 생성자 `frames` 객체에 바인딩 추가 (line ~498)

```ts
cachedChunks: Object.getPrototypeOf(this).frames.cachedChunks.bind(this),
preload: Object.getPrototypeOf(this).frames.preload.bind(this),    // 신규
```

---

### 3. `cvat-core/src/session-implementation.ts` ✅

`Job.prototype.frames.cachedChunks` implementation 블록 (line ~258) 바로 뒤에 추가:

```ts
Object.defineProperty(Job.prototype.frames.preload, 'implementation', {
    value: function preloadImplementation(
        this: JobClass,
        chunkIndex: number,
    ): ReturnType<typeof JobClass.prototype.frames.preload> {
        return preloadChunk(this.id, chunkIndex);
    },
    writable: true,
});
```

> `preloadChunk`를 `frames.ts`에서 import 목록에 추가 (기존 `getCachedChunks` 등과 함께).

---

### 4. `cvat-ui/src/actions/annotation-actions.ts` ✅

#### ① `AnnotationActionTypes` enum에 추가 (현재 마지막: `HOVERED_CHAPTER`)

```ts
PRELOAD_DATA_START = 'PRELOAD_DATA_START',
PRELOAD_DATA_STOP  = 'PRELOAD_DATA_STOP',
```

#### ② private action creator 2개 추가

```ts
function startPreloadData(): AnyAction {
    return { type: AnnotationActionTypes.PRELOAD_DATA_START, payload: {} };
}
function stopPreloadData(): AnyAction {
    return { type: AnnotationActionTypes.PRELOAD_DATA_STOP, payload: {} };
}
```

#### ③ `preloadDataAsync()` thunk — 파일 말미에 추가

```ts
export function preloadDataAsync(): ThunkAction {
    return async (dispatch: ThunkDispatch, getState: () => CombinedState): Promise<void> => {
        const state = getState();
        const { active } = state.annotation.player.preloading;

        if (active) {
            dispatch(stopPreloadData());
            return;
        }

        const job = state.annotation.job.instance as Job;
        const { frameNumbers } = state.annotation.job;
        if (!job || !frameNumbers.length) return;

        dispatch(startPreloadData());

        const { dataChunkSize, frameCount } = job;
        const totalChunks = Math.ceil(frameCount / dataChunkSize);

        try {
            for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
                if (!getState().annotation.player.preloading.active) break;

                try {
                    await job.frames.preload(chunkIndex);
                } catch {
                    // 개별 청크 실패 무시
                }

                // 각 청크 완료마다 타임라인 실시간 갱신
                await dispatch(updateCachedChunksAsync());
            }
        } finally {
            dispatch(stopPreloadData());
            await dispatch(updateCachedChunksAsync());
        }
    };
}
```

---

### 5. `cvat-ui/src/reducers/index.ts` ✅

`AnnotationState.player` 인터페이스에 `preloading` 필드 추가:

```ts
player: {
    frame: { ... };
    navigationType: NavigationType;
    ranges: string;
    navigationBlocked: boolean;
    playing: boolean;
    frameAngles: number[];
    hoveredChapter: number | null;
    preloading: {            // 신규
        active: boolean;
    };
};
```

---

### 6. `cvat-ui/src/reducers/annotation-reducer.ts` ✅

#### ① `defaultState.player`에 초기값 추가 (`hoveredChapter: null` 다음)

```ts
preloading: {
    active: false,
},
```

#### ② reducer switch에 case 2개 추가 (`HOVERED_CHAPTER` case 바로 뒤)

```ts
case AnnotationActionTypes.PRELOAD_DATA_START: {
    return {
        ...state,
        player: { ...state.player, preloading: { active: true } },
    };
}
case AnnotationActionTypes.PRELOAD_DATA_STOP: {
    return {
        ...state,
        player: { ...state.player, preloading: { active: false } },
    };
}
```

---

### 7. `cvat-ui/src/components/annotation-page/top-bar/annotation-menu.tsx` ✅

#### ① import 추가

```ts
import { LoadingOutlined } from '@ant-design/icons';
// (기존 Icon import 바로 아래)

import {
    finishCurrentJobAsync,
    preloadDataAsync,                    // 신규
    removeAnnotationsAsync as removeAnnotationsAsyncAction,
} from 'actions/annotation-actions';
```

#### ② `Actions` enum에 추가

```ts
REMOVE_ANNOTATIONS = 'remove_annotations',
PRELOAD_DATA = 'preload_data',    // 신규
RUN_ACTIONS = 'run_actions',
```

#### ③ `useSelector` 추가 (컴포넌트 상단, `jobInstance` 옆)

```ts
const isPreloading = useSelector(
    (state: CombinedState) => state.annotation.player.preloading.active,
);
```

#### ④ 메뉴 아이템 추가 (weight=30 REMOVE_ANNOTATIONS 블록 바로 뒤)

```ts
menuItems.push([{
    key: Actions.PRELOAD_DATA,
    label: isPreloading
        ? <><LoadingOutlined style={{ marginRight: 8 }} />Cancel preload</>
        : 'Preload data',
    onClick: () => { dispatch(preloadDataAsync()); },
}, 35]);
```

---

## 변경 파일 요약

| 파일 | 작업 |
|------|------|
| `cvat-core/src/frames.ts` | `compressedChunks` 캐시 추가, `getChunk` 래핑, `preloadChunk()` export, `getCachedChunks()` 수정 |
| `cvat-core/src/session.ts` | `frames.preload` 타입 선언 및 생성자 바인딩 |
| `cvat-core/src/session-implementation.ts` | `Job.prototype.frames.preload` implementation 추가 |
| `cvat-ui/src/actions/annotation-actions.ts` | `AnnotationActionTypes` 2개, `preloadDataAsync` thunk (신규 API 사용) |
| `cvat-ui/src/reducers/index.ts` | `PlayerState.preloading` 필드 |
| `cvat-ui/src/reducers/annotation-reducer.ts` | `defaultState` 초기값, reducer case 2개 |
| `cvat-ui/src/components/annotation-page/top-bar/annotation-menu.tsx` | 메뉴 아이템, `isPreloading` selector |

---

## 주의사항

- `startPreloadData` / `stopPreloadData`는 private (export 없음)
- `preloadDataAsync`는 파일 말미에 다른 export thunk들과 함께 위치
- `annotation-menu.tsx`는 `React.memo`로 감싸져 있으나 `useSelector`로 `isPreloading`을 구독하므로 리렌더링 정상 동작
- `compressedChunks`는 `clear(jobID)` 시 `delete frameDataCache[jobID]`와 함께 자동 GC
- `refreshJobCacheIfOutdated`에서 메타 갱신 시 `compressedChunks`도 초기화해야 함 (오래된 데이터 방지)
- preload 중 사용자가 프레임 이동 시: `activeChunkRequest`로 인해 현재 preload 청크 다운로드 완료 후 사용자 요청 처리. decode 경쟁은 `latestFrameDecodeRequest`로 해결(사용자 요청이 항상 이김). 고해상도 비디오에서 수 초 지연 가능하나 preload 특성상 허용 가능한 트레이드오프.

---

## 검증 방법

1. 80프레임 job 진입 → "Preload data" 클릭
2. 타임라인에 청크가 **왼쪽부터 오른쪽으로** 순서대로 채워지는지 확인 (실시간)
3. preload 완료 후 타임라인 바가 **전체 구간**에 걸쳐 있는지 확인 (앞쪽 소실 없음)
4. 프레임 0으로 이동 → 서버 재요청 없이 즉시 렌더링
5. preload 중 "Cancel preload" 클릭 → 즉시 중단, 스피너 사라짐
6. 재클릭 → 이미 캐시된 청크 건너뛰고(`if (chunkIndex in cache.compressedChunks) return`) 나머지만 진행
7. 개발자 도구 Network 탭 → preload 완료 후 프레임 이동 시 청크 HTTP 요청 없음 확인
