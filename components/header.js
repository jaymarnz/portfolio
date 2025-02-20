// Copyright © 2025 jaymarnz, https://github.com/jaymarnz
// See LICENSE for details

import Link from 'next/link';

const Header = ({ header, opacity='1' }) => (
  <div className="flex flex-col items-center m-4">
    <Link href="/" className="font-medium text-2xl">{header.title}</Link>
    <p className={'font-light text-sm md:text-base lg:text-xl text-center mt-2 mb-6 max-w-7xl leading-4 md:leading-5 lg:leading-6'} style={{ opacity: opacity}}>
      {header.description}
    </p>
  </div>
);

export default Header;
