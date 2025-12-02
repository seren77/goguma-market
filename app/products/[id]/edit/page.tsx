"use client";

import { FormEvent, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { notFound } from "next/navigation";

type ProductForm = {
  title: string;
  description: string;
  price: string;
  location: string;
  status: "판매중" | "예약중" | "판매완료";
};

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [productId, setProductId] = useState<number | null>(null);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>({
    title: "",
    description: "",
    price: "",
    location: "",
    status: "판매중",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 초기화 및 상품 데이터 로드
  useEffect(() => {
    const init = async () => {
      // 세션 확인
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData.session?.user;

      if (!currentUser) {
        router.replace("/login");
        return;
      }

      setSessionUserId(currentUser.id);

      // params에서 상품 ID 가져오기
      const resolvedParams = await params;
      const parsedId = parseInt(resolvedParams.id, 10);

      if (isNaN(parsedId)) {
        router.replace("/");
        return;
      }

      setProductId(parsedId);

      // 상품 데이터 로드
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("id", parsedId)
        .single();

      if (productError || !product) {
        router.replace("/");
        return;
      }

      // 본인 상품인지 확인
      if (product.user_id !== currentUser.id) {
        alert("본인의 상품만 수정할 수 있습니다.");
        router.replace(`/products/${parsedId}`);
        return;
      }

      // 폼 데이터 설정
      setForm({
        title: product.title,
        description: product.description || "",
        price: product.price.toString(),
        location: product.location,
        status: product.status as "판매중" | "예약중" | "판매완료",
      });

      setExistingImageUrl(product.image_url);
      setIsLoading(false);
    };

    init();
  }, [router]);

  const handleChange = (
    field: keyof ProductForm,
    value: string | "판매중" | "예약중" | "판매완료"
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 이미지 파일인지 확인
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    // 파일 크기 확인 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      setError("이미지 크기는 10MB 이하여야 합니다.");
      return;
    }

    setImageFile(file);
    setError(null);

    // 미리보기 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${sessionUserId}-${Date.now()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from("product-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      // RLS 정책 오류인 경우 더 명확한 메시지 제공
      if (
        uploadError.message.includes("row-level security") ||
        uploadError.message.includes("policy")
      ) {
        throw new Error(
          `이미지 업로드 실패: Storage 정책이 설정되지 않았습니다. Supabase 대시보드에서 'product-images' 버킷의 Policies 탭에서 INSERT 정책을 추가해주세요. 자세한 내용은 README-SETUP.md를 참고하세요.`
        );
      }
      throw new Error(`이미지 업로드 실패: ${uploadError.message}`);
    }

    // 공개 URL 가져오기
    const {
      data: { publicUrl },
    } = supabase.storage.from("product-images").getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sessionUserId || !productId) {
      setError("필수 정보가 누락되었습니다.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let imageUrl = existingImageUrl;

      // 새 이미지가 업로드된 경우
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      if (!imageUrl) {
        throw new Error("이미지 URL이 필요합니다.");
      }

      // 상품 수정
      const { error: updateError } = await supabase
        .from("products")
        .update({
          title: form.title,
          description: form.description || null,
          price: parseInt(form.price.replace(/,/g, ""), 10),
          location: form.location,
          image_url: imageUrl,
          status: form.status,
        })
        .eq("id", productId)
        .eq("user_id", sessionUserId); // 본인 상품인지 다시 확인

      if (updateError) {
        throw new Error(`상품 수정 실패: ${updateError.message}`);
      }

      // 성공 시 상품 상세 페이지로 이동
      router.push(`/products/${productId}`);
      router.refresh();
    } catch (err) {
      console.error("상품 수정 오류:", err);
      setError(
        err instanceof Error ? err.message : "상품 수정에 실패했습니다."
      );
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <section className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-sm">로딩 중...</div>
      </section>
    );
  }

  const displayImage = imagePreview || existingImageUrl;

  return (
    <section className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm px-8 py-10 border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">상품 수정</h1>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* 이미지 업로드 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              상품 이미지 <span className="text-red-500">*</span>
            </label>
            {displayImage ? (
              <div className="relative">
                <div className="relative w-full aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                  <Image
                    src={displayImage}
                    alt="상품 이미지"
                    fill
                    className="object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleImageRemove}
                  className="mt-2 text-sm text-red-600 hover:text-red-700"
                >
                  이미지 변경
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 transition-colors bg-gray-50"
              >
                <svg
                  className="w-12 h-12 text-gray-400 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm text-gray-600">이미지를 클릭하여 업로드</p>
                <p className="text-xs text-gray-400 mt-1">
                  최대 10MB, JPG, PNG, GIF
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          {/* 상품명 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              상품명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(event) => handleChange("title", event.target.value)}
              placeholder="상품명을 입력하세요"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              maxLength={100}
              required
            />
          </div>

          {/* 상품 설명 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              상품 설명
            </label>
            <textarea
              value={form.description}
              onChange={(event) =>
                handleChange("description", event.target.value)
              }
              placeholder="상품에 대한 자세한 설명을 입력하세요"
              rows={5}
              maxLength={1000}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
            <p className="text-xs text-gray-400">
              {form.description.length} / 1000자
            </p>
          </div>

          {/* 가격 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              가격 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={form.price}
                onChange={(event) => {
                  const value = event.target.value.replace(/[^0-9]/g, "");
                  handleChange("price", value);
                }}
                placeholder="0"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 pr-12"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                원
              </span>
            </div>
            {form.price && (
              <p className="text-xs text-gray-400">
                {parseInt(form.price.replace(/,/g, ""), 10).toLocaleString()}원
              </p>
            )}
          </div>

          {/* 지역 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              지역 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(event) => handleChange("location", event.target.value)}
              placeholder="예: 서울시 강남구"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              maxLength={50}
              required
            />
          </div>

          {/* 판매 상태 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              판매 상태 <span className="text-red-500">*</span>
            </label>
            <select
              value={form.status}
              onChange={(event) =>
                handleChange(
                  "status",
                  event.target.value as "판매중" | "예약중" | "판매완료"
                )
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            >
              <option value="판매중">판매중</option>
              <option value="예약중">예약중</option>
              <option value="판매완료">판매완료</option>
            </select>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 제출 버튼 */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 border border-gray-300 text-gray-700 rounded-xl py-3 text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-orange-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-orange-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "수정 중..." : "상품 수정"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

