# 품질관리 이슈 트래커

품질 이슈(발생일자/제품명/부품명/제조업체/발생위치/발생국가/시리얼번호/수량/설명/진행상황/처리자)를 등록·조회·수정하고,
불량 사진을 첨부하고, 이슈 상세 화면에서 카카오톡으로 요약 내용을 발송할 수 있는 웹 애플리케이션입니다.

**배포 주소: https://rayqc.vercel.app** (인터넷 어디서나 접속 가능, 로그인 없음)

> ⚠️ 로그인/비밀번호 등 접근 제어가 없습니다. 이 주소를 아는 사람은 누구나 이슈를 보고, 등록하고, 수정할 수
> 있습니다. 의도적으로 이렇게 만들었지만(요청사항), 필요해지면 간단한 공용 비밀번호 정도는 나중에 추가할 수 있습니다.
> 다만 **삭제**는 별도 확인 코드(`DELETE_CONFIRM_CODE` 환경변수, 서버에서만 비교하며 브라우저로는 전달되지 않음)를
> 입력해야만 가능하도록 막아뒀습니다 — 실수로 지우는 것과, 코드를 모르는 사람이 지우는 것 둘 다 방지합니다.

## 기술 스택

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS 4
- Postgres (Vercel Postgres/Neon, `pg` 클라이언트로 접속. 최초 요청 시 테이블 자동 생성)
- Vercel Blob (불량 사진 저장 — 업로드 전 브라우저에서 자동 리사이즈/압축)
- 카카오 로그인 JS SDK ("나에게 보내기" 방식으로 처리자 본인에게 요약 발송)
- Vercel 배포 + GitHub 저장소 연결 (https://github.com/vopstar2-stack/quality-issue-tracker, push하면 자동 재배포)

## 배포/코드 관리

- `git push`하면 GitHub 연결을 통해 Vercel이 자동으로 재배포합니다.
- 수동 배포: `npx vercel --prod`
- 환경변수 확인/추가: `npx vercel env ls` / `npx vercel env add <이름> production`
  (`NEXT_PUBLIC_*`는 클라이언트 번들에 굳혀 들어가므로, 값 변경 후 반드시 재배포해야 반영됩니다.)
- 짧은 별칭 도메인 추가: `npx vercel alias set <기존도메인> <새이름>.vercel.app`
- Vercel의 기본 "Deployment Protection(SSO)"는 프로젝트 생성 시 켜져 있고, 대표 도메인이 아닌 별칭
  도메인(`rayqc.vercel.app` 등)에는 로그인 요구 화면을 띄웁니다. 이 프로젝트는 누구나 접속해야 해서
  `npx vercel project protection disable quality-issue-tracker --sso`로 꺼두었습니다.
- 배포가 `BLOCKED` 상태로 멈추고 안 넘어가면(`npx vercel ls`로 확인), Vercel이 보낸
  "Failed deployment ... not a member of the team" 메일을 확인하세요. 로컬 git 커밋 이메일이 GitHub 계정의
  인증된 이메일과 다르면, private 저장소에 대해 Vercel이 배포를 막습니다. 저장소를 public으로 바꾸면 해결됩니다
  (Pro 결제 없이 되는 가장 쉬운 방법). 이 프로젝트도 그렇게 해서 public입니다 — `.env*`는 항상 `.gitignore`
  처리되어 있으니 커밋 기록에 비밀키가 없는지 가끔 `git log --all -p -- .env.local`로 확인하세요.
- `.vercel app` 별칭(`rayqc.vercel.app` 등 `vercel alias set`으로 직접 추가한 도메인)은 **그 순간의 배포에
  고정**되고, 새로 배포해도 자동으로 안 따라옵니다(대표 도메인인 `quality-issue-tracker.vercel.app`만
  자동으로 최신 배포를 가리킴). 배포할 때마다 `npx vercel alias set <새배포url> rayqc.vercel.app`을 다시
  실행해야 `rayqc.vercel.app`이 최신 코드를 보여줍니다.

## 사진 저장 용량 참고

Vercel Blob 무료(Hobby) 한도는 **월 1GB 저장 / 10GB 전송**입니다. 다 쓰면 요금이 청구되는 게 아니라
**그 달 남은 기간 동안 사진 업로드가 막힙니다**(다음 달 리셋, 또는 Pro 요금제로 업그레이드). 업로드 시 클라이언트에서
자동으로 가로 최대 1600px/JPEG 압축을 거치므로(`src/lib/image-resize.ts`), 원본 그대로 저장할 때보다 훨씬
오래 버팁니다.

## 로컬 개발

```bash
npm install
npm run dev
```

로컬에서 실행하려면 `.env.local`에 `POSTGRES_URL`, `BLOB_READ_WRITE_TOKEN`이 있어야 합니다. 이미 이 프로젝트와
연결되어 있으니 `npx vercel env pull .env.local`로 받아오면 됩니다. 브라우저에서 http://localhost:3000 접속.

> 로컬 개발용 DB는 배포된 사이트와 **같은 Postgres**를 보고 있습니다(Hobby 요금제라 dev/prod DB가 분리되어
> 있지 않음). 로컬에서 테스트로 만든 이슈가 실제 배포 사이트에도 그대로 보이니, 테스트 데이터는 확인 후 지워주세요.

## 카카오톡 발송 기능 설정

이 프로젝트는 카카오 로그인 후 **로그인한 사용자 본인의 카카오톡으로** 이슈 요약을 보내는 "나에게 보내기" 방식입니다.
처리자가 본인 카카오 계정으로 로그인한 뒤 버튼을 누르면 됩니다(제3자에게 자동 발송은 아닙니다).

카카오 JS SDK v2는 팝업 로그인을 지원하지 않고 **페이지 전체가 카카오 로그인 화면으로 이동한 뒤 다시 돌아오는 방식**만
지원합니다. 그래서 로그인 코드를 토큰으로 교환하는 작업은 브라우저가 아니라 우리 서버(`/api/kakao/callback`)에서
처리하며, 이때 **REST API 키**가 별도로 필요합니다.

1. https://developers.kakao.com 에서 애플리케이션 생성
2. **제품 설정 > 카카오 로그인**에서 활성화 설정을 ON
3. **제품 설정 > 카카오톡 메시지** (카카오 로그인과는 별도의 메뉴) 에서 "카카오톡 메시지 사용"을 ON
   - 이 제품을 켜야 동의항목 목록에 "카카오톡 메시지 전송"이 나타납니다.
4. **카카오 로그인 > 동의항목**에서 "카카오톡 메시지 전송(talk_message)" 항목을 사용함으로 설정
5. **앱 > 플랫폼 키**로 이동해 아래를 설정합니다. (⚠️ 도메인/Redirect URI는 **REST API 키가 아니라 실제로
   `Kakao.Auth.authorize()` 호출에 쓰이는 JavaScript 키 카드에** 등록해야 합니다. REST API 키 쪽에 등록해도
   콘솔이 허용은 해주지만, 로그인 요청 자체가 JS 키로 나가기 때문에 "KOE006 Admin Settings Issue" 오류가 납니다.)

   - **JavaScript 키 하나당 도메인/Redirect URI를 딱 하나씩만** 등록할 수 있습니다(여러 개를 추가하는 목록이
     아니라 단일 값이 덮어써짐). 그래서 이 프로젝트는 **JS 키를 2개** 씁니다:
     - `Default JS Key` — 로컬 개발용. 도메인 `http://localhost:3000`, Redirect URI
       `http://localhost:3000/api/kakao/callback`
     - `Production (Vercel)` — 배포용. 도메인 `https://rayqc.vercel.app`, Redirect URI
       `https://rayqc.vercel.app/api/kakao/callback`
       (원래 도메인이던 `quality-issue-tracker.vercel.app`도 같은 배포를 가리키는 별칭으로 계속 살아있지만,
       카카오 로그인은 `rayqc.vercel.app`으로만 동작합니다.)
     - "JavaScript 키 추가"로 새 키를 만들 때 이름/도메인/Redirect URI를 같이 입력해 저장하면 됩니다.
     - 입력 후 옆의 "+"를 눌러도 화면에 즉시 표시되지 않을 수 있습니다. 입력창에서 **Enter 키**를 누르면 바로
       저장됩니다(그게 정상 동작입니다). 저장 후 카드에 "JS SDK 도메인", "로그인 리다이렉트 URI" 태그가 보이면
       성공입니다.
     - 도메인/URI는 프로토콜+호스트+포트까지만 정확히 입력하세요. 끝에 슬래시(`/`)나 경로가 붙으면 "유효하지 않은
       URL Host" 오류가 납니다.
   - **REST API 키** 카드 → 값 아래 "클라이언트 시크릿" 태그를 클릭 → **카카오 로그인** 항목의 "코드"를 복사
     - 최근 정책으로 REST API 키를 새로 발급하면 **클라이언트 시크릿이 기본으로 켜져** 있습니다. 켜진 상태에서
       `client_secret` 없이 토큰을 요청하면 "KOE010 Bad client credentials" 오류가 납니다. 이 코드를 아래
       `KAKAO_CLIENT_SECRET`에 넣으면 해결됩니다(끄고 싶다면 "활성화" 토글을 OFF로 바꿔도 됩니다). REST API
       키/시크릿은 로컬·배포 공용으로 하나만 있으면 됩니다.
6. `NEXT_PUBLIC_KAKAO_JS_KEY`는 환경별로 다른 값을 씁니다:
   - 로컬 `.env.local` → `Default JS Key` 값
   - Vercel Production 환경변수 → `Production (Vercel)` 키 값
     (`npx vercel env add NEXT_PUBLIC_KAKAO_JS_KEY production`, 변경 후 `npx vercel --prod`로 재배포 필요)
   - `KAKAO_REST_API_KEY`, `KAKAO_CLIENT_SECRET`은 로컬/배포 동일한 값 사용
7. `.env.local.example`을 참고해 로컬 `.env.local`을 채웁니다.
8. **앱 > 제품 링크 관리 > 웹 도메인**의 "기본" 도메인을 실제 서비스 도메인(`https://rayqc.vercel.app`)으로
   맞춰주세요. ⚠️ 여기 등록된 **"기본 웹 도메인"이 카카오톡 메시지의 링크(자세히 보기 버튼)에 강제로 적용됩니다** —
   `/api/kakao/callback`에서 아무리 정확한 URL을 만들어 보내도, 여기 기본값이 옛날 도메인(예:
   `http://127.0.0.1:3000`, 맨 처음 로컬 개발용으로 등록했던 값)으로 남아있으면 카톡 메시지의 "자세히 보기"
   버튼이 그 옛날 도메인으로 열립니다. 서버 로그(`vercel logs`)로 origin 계산이 매번 정확한데도 링크만 이상하게
   나온다면 100% 이 설정입니다. 최대 10개까지 등록 가능하니 로컬/배포 도메인을 같이 등록해두고, 배포 도메인을
   기본으로 지정하세요.

설정이 없으면 발송 버튼은 비활성화되고, 클릭 시 안내 메시지가 표시됩니다. 발송 성공/실패 결과는 카카오 로그인 후
이슈 상세 페이지로 돌아오면 상단에 배너로 표시됩니다(실패 시 구체적인 원인 메시지 포함).

> 참고: 이 방식은 무료이며 별도 심사가 필요 없지만, 로그인한 사용자 자신에게만 보낼 수 있습니다.
> 처리자가 아닌 제3자의 번호로 직접 발송하려면 카카오 비즈니스 채널 + 알림톡(솔라피, NHN Cloud 등 중계업체)
> 연동이 필요하며, 이는 별도 계약/템플릿 사전승인이 필요해 이번 구현 범위에는 포함하지 않았습니다.

## 데이터 위치

- Vercel Postgres(Neon). 연결 문자열은 `POSTGRES_URL` 환경변수 하나로 관리됩니다 (`src/lib/db.ts`).
- 불량 사진 파일은 Vercel Blob에 저장되고, DB에는 URL만 저장됩니다 (`src/lib/photos.ts`).
- 다른 Postgres 호스팅으로 옮기고 싶다면 `POSTGRES_URL` 값만 바꾸면 됩니다.

## 주요 화면

- `/` : 이슈 목록
- `/issues/new` : 신규 이슈 등록
- `/issues/[id]` : 이슈 상세/수정 + 불량 사진 첨부 + 카카오톡 요약 발송 + 삭제
