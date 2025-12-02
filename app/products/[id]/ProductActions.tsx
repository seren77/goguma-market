"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface ProductActionsProps {
  productId: number;
}

export default function ProductActions({ productId }: ProductActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    if (!confirm("정말로 이 상품을 삭제하시겠습니까?")) {
      return;
    }

    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) {
        throw error;
      }

      // 삭제 성공 시 홈으로 이동
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("상품 삭제 오류:", error);
      alert("상품 삭제에 실패했습니다. 다시 시도해주세요.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Link
        href={`/products/${productId}/edit`}
        className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
      >
        수정
      </Link>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isDeleting ? "삭제 중..." : "삭제"}
      </button>
    </div>
  );
}

