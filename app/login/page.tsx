"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isKakaoLoading, setIsKakaoLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.replace("/");
  };

  const handleKakaoLogin = async () => {
    try {
      setErrorMessage(null);
      setIsKakaoLoading(true);

      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : undefined;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: {
          redirectTo,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setIsKakaoLoading(false);
      }
      // 성공 시에는 카카오 인증 페이지로 리다이렉트되므로 여기서 별도 처리 없음
    } catch (error) {
      console.error(error);
      setIsKakaoLoading(false);
      setErrorMessage("카카오 로그인 중 오류가 발생했습니다.");
    }
  };

  return (
    <section className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm px-8 py-10 border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">로그인</h1>
          <p className="text-sm text-gray-500 mt-2">
            등록된 이메일과 비밀번호를 입력해 주세요.
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleLogin}>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="your@email.com"
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-700"
            >
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || isKakaoLoading}
            className="w-full bg-orange-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-orange-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? "로그인 중..." : "이메일로 로그인"}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">또는</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <button
          type="button"
          onClick={handleKakaoLogin}
          disabled={isKakaoLoading || isLoading}
          className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-[#FEE500] text-gray-900 py-3 text-sm font-semibold hover:brightness-95 transition-colors disabled:opacity-60 disabled:cursor-not-allowed border border-yellow-300"
        >
          <span className="text-lg">🟡</span>
          <span>{isKakaoLoading ? "카카오로 이동 중..." : "카카오로 로그인"}</span>
        </button>
        {errorMessage && (
          <p className="mt-6 text-sm text-center text-red-600">{errorMessage}</p>
        )}
        <p className="mt-8 text-center text-sm text-gray-500">
          아직 계정이 없나요?{" "}
          <Link
            href="/signup"
            className="text-orange-600 font-semibold hover:underline"
          >
            회원가입
          </Link>
        </p>
      </div>
    </section>
  );
}


