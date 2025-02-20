// Copyright © 2025 jaymarnz, https://github.com/jaymarnz
// See LICENSE for details

import Image from 'next/image';

const Photo = ({ img_className='', alt, src, srcset='', sizes='', width, height, blurData='' }) => (
    <picture>
      {/* todo: the following source tag messes up the masonry on mobile even though chrome on my MBP works very well.
          So, I've left srcset which provides for the avif while src has the jpg and that works ok.
      */}
      {/* <source srcSet={srcset} sizes={sizes} /> */}
      <source srcSet={srcset} />
      <Image 
        loading="lazy"
        className={`img-responsive ${img_className}`} 
        alt={alt} 
        src={src}
        width={width}
        height={height}
        placeholder={blurData ? blurData : 'empty'}
      />
    </picture>
);

export default Photo;
