// Copyright © 2025 jaymarnz, https://github.com/jaymarnz
// See LICENSE for details

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ExifTool } from 'exiftool-vendored';
import sharp from 'sharp';

import Config from '@config/configLoader.cjs';

// To prevent build time MaxListenersExceededWarning exifTool is created as a singleton rather than in removeMetadata
// There isn't a good place to determine when to call exifTool.end() so I'm not calling it and letting it leak. But
// that only happens at build time anyway and doesn't seem to have any effect on the build or errors
const exifTool = new ExifTool({
  writeArgs: ['-overwrite_original']
});

// to allow the sort order of galleries to be explicitly determined, a gallery name can start
// with digits followed by a colon, dash, underscore or period which are stripped off and the result trimmed
// and finally any remaining underscores are converted to spaces
export function cleanseName(name) {
  return name.replace(/^[0-9]+(:|-|_|\.)/, '').trim().replace(/_/g, ' ');
}

// Canonicalize names (they can't start with a slash)
// Also this function also removes dots so a name like: file.txt becomes file_text
export function canonicalizeName(name) {
  let encodedName = encodeURIComponent(cleanseName(name).toLowerCase());
  encodedName = encodedName.replace(/-/g, '_'); // Replace dashes
  encodedName = encodedName.replace(/[!'()*\.]/g, '_'); // Replace reserved characters
  encodedName = encodedName.replace(/%[0-9A-Fa-f]{2}/g, '_'); // Replace other encoded characters
  encodedName = encodedName.replace(/_+/g, '_'); // Replace multiple underscores with single underscore
  encodedName = encodedName.replace(/^_+|_+$/g, ''); // Trim leading and trailing '_'
  return encodedName;
}

// Get the source gallery directory names (not munged)
export function getGalleries() {
  const galleriesDirectory = path.join(process.cwd(), Config.imageRoot.source);
  const galleryNames = fs.readdirSync(galleriesDirectory).filter(file => {
    const filePath = path.join(galleriesDirectory, file);
    return fs.statSync(filePath).isDirectory();
  });
  return galleryNames;
}

// Get the image file names (not full paths) for the specified gallery name (not munged)
export function getImageFiles(galleryName) {
  const galleryDirectory = path.join(process.cwd(), Config.imageRoot.source, galleryName);
  const imageFiles = fs.readdirSync(galleryDirectory).filter(file => {
    return Config.allowedExtensions.includes(path.extname(file).toLowerCase());
  });
  return { galleryDirectory, imageFiles };
}

// create a new filename based on the metadata Original Document ID or if not present then a UUID
// using the document id means changes to the website or even restarting the server won't invalidate
// cached images
function createFilename(sourceFilePath, metadata) {
  const docId = metadata.OriginalDocumentID;
  if (!docId) console.warn(`warning: metadata does not contain OriginalDocumentId. Generating UUID for filename. ${sourceFilePath}`);
  const fileName = docId ? 
      metadata.OriginalDocumentID.toLowerCase()
    : uuidv4().replace(/-/g, ''); // Remove dashes
  const newFilename = `${fileName}.${Config.imageFormat}`;
  return newFilename;
}

// get the exif metadata for a file path
async function getMetadata(imagePath) {
  try {
    return await exifTool.read(imagePath);
  } catch (error) {
    console.error(`Error getting metadata from ${imagePath}:`, error);
  }
}

// generate the blur data for an image
// not used because I've switched to generating multiple images and using native
// img srcset & sizes because node/image doesn't seem to support this for static SSG
async function generateBlurData(imagePath) {
  let blurData = '';

  try {
    const buffer = await sharp(imagePath)
      .resize(10) // Resize to a very small image
      .blur() // Apply a blur effect
      .toBuffer();
    blurData = `data:image/webp;base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.error(`Error generating blurData for ${imagePath}:`, error);
  }
  
  return blurData;
}

// convert the source image to the destination format specified in the config
async function convertImageFormat(sourceFilePath, targetFilePath, metadata, width) {
  try {
    await sharp(sourceFilePath)
      .withExif({ // strip all metadata except copyright
        IFD0: {
          Copyright: metadata.Copyright || Config.copyright
        }
      })
      .resize(width, null, { withoutEnlargement: true })
      .toFile(targetFilePath);
  } catch (error) {
    console.error(`Error converting image format for ${sourceFilePath}:`, error);
  }
}

// the top-level image processing function. It's job is essentially to copy the source file
// to the target public directory. Along the way the format is updated, metadata removed,
// copyright inserted if needed, title determined, and placeholder blur data generated.
export async function processImageFile(galleryDirectory, imageFile) {
  // todo: for now I've disabled srcset/sizes in Photo component and gallery/index.js because it
  // misbehaves on mobile devices causes horizontal and vertical images not to fill the screen
  // as well as messing up the borders around some images in the masonry. 
  // const sizes = [540, 640, 800, 1080, 1280, 1440, 1920];
  
  // I can't get sizes to work properly without messing up the masonry or the main images
  // and without sizes the browser almost always seems to choose 1920. However, it's possible
  // that mobile devices are using the other sizes automatically so for now I'll continue to
  // generate them.
  const sizes = [640, 1080, 1440, 1920];
  
  // const sizes = [1920]; // must always have one so it generates both the avif and jpg

  const targetDirectory = path.join(process.cwd(), Config.imageRoot.fileSystem);
  const sourceFilePath = path.join(galleryDirectory, imageFile);
  const metadata = await getMetadata(sourceFilePath);
  const imageTitle = metadata.Title || metadata.Description || '';
  const blurData = await generateBlurData(sourceFilePath); // see the comment at generateBlurData

  if (!fs.existsSync(targetDirectory)) {
    fs.mkdirSync(targetDirectory, { recursive: true });
  }
  
  const newFilename = createFilename(sourceFilePath, metadata);
  const fileName = path.basename(newFilename, path.extname(newFilename));
  const extension = path.extname(newFilename);
  
  // generate the srcset images in the sizes above
  let srcSet = '';

  for (const size of sizes) {
    const imageFileName = `${fileName}-${size}${extension}`;
    const outputFilePath = path.join(targetDirectory, imageFileName);
    const imageUrl = path.join(Config.imageRoot.URL, imageFileName);

    await convertImageFormat(sourceFilePath, outputFilePath, metadata, size);

    if (srcSet) srcSet = srcSet + ',';
    srcSet = srcSet + `${imageUrl} ${size}w`;
  }

  // generate a default jpg image in the largest size as the fallback image
  let imageURL;
  const defaultSize = Math.max(...sizes);
  
  if (Config.imageFormat === 'jpg' || Config.imageFormat === 'jpeg') {
    imageURL = path.join(Config.imageRoot.URL, `${fileName}-${defaultSize}.${Config.imageFormat}`);
  } else {
    const fallbackImageFilename = `${fileName}-${defaultSize}.jpg`;
    const outputFilePath = path.join(targetDirectory, fallbackImageFilename);
    imageURL =  path.join(Config.imageRoot.URL, fallbackImageFilename);
    await convertImageFormat(sourceFilePath, outputFilePath, metadata, defaultSize);
  }

  return {
    blurData,
    srcSet,
    imageURL,
    metadata: {
      type: metadata.FileType,
      height: metadata.ImageHeight,
      width: metadata.ImageWidth,
      title: `${imageTitle}`,
    }
  };
}