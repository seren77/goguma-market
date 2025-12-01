import Link from "next/link";

export default function Header() {
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

          {/* 로그인/회원가입 버튼 */}
          <nav className="flex items-center gap-2 sm:gap-4">
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
          </nav>
        </div>
      </div>
    </header>
  );
}

