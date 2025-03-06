// Copyright © 2025 jaymarnz, https://github.com/jaymarnz
// See LICENSE for details

import Link from 'next/link';

const iconImages = {
  // https://www.iconarchive.com/show/material-light-icons-by-pictogrammers/home-icon.html
  // https://www.apache.org/licenses/LICENSE-2.0
  'home': {
    href: '/',
    svg: (
      <svg 
        className="w-7 h-7 mr-5"
        xmlns="http://www.w3.org/2000/svg" 
        id="mdil-home"
        stroke="#ededed" /* same as globals.css */
        fill="#ededed"
        strokeOpacity="0.5" /* less than description in root index.html */
        fillOpacity="0.5"
        viewBox="0 0 24 24"
      >
      <path d="M16,8.41L11.5,3.91L4.41,11H6V12L6,19H9V13H14V19H17V11H18.59L17,9.41V6H16V8.41M2,
               12L11.5,2.5L15,6V5H18V9L21,12H18V20H13V14H10V20H5V12H2Z"
      />
      </svg>
    )
  }
};

const Header = ({ header, opacity = '1', icons = [] }) => {
  return (
    <div className="flex flex-col items-center mt-4 mb-4 relative">
      {/* Icons, positioned absolutely */}
      <div className="absolute left-0 top-2 flex items-center max-sm:left-2">
        {icons.map((icon, index) => {
          const iconData = iconImages[icon];
          if (!iconData) return null;
          return (
            <Link key={index} href={iconData.href}>
              {iconData.svg}
            </Link>
          );
        })}
      </div>
      {/* Title, centered */}
      <div className="text-center">
        <Link href="/" className="font-medium text-2xl">
          {header.title}
        </Link>
      </div>
      {/* Description below the title */}
      <p
        className="font-light text-sm md:text-base lg:text-xl text-center mt-2 mb-6 max-w-7xl leading-4 md:leading-5 lg:leading-6 max-sm:px-2"
        style={{ opacity: opacity }}
      >
        {header.description}
      </p>
    </div>
  );
};

export default Header;
