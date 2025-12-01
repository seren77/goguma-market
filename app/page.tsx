import ProductCard, { Product } from "./components/ProductCard";
import { supabase } from "@/lib/supabase";

async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  // 데이터베이스 스키마를 Product 인터페이스에 맞게 변환
  return (data || []).map((item) => ({
    id: item.id,
    title: item.title,
    price: item.price,
    location: item.location,
    imageUrl: item.image_url,
    likes: item.likes || 0,
    status: item.status as "판매중" | "예약중" | "판매완료" | undefined,
  }));
}

export default async function Home() {
  const products = await getProducts();
  return (
    <div className="bg-gray-50 min-h-screen py-6 sm:py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* 페이지 타이틀 */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            중고거래 인기 상품
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            지금 가장 인기 있는 중고 상품을 만나보세요
          </p>
        </div>

        {/* 상품 그리드 */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">등록된 상품이 없습니다.</p>
            <p className="text-gray-400 text-sm mt-2">
              데이터베이스에 더미 데이터를 삽입하려면{" "}
              <code className="bg-gray-100 px-2 py-1 rounded">npm run seed</code> 명령을 실행하세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
