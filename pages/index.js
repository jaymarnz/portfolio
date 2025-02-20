// Copyright © 2025 jaymarnz, https://github.com/jaymarnz
// See LICENSE for details

import Link from 'next/link';

import Header from '@components/header';
import Footer from '@components/footer';
import PageWrapper from '@components/pagewrapper';
import Photo from '@components/photo';

import { cleanseName, canonicalizeName, getGalleries, getImageFiles, processImageFile } from '@utils/helpers';
import Config from '@config/configLoader.cjs';

import styles from './index.module.css';

export async function getStaticProps() {
  const galleryNames = getGalleries();
  const images = await Promise.all(galleryNames.map(async galleryName => {
    const { galleryDirectory, imageFiles } = getImageFiles(galleryName);
    const { imageURL, srcSet, blurData, metadata} = await processImageFile(galleryDirectory, imageFiles[0]);
    return {
      src: imageURL,
      srcSet,
      blurData,
      width: metadata.width,
      height: metadata.height,
      title: cleanseName(galleryName),
      gallery: `/${canonicalizeName(galleryName)}`,
    };
  }));

  return {
    props: {
      images,
      header: {
        title: Config.title,
        description: Config.description
      },
      footer: {
        block: Config.copyright,
      }
    },
  };
}

const Home = ({ images, header, footer }) => {
  return (
    <PageWrapper>
      <Header header={header} opacity=".75" />
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
      <Footer footer={footer} />
    </PageWrapper>
  );
};

export default Home;