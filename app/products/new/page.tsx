"use client";

import { FormEvent, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

type ProductForm = {
  title: string;
  price: string;
  location: string;
  status: "판매중" | "예약중" | "판매완료";
};

export default function NewProductPage() {
  const router = useRouter();
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>({
    title: "",
    price: "",
    location: "",
    status: "판매중",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 세션 확인 및 초기화
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user;

      if (!currentUser) {
        router.replace("/login");
        return;
      }

      setSessionUserId(currentUser.id);
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
      if (uploadError.message.includes("row-level security") || uploadError.message.includes("policy")) {
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
    if (!sessionUserId || !imageFile) {
      setError("모든 필드를 입력하고 이미지를 업로드해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 이미지 업로드
      const imageUrl = await uploadImage(imageFile);

      // 상품 등록
      const { error: insertError } = await supabase.from("products").insert({
        title: form.title,
        price: parseInt(form.price.replace(/,/g, ""), 10),
        location: form.location,
        image_url: imageUrl,
        status: form.status,
      });

      if (insertError) {
        throw new Error(`상품 등록 실패: ${insertError.message}`);
      }

      // 성공 시 홈으로 이동
      router.push("/");
    } catch (err) {
      console.error("상품 등록 오류:", err);
      setError(
        err instanceof Error ? err.message : "상품 등록에 실패했습니다."
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

  return (
    <section className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm px-8 py-10 border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">상품 등록</h1>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* 이미지 업로드 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              상품 이미지 <span className="text-red-500">*</span>
            </label>
            {imagePreview ? (
              <div className="relative">
                <div className="relative w-full aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                  <Image
                    src={imagePreview}
                    alt="상품 미리보기"
                    fill
                    className="object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleImageRemove}
                  className="mt-2 text-sm text-red-600 hover:text-red-700"
                >
                  이미지 제거
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
              required
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
              {isSubmitting ? "등록 중..." : "상품 등록"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

