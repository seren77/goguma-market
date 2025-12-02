"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import UserMenu from "./UserMenu";

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data.session);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="w-full border-b border-gray-200 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* 로고 */}
          <Link
            href="/"
            className="flex items-center text-xl sm:text-2xl font-bold text-gray-900 hover:text-orange-600 transition-colors"
          >
            <span>🍠 고구마마켓</span>
          </Link>

          {/* 네비게이션 */}
          <nav className="flex items-center gap-2 sm:gap-4">
            {isLoggedIn && (
              <Link
                href="/products/new"
                className="px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
              >
                상품 등록
              </Link>
            )}
            <UserMenu />
          </nav>
        </div>
      </div>
    </header>
  );
}

