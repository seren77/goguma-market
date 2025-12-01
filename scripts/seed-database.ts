import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { join } from "path";

// .env.local 파일 로드
dotenv.config({ path: join(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const dummyProducts = [
  {
    title: "아이폰 14 Pro Max 256GB",
    price: 850000,
    location: "서울시 강남구",
    image_url: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop",
    likes: 12,
    status: "판매중",
  },
  {
    title: "맥북 프로 14인치 M2",
    price: 1500000,
    location: "서울시 서초구",
    image_url: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=400&fit=crop",
    likes: 25,
    status: "판매중",
  },
  {
    title: "에어팟 프로 2세대",
    price: 280000,
    location: "서울시 마포구",
    image_url: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400&h=400&fit=crop",
    likes: 8,
    status: "예약중",
  },
  {
    title: "나이키 운동화 270",
    price: 120000,
    location: "서울시 송파구",
    image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
    likes: 15,
    status: "판매중",
  },
  {
    title: "갤럭시 워치 6 클래식",
    price: 350000,
    location: "서울시 강동구",
    image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
    likes: 7,
    status: "판매중",
  },
  {
    title: "닌텐도 스위치 OLED",
    price: 420000,
    location: "서울시 노원구",
    image_url: "https://images.unsplash.com/photo-1606144048614-b4314fe3a0a6?w=400&h=400&fit=crop",
    likes: 20,
    status: "판매중",
  },
  {
    title: "무선 이어폰 소니 WH-1000XM5",
    price: 380000,
    location: "서울시 영등포구",
    image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    likes: 18,
    status: "판매중",
  },
  {
    title: "아이패드 프로 11인치",
    price: 950000,
    location: "서울시 종로구",
    image_url: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop",
    likes: 30,
    status: "판매완료",
  },
];

async function seedDatabase() {
  try {
    console.log("데이터베이스에 더미 데이터 삽입 중...");

    // 기존 데이터 확인
    const { data: existingData } = await supabase.from("products").select("id").limit(1);

    if (existingData && existingData.length > 0) {
      console.log("이미 데이터가 존재합니다. 삽입을 건너뜁니다.");
      return;
    }

    // 데이터 삽입
    const { data, error } = await supabase.from("products").insert(dummyProducts).select();

    if (error) {
      throw error;
    }

    console.log(`✅ ${data.length}개의 상품이 성공적으로 삽입되었습니다!`);
  } catch (error) {
    console.error("❌ 데이터 삽입 중 오류 발생:", error);
    process.exit(1);
  }
}

seedDatabase();

