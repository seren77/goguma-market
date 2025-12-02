import Link from "next/link";
import Image from "next/image";

export interface Product {
  id: number;
  title: string;
  price: number;
  location: string;
  imageUrl: string;
  likes: number;
  status?: "판매중" | "예약중" | "판매완료";
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="block bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* 상품 이미지 */}
      <div className="relative w-full aspect-square bg-gray-100">
        <Image
          src={product.imageUrl}
          alt={product.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {product.status && (
          <div className="absolute top-2 right-2">
            <span
              className={`px-2 py-1 text-xs font-medium rounded ${
                product.status === "판매완료"
                  ? "bg-gray-800 text-white"
                  : product.status === "예약중"
                  ? "bg-orange-500 text-white"
                  : product.status === "판매중"
                  ? "bg-green-500 text-white"
                  : "bg-transparent"
              }`}
            >
              {product.status}
            </span>
          </div>
        )}
      </div>

      {/* 상품 정보 */}
      <div className="p-3 sm:p-4">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 line-clamp-2">
          {product.title}
        </h3>
        <p className="text-base sm:text-lg font-bold text-gray-900 mb-1">
          {product.price.toLocaleString()}원
        </p>
        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
          <span>{product.location}</span>
          {product.likes > 0 && (
            <span className="flex items-center gap-1">
              <span>❤️</span>
              <span>{product.likes}</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

