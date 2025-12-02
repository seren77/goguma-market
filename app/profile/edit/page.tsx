"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ProfileForm = {
  display_name: string;
  avatar_url: string;
  bio: string;
};

export default function ProfileEditPage() {
  const router = useRouter();
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileForm>({
    display_name: "",
    avatar_url: "",
    bio: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user;

      if (!currentUser) {
        router.replace("/login");
        return;
      }

      setSessionUserId(currentUser.id);
      setSessionEmail(currentUser.email ?? null);

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("프로필 로드 오류:", error);
      }

      setForm({
        display_name:
          profile?.display_name || currentUser.email?.split("@")[0] || "",
        avatar_url: profile?.avatar_url || "",
        bio: profile?.bio || "",
      });
      setIsLoading(false);
    };

    init();
  }, [router]);

  const handleChange = (
    field: keyof ProfileForm,
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sessionUserId) return;

    setIsSaving(true);
    setFeedback(null);

    const { error } = await supabase.from("profiles").upsert({
      id: sessionUserId,
      email: sessionEmail,
      display_name: form.display_name,
      avatar_url: form.avatar_url,
      bio: form.bio,
      updated_at: new Date().toISOString(),
    });

    setIsSaving(false);

    if (error) {
      console.error("프로필 저장 오류:", error);
      setFeedback("프로필 저장에 실패했어요. 잠시 후 다시 시도해주세요.");
      return;
    }

    setFeedback("프로필 정보를 저장했습니다.");
  };

  if (isLoading) {
    return (
      <section className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-sm">프로필 정보를 불러오는 중...</div>
      </section>
    );
  }

  return (
    <section className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm px-8 py-10 border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">프로필 설정</h1>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              표시 이름
            </label>
            <input
              type="text"
              value={form.display_name}
              onChange={(event) =>
                handleChange("display_name", event.target.value)
              }
              placeholder="다른 사용자에게 보여질 이름"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              maxLength={30}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              아바타 이미지 URL
            </label>
            <input
              type="url"
              value={form.avatar_url}
              onChange={(event) =>
                handleChange("avatar_url", event.target.value)
              }
              placeholder="https://example.com/avatar.png"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <p className="text-xs text-gray-400">
              이미지 주소를 붙여넣으면 헤더에 아바타가 표시돼요.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">소개글</label>
            <textarea
              value={form.bio}
              onChange={(event) => handleChange("bio", event.target.value)}
              placeholder="간단한 자기 소개를 입력하세요."
              rows={4}
              maxLength={200}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
            <p className="text-xs text-gray-400">
              {form.bio.length} / 200자
            </p>
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-orange-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-orange-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? "저장 중..." : "변경 사항 저장"}
          </button>
          {feedback && (
            <p className="text-center text-sm text-green-600">{feedback}</p>
          )}
        </form>
      </div>
    </section>
  );
}


