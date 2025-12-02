"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
};

export default function UserMenu() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      setSession(data.session ?? null);
    };

    init();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const fetchProfile = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("프로필 정보를 불러올 수 없습니다:", error);
      }

      if (!cancelled) {
        setProfile(
          data ?? {
            id: session.user.id,
            email: session.user.email ?? "",
            display_name: session.user.user_metadata?.full_name ?? null,
            avatar_url: session.user.user_metadata?.avatar_url ?? null,
            bio: null,
          }
        );
        setIsLoading(false);
      }
    };

    fetchProfile();
    return () => {
      cancelled = true;
    };
  }, [session]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const initials = useMemo(() => {
    const displayText =
      profile?.display_name ||
      profile?.email ||
      session?.user.email ||
      "U";
    return displayText.slice(0, 1).toUpperCase();
  }, [profile, session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsOpen(false);
    router.replace("/");
    router.refresh();
  };

  const handleOpenProfileEdit = () => {
    setIsOpen(false);
    router.push("/profile/edit");
  };

  if (isLoading) {
    return (
      <div className="w-32 h-10 bg-gray-100 rounded-full animate-pulse" />
    );
  }

  if (!session) {
    return (
      <>
        <Link
          href="/login"
          className="px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base text-gray-700 hover:text-orange-600 transition-colors font-medium"
        >
          로그인
        </Link>
        <Link
          href="/signup"
          className="px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
        >
          회원가입
        </Link>
      </>
    );
  }

  const displayName =
    profile?.display_name || session.user.email?.split("@")[0] || "사용자";
  const emailText = profile?.email || session.user.email;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-full hover:border-orange-500 transition-colors"
      >
        {profile?.avatar_url ? (
          <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200">
            <img
              src={profile.avatar_url}
              alt="프로필 이미지"
              className="object-cover w-full h-full"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <div className="w-9 h-9 rounded-full bg-orange-600 text-white flex items-center justify-center font-semibold">
            {initials}
          </div>
        )}
        <div className="flex flex-col text-left">
          <span className="text-sm font-semibold text-gray-900">
            {displayName}
          </span>
          {emailText && (
            <span className="text-xs text-gray-500 truncate">{emailText}</span>
          )}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
          <button
            type="button"
            onClick={handleOpenProfileEdit}
            className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50"
          >
            프로필 설정
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50"
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}

