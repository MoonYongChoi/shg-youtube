# 유튜브 멤버십 영상 댓글 수집기

채널을 입력하면 영상 목록을 가져오고, 멤버십(회원전용) 영상을 체크해 모니터링 등록하면 댓글(본댓글 + 대댓글 1개)을 수집합니다.
Vercel Cron Jobs가 주기적으로 재수집해 댓글 수정/삭제 히스토리를 쌓습니다.

## 준비물

1. **YouTube API 키**: [Google Cloud Console](https://console.cloud.google.com/) → 프로젝트 생성 → "YouTube Data API v3" 활성화 → API 키 발급
2. **Postgres DB**: [Neon](https://neon.tech) 또는 Vercel 대시보드의 Storage 탭에서 Postgres 생성 → 연결 문자열 발급
3. `.env.local.example`을 복사해 `.env.local`을 만들고 값을 채웁니다:
   ```bash
   cp .env.local.example .env.local
   ```
   ```
   YOUTUBE_API_KEY=발급받은 키
   DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
   CRON_SECRET=임의의 랜덤 문자열
   ```

## 로컬 실행

```bash
npm install
npx prisma migrate dev --name init   # 테이블 생성
npm run dev
```

http://localhost:3000 에서 채널 URL/핸들(`@채널명`)을 입력해 사용합니다.

재수집 로직은 로컬에서 Vercel Cron 없이 직접 호출해 테스트할 수 있습니다:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/rescrape
```

## 배포 (Vercel)

1. Vercel 프로젝트에 `YOUTUBE_API_KEY`, `DATABASE_URL`, `CRON_SECRET` 환경변수를 동일하게 등록
2. `vercel.json`에 정의된 Cron Job(`/api/cron/rescrape`, 매일 자정 UTC 1회)이 자동으로 등록됩니다
   - Vercel Hobby(무료) 플랜은 Cron Job 실행 주기가 **하루 1회**로 제한되어 있어 기본값을 하루 1회로 맞춰뒀습니다. 더 자주(예: 6시간마다) 재수집하려면 Pro 플랜으로 업그레이드한 뒤 `vercel.json`의 `schedule`을 `"0 */6 * * *"` 등으로 바꾸세요
3. 배포 후 Vercel 대시보드의 **Cron Jobs** 탭에서 실행 로그 확인 가능

## 알아둘 점

- YouTube Data API에는 영상이 "멤버십 전용"인지 구분하는 필드가 없어 채널 영상 목록에서 **직접 체크**해야 합니다
- 멤버십 영상이라도 API 키만으로 댓글 조회가 가능한지는 채널/영상 설정에 따라 다를 수 있습니다. 403 오류가 나면 해당 영상은 API로 접근 불가능한 상태입니다
- 댓글 수정 히스토리는 **모니터링을 시작한 시점부터** 쌓입니다. 과거 수정 내역은 API로 복구할 수 없습니다
