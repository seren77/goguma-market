"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      setErrorMessage(error);
      return;
    }

    if (!code) {
      setErrorMessage("잘못된 접근입니다. 다시 로그인해 주세요.");
      return;
    }

    const exchangeCode = async () => {
      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error(exchangeError);
        setErrorMessage("로그인 세션 생성 중 오류가 발생했습니다.");
        return;
      }

      router.replace("/");
      router.refresh();
    };

    exchangeCode();
  }, [router, searchParams]);

  return (
    <section className="bg-gray-50 min-h-screen flex items-center justify-center">
      <div className="bg-white border border-gray-100 rounded-2xl px-8 py-10 max-w-md w-full text-center shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 mb-4">
          소셜 로그인 처리 중...
        </h1>
        {!errorMessage ? (
          <p className="text-sm text-gray-500">
            잠시만 기다려 주세요. 로그인 정보를 확인하고 있습니다.
          </p>
        ) : (
          <p className="text-sm text-red-600">{errorMessage}</p>
        )}
      </div>
    </section>
  );
}



