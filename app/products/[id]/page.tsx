"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ProductActions from "./ProductActions";

type Product = {
  id: number;
  userId: string;
  title: string;
  description: string | null;
  price: number;
  location: string;
  imageUrl: string;
  likes: number;
  status: "판매중" | "예약중" | "판매완료";
  createdAt: string;
};

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [productId, setProductId] = useState<number | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    const init = async () => {
      // params에서 ID 가져오기
      const resolvedParams = await params;
      const id = parseInt(resolvedParams.id, 10);

      if (isNaN(id)) {
        router.replace("/");
        return;
      }

      setProductId(id);

      // 세션 확인
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id || null;
      setCurrentUserId(userId);

      // 상품 데이터 가져오기
      const { data: productData, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !productData) {
        router.replace("/");
        return;
      }

      setProduct({
        id: productData.id,
        userId: productData.user_id,
        title: productData.title,
        description: productData.description,
        price: productData.price,
        location: productData.location,
        imageUrl: productData.image_url,
        likes: productData.likes || 0,
        status: productData.status as "판매중" | "예약중" | "판매완료",
        createdAt: productData.created_at,
      });

      setIsLoading(false);
    };

    init();
  }, [params, router]);

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-sm">로딩 중...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-sm">상품을 찾을 수 없습니다.</div>
      </div>
    );
  }

  const isOwner = currentUserId === product.userId;

  const handleStatusChange = async (
    newStatus: "판매중" | "예약중" | "판매완료"
  ) => {
    if (!productId || !isOwner) return;

    setIsUpdatingStatus(true);

    try {
      const { error } = await supabase
        .from("products")
        .update({ status: newStatus })
        .eq("id", productId)
        .eq("user_id", currentUserId);

      if (error) {
        throw error;
      }

      // 상태 업데이트
      setProduct((prev) => {
        if (!prev) return null;
        return { ...prev, status: newStatus };
      });
    } catch (error) {
      console.error("상태 변경 오류:", error);
      alert("상태 변경에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-6 sm:py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* 상품 이미지 */}
          <div className="relative w-full aspect-square bg-gray-100">
            <Image
              src={product.imageUrl}
              alt={product.title}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
            {product.status && (
              <div className="absolute top-4 right-4">
                <span
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
                    product.status === "판매완료"
                      ? "bg-gray-800 text-white"
                      : product.status === "예약중"
                      ? "bg-orange-500 text-white"
                      : "bg-green-500 text-white"
                  }`}
                >
                  {product.status}
                </span>
              </div>
            )}
          </div>

          {/* 상품 정보 */}
          <div className="p-6 sm:p-8">
            {/* 헤더: 제목, 가격, 액션 버튼 */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {product.title}
                </h1>
                <p className="text-3xl sm:text-4xl font-bold text-orange-600">
                  {product.price.toLocaleString()}원
                </p>
              </div>
              {isOwner && productId && (
                <ProductActions productId={productId} />
              )}
            </div>

            {/* 상품 상세 정보 */}
            <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium mr-2">지역:</span>
                <span>{product.location}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium mr-2">관심:</span>
                <span className="flex items-center gap-1">
                  <span>❤️</span>
                  <span>{product.likes}</span>
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium mr-2">등록일:</span>
                <span>
                  {new Date(product.createdAt).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              {/* 상태 변경 (소유자만) */}
              {isOwner && (
                <div className="flex items-center text-sm">
                  <span className="font-medium mr-2 text-gray-700">상태:</span>
                  <select
                    value={product.status}
                    onChange={(e) =>
                      handleStatusChange(
                        e.target.value as "판매중" | "예약중" | "판매완료"
                      )
                    }
                    disabled={isUpdatingStatus}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-60 disabled:cursor-not-allowed bg-white"
                  >
                    <option value="판매중">판매중</option>
                    <option value="예약중">예약중</option>
                    <option value="판매완료">판매완료</option>
                  </select>
                  {isUpdatingStatus && (
                    <span className="ml-2 text-xs text-gray-500">
                      저장 중...
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 상품 설명 */}
            {product.description && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  상품 설명
                </h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {product.description}
                  </p>
                </div>
              </div>
            )}

            {/* 하단 버튼 */}
            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <Link
                href="/"
                className="flex-1 px-4 py-3 text-center border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                목록으로
              </Link>
              {!isOwner && (
                <button className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-medium">
                  채팅하기
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

