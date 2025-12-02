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

### 기존 테이블이 있는 경우 마이그레이션

기존에 `products` 테이블이 있다면, 다음 SQL을 실행하여 컬럼을 추가하세요:

```sql
-- user_id 컬럼 추가
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- description 컬럼 추가
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS description TEXT;

-- user_id에 NOT NULL 제약조건 추가 (기존 데이터가 있다면 먼저 데이터를 처리해야 함)
-- ALTER TABLE products ALTER COLUMN user_id SET NOT NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);

-- RLS 활성화 및 정책 추가
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 기존 정책이 있다면 삭제 후 재생성
DROP POLICY IF EXISTS "모든 사용자가 상품 조회 가능" ON products;
DROP POLICY IF EXISTS "인증된 사용자가 상품 등록 가능" ON products;
DROP POLICY IF EXISTS "사용자가 자신의 상품만 수정 가능" ON products;
DROP POLICY IF EXISTS "사용자가 자신의 상품만 삭제 가능" ON products;

-- 정책 재생성
CREATE POLICY "모든 사용자가 상품 조회 가능"
  ON products
  FOR SELECT
  USING (true);

CREATE POLICY "인증된 사용자가 상품 등록 가능"
  ON products
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "사용자가 자신의 상품만 수정 가능"
  ON products
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "사용자가 자신의 상품만 삭제 가능"
  ON products
  FOR DELETE
  USING (auth.uid() = user_id);
```

## 3. Storage 버킷 생성 (상품 이미지 업로드용)

Supabase 대시보드에서 Storage를 설정해야 합니다:

1. Supabase 대시보드 → Storage 메뉴로 이동
2. "Create a new bucket" 클릭
3. 버킷 이름: `product-images`
4. Public bucket: **체크** (공개 버킷으로 설정)
5. "Create bucket" 클릭

### Storage 정책 설정

버킷 생성 후, **Policies** 탭에서 다음 정책을 추가하세요:

#### 정책 1: 업로드 허용 (인증된 사용자만)

1. "New Policy" 클릭
2. "For full customization" 선택
3. Policy name: `Allow authenticated users to upload`
4. Allowed operation: `INSERT` 선택
5. Policy definition에 다음 코드 입력:
```sql
bucket_id = 'product-images' AND auth.role() = 'authenticated'
```
6. "Review" → "Save policy" 클릭

#### 정책 2: 읽기 허용 (모든 사용자)

1. "New Policy" 클릭
2. "For full customization" 선택
3. Policy name: `Allow public read access`
4. Allowed operation: `SELECT` 선택
5. Policy definition에 다음 코드 입력:
```sql
bucket_id = 'product-images'
```
6. "Review" → "Save policy" 클릭

**참고:** 정책이 제대로 적용되지 않으면, 버킷의 "Public bucket" 옵션이 체크되어 있는지 확인하세요. 또한 정책 정의에서 따옴표가 정확한지 확인하세요.

## 4. 더미 데이터 삽입

의존성 설치 후 seed 스크립트를 실행하세요:

```bash
npm install
npm run seed
```

또는 Supabase 대시보드의 SQL Editor에서 직접 데이터를 삽입할 수도 있습니다.

## 5. 확인

개발 서버를 실행하고 메인 페이지에서 상품 목록이 표시되는지 확인하세요:

```bash
npm run dev
```


