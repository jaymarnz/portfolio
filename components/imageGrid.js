// Copyright © 2025 jaymarnz, https://github.com/jaymarnz
// See LICENSE for details

import Link from 'next/link';
import Photo from '@components/photo';

import styles from './imageGrid.module.css';

const ImageGrid = ({ images }) => {
  return (
      <div className={styles['image-grid']}>
        {images.map((image, index) => (
          <Link href={`${image.gallery}`} key={index}>
            <div className={`relative group block ${styles['image-container']}`}>
              <div className={styles['image-wrapper']}>
                <Photo
                    className="img-responsive"
                    alt={image.title}
                    src={image.src}
                    srcset={image.srcSet}
                    sizes="(max-width: 540px) 100vw, calc(50vw - 8vw)" // one column or two 
                    width={image.width}
                    height={image.height}
                    blurData={image.blurData}
                />
              </div>
              <div className={`${styles.overlay} z-10`}></div>
              <div className={`${styles['text-container-wrapper']} z-20`}>
                <div className={`${styles['text-container']} `}>
                  <span className="font-medium text-2xl text-white text-center uppercase">{image.title}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
  );
};

export default ImageGrid;
