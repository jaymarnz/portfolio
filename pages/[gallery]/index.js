// Copyright © 2025 jaymarnz, https://github.com/jaymarnz
// See LICENSE for details

import { cleanseName, canonicalizeName, getGalleries, getImageFiles, processImageFile } from '@utils/helpers';
import { addNameMapping, getOriginalName } from '@/utils/nameMap';

import Header from '@components/header';
import Footer from '@components/footer';
import PageWrapper from '@components/pagewrapper';
import Gallery from '@components/gallery';

import Config from '@config/configLoader.cjs';

// Function to get image data for a gallery
async function getGalleryData(galleryName) {
  const { galleryDirectory, imageFiles } = getImageFiles(galleryName);
  const images = await Promise.all(imageFiles.map(async imageFile => {
    const { imageURL, srcSet, blurData, metadata } = await processImageFile(galleryDirectory, imageFile);
    return {
      src: imageURL,
      srcSet,
      blurData,
      width: metadata.width,
      height: metadata.height,
      title: metadata.title
    };
  }));

  return {
    header: {
      title: Config.title,
      description: `${cleanseName(galleryName)}`
    },
    footer: {
      block: Config.copyright
    },
    images: images,
  };
}

export async function getStaticPaths() {
  const galleryNames = getGalleries();
  const paths = galleryNames.map(galleryName => {
    const canonical = canonicalizeName(galleryName);
    addNameMapping(canonical, galleryName);
    return {
      params: { gallery: canonical },
    };
  });

  return {
    paths,
    fallback: false, // Return 404 for non-existent paths
  };
}

export async function getStaticProps({ params }) {
  const galleryData = await getGalleryData(getOriginalName(params.gallery));
  return {
    props: {
      galleryData,
    },
  };
}

const GalleryPage = ({ galleryData }) => (
  <>
    <PageWrapper>
      <Header header={galleryData.header} icons={['home']}/>
      <Gallery data={galleryData} />
      <Footer footer={galleryData.footer} />
    </PageWrapper>
  </>
);

export default GalleryPage;
