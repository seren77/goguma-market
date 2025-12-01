-- 상품 테이블 생성
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  price INTEGER NOT NULL,
  location TEXT NOT NULL,
  image_url TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  status TEXT DEFAULT '판매중' CHECK (status IN ('판매중', '예약중', '판매완료')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

