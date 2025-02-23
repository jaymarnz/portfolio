// Copyright © 2025 jaymarnz, https://github.com/jaymarnz
// See LICENSE for details

import LightGallery from 'lightgallery/react';
import lgFullscreen from 'lightgallery/plugins/fullscreen';

import { useCallback, useEffect, useRef } from 'react';

import Photo from '@components/photo';

import Config from '@config/configLoader.cjs';

export default function Gallery({data, rowHeight=300, gutter=6}) {
  const lightGallery = useRef(null);
  const onInit = useCallback((detail) => {
    if (detail) {
      lightGallery.current = detail.instance;
    }
  }, []);

  useEffect(() => {
    // Move fjGallery initialization inside useEffect
    import('flickr-justified-gallery').then((fjGallery) => {
      fjGallery.default(document.querySelectorAll('.gallery'), {
        itemSelector: '.gallery_item',
        rowHeight,
        gutter,
        edgeCaseMinRowHeight: 1,
        edgeCaseMaxRowHeight: 2,
        calculateItemsHeight: true,
        lastRow: 'center',
        rowHeightTolerance: 0.25,
      });
    });

    // Event listener to prevent the default right-click menu
    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    // Attach the event listener to the document
    document.addEventListener('contextmenu', handleContextMenu);

    // Clean up the event listener on component unmount
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [rowHeight, gutter]);

  return (
    <LightGallery
      licenseKey={'none'} // license is not required for FOSS: https://www.lightgalleryjs.com/license/
      plugins={[lgFullscreen]}
      mode={Config.transition}
      allowMediaOverlap={true}
      closeOnTap={false}
      counter={false}
      controls={false}
      download={false}
      fullscreen={true}
      hideControlOnEnd={true}
      hideScrollbar={true}
      mousewheel={true}
      pager={false}
      share={false}
      showCloseIcon={true}
      thumbnail={false}
      onInit={onInit}
      elementClassNames="gallery my-auto mx-0"
      mobileSettings={{
        controls: false,
        showCloseIcon: true,
        download: false
      }}
    >
      {data.images.map((image, index) => (
        <div
          key={index}
          className="gallery_item cursor-pointer"
          data-src={image.src}
          // todo: including srcset alone or with srcset with or without sizes causes images to no longer fill the entire space either vertical or horizonal
          // the key downside to this is it is ALWAYS USING THE JPG version now
          // data-srcset={image.srcSet} // for the main image
          // data-sizes="(orientation: portrait) 100vw, 100vh"
          // data-lg-size={`${image.width}-${image.height}`}
          data-sub-html={`<div class="image-sub-html">${image.title}</div>`}
        >
          <Photo
            className="w-full"
            alt={image.title}
            src={image.src}
            srcset={image.srcSet}
            sizes="(max-width: 540px) 100vw, (max-width: 1305px) 50vw, (max-width: 1740px) 33vw, (max-width: 2393px) 25vw, (max-width: 3046px) 20vw, (max-width: 3698px) 17vw, 15vw"
            width={image.width} // these aren't used for actual height but are used
            height={image.height} // to prevent content moving after images load (eg. footer)
            blurData={image.blurData}
          />
        </div>
      ))}
    </LightGallery>
  );
}
