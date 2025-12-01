# 고구마마켓 데이터베이스 설정 가이드

## 1. 환경 변수 설정

`.env.local` 파일을 프로젝트 루트에 생성하고 다음 변수를 추가하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (선택사항, seed 스크립트용)
```

## 2. 데이터베이스 스키마 생성

Supabase 대시보드의 SQL Editor에서 `supabase/schema.sql` 파일의 내용을 실행하세요.

또는 Supabase CLI를 사용하는 경우:

```bash
supabase db push
```

## 3. 더미 데이터 삽입

의존성 설치 후 seed 스크립트를 실행하세요:

```bash
npm install
npm run seed
```

또는 Supabase 대시보드의 SQL Editor에서 직접 데이터를 삽입할 수도 있습니다.

## 4. 확인

개발 서버를 실행하고 메인 페이지에서 상품 목록이 표시되는지 확인하세요:

```bash
npm run dev
```

