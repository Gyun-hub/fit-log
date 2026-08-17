# Fit Log — 프로젝트 가이드

## 브랜치 배포 전략

```
feature/* → stage → main
```

- **`main`**: 배포 브랜치. Cloudflare Workers(`fit-log`)가 이 브랜치를 보고 자동 배포함.
  직접 커밋 금지, `stage`에서 merge로만 반영.
- **`stage`**: 통합 브랜치. 여러 `feature/*` 브랜치를 여기에 먼저 합쳐서 같이 돌아가는지 확인.
- **`feature/*`**: 작업 단위 브랜치. 기능/작업 하나당 하나. `main`에서 분기.
  이름 예: `feature/db-primary-sync`, `feature/mobile-responsive-deploy`

작업 순서:
1. `main`에서 `feature/작업명` 브랜치 생성
2. 작업 완료 후 `stage`로 merge
3. `stage`에서 통합 테스트 (로컬 dev 서버로 확인)
4. 문제없으면 `stage` → `main` merge, push (이 시점에 실제 배포 트리거됨)

**main에 push = 실배포**이므로, stage에서 검증 끝난 것만 올릴 것.

## 배포 (Cloudflare Workers)

- 설정 파일: `wrangler.toml` (정적 자산 서빙 방식, `[assets] directory = "./dist"`)
- 주의: Cloudflare가 Vite 프로젝트를 자동 감지해서 자체 Wrangler 설정을 시도하는데,
  그 자동연동은 Vite 6+ 필요함. 이 프로젝트는 Vite 5라 `wrangler.toml`로 직접 설정 지정해서 우회함.
  (Vite 6 업그레이드하지 않는 한 이 설정 유지할 것)
- 빌드: `npm run build` (tsc + vite build) → `dist/`
- 배포 URL: `fit-log.nn-gyunx.workers.dev`

### Cloudflare 환경변수 (필수, 아직 미설정)

`.env.local`은 `.gitignore`에 걸려있어서 Git엔 안 올라감. 로컬 dev는 `.env.local` 파일로 동작하지만,
Cloudflare 빌드 서버는 이 파일이 없어서 빌드 시 Supabase 연동이 빠짐.

**Cloudflare 대시보드 → fit-log Worker → Settings → Variables**에 아래 추가해야 함:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (publishable key)

## 아키텍처 요약

- React 18 + TypeScript + Vite, `HashRouter` 사용 (서버 라우팅 불필요)
- 데이터 저장: Supabase가 진짜 저장소, localStorage는 그 캐시일 뿐
  - 앱 진입 시 "동기화 코드" 필수 입력 (로그인 아님, 코드가 곧 사용자 식별자)
  - 코드 연결 시 DB에서 pull → 로컬 캐시 갱신
  - 저장/수정/삭제 시 로컬 캐시 갱신 + DB push
  - 연결 해제 시 로컬 캐시 완전 삭제
  - 관련 파일: `src/sync.ts`, `src/supabaseClient.ts`, `src/components/SyncGate.tsx`, `src/components/SyncBar.tsx`, `src/storage.ts`
- 판정 로직: `src/judge.ts` (기획 배경은 `docs/기획서.md` 참고)

## Supabase 테이블

```sql
create table public.fitlog_sync (
  sync_key text primary key,
  records jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.fitlog_sync enable row level security;

create policy "public read/write"
on public.fitlog_sync
for all
using (true)
with check (true);
```

RLS가 `using(true)`로 열려있어서 코드만 알면 누구나 접근 가능함 (로그인 없는 트레이드오프, 의도된 설계).
