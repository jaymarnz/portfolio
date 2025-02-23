// Copyright © 2025 jaymarnz, https://github.com/jaymarnz
// See LICENSE for details

import Link from 'next/link';

export default function Custom404() {
  return (
    <div className="font-sans h-screen text-center flex flex-col items-center mt-[10vh]">
      <div className="flex items-center leading-12">
        <h1 className="inline-block mr-4 pr-4 text-2xl font-medium border-r border-white/30">404</h1>
        <div className="inline-block">
          <h2 className="text-sm font-normal leading-7">The page could not be found</h2>
        </div>
      </div>
      <Link href="/">
        <div className="mt-[10vh] underline underline-offset-3">GO TO THE HOME PAGE</div>
      </Link>
    </div>
  );
}