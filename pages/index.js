// Copyright © 2025 jaymarnz, https://github.com/jaymarnz
// See LICENSE for details

import { cleanseName, canonicalizeName, getGalleries, getImageFiles, processImageFile } from '@utils/helpers';

import Header from '@components/header';
import Footer from '@components/footer';
import PageWrapper from '@/components/pageWrapper';
import ImageGrid from '@components/imageGrid';

import Config from '@config/configLoader.cjs';

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
      <ImageGrid images={images} />
      <Footer footer={footer} />
    </PageWrapper>
  );
};

export default Home;