"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    if (password.length < 6) {
      setFeedback({
        type: "error",
        message: "비밀번호는 6자 이상이어야 합니다.",
      });
      return;
    }

    if (password !== confirmPassword) {
      setFeedback({
        type: "error",
        message: "비밀번호가 서로 일치하지 않습니다.",
      });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    setIsLoading(false);

    if (error) {
      setFeedback({
        type: "error",
        message: error.message,
      });
      return;
    }

    setFeedback({
      type: "success",
      message: "입력하신 이메일로 인증 메일을 보냈어요. 메일을 확인해주세요!",
    });
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <section className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm px-8 py-10 border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">회원가입</h1>
          <p className="text-sm text-gray-500 mt-2">
            고구마마켓의 모든 기능을 사용하려면 계정을 만들어주세요.
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleSignup}>
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
              minLength={6}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-gray-700"
            >
              비밀번호 확인
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="비밀번호를 한 번 더 입력하세요"
              required
              minLength={6}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-orange-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? "가입 처리 중..." : "계정 만들기"}
          </button>
        </form>
        {feedback && (
          <p
            className={`mt-6 text-sm text-center ${
              feedback.type === "success" ? "text-green-600" : "text-red-600"
            }`}
          >
            {feedback.message}
          </p>
        )}
        <p className="mt-8 text-center text-sm text-gray-500">
          이미 계정이 있나요?{" "}
          <Link
            href="/login"
            className="text-orange-600 font-semibold hover:underline"
          >
            로그인
          </Link>
        </p>
      </div>
    </section>
  );
}



