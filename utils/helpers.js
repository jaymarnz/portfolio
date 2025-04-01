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
async function generateBlurData(imagePath) {
  try {
    const buffer = await sharp(imagePath)
      .resize(10)
      .blur()
      .toBuffer();
    return `data:image/webp;base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.error(`Error generating blurData for ${imagePath}:`, error);
    return null;
  }
}

// convert the source image to the destination format specified in the config
async function convertImageFormat({ sourceFilePath, targetFilePath, metadata, size, toSRGB = false }) {
  try {
    let sharpInstance = sharp(sourceFilePath)
      .withExif({ // strip all metadata except copyright
        IFD0: {
          Copyright: metadata.Copyright || Config.copyright
        }
      })
      .resize(size, null, { withoutEnlargement: true });

    if (toSRGB) {
      sharpInstance = sharpInstance.toColorspace('srgb').withIccProfile('srgb');
    } else {
      sharpInstance = sharpInstance.keepIccProfile();
    }
    
    switch (path.extname(targetFilePath).toLowerCase()) {
      case '.avif':
        sharpInstance = sharpInstance.avif({
          quality: 70,
          chromaSubsampling: '4:2:0',
          // effort: 4, // Adjust encoding speed/quality (0-9, higher is slower/better)
        });
        break;

      case '.jpg':
      case '.jpeg':
        sharpInstance = sharpInstance.jpeg({
          quality: 70,
        });
        break;
    }

    await sharpInstance.toFile(targetFilePath);
  } catch (error) {
    console.error(`Error converting image format for ${sourceFilePath}:`, error);
  }
}

// This is the top-level private image processing function. See processImageFile for the public api
// that wraps this function and manages concurrency.
//
// Each source file in a gallery is resized and copied to multiple images while updating the format,
// removing metadata, inserting copyright if needed, determining the title and generating a blur
// image for a placeholder.
async function processImage(galleryDirectory, imageFile) {
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
    const targetFilePath = path.join(targetDirectory, imageFileName);
    const imageUrl = path.join(Config.imageRoot.URL, imageFileName);

    await convertImageFormat({ sourceFilePath, targetFilePath, metadata, size });

    if (srcSet) srcSet = srcSet + ',';
    srcSet = srcSet + `${imageUrl} ${size}w`;
  }

  // generate a fallback jpg image in the largest size with colorspace sRGB
  const defaultSize = Math.max(...sizes);
  const fallbackImageFilename = `${fileName}-default.jpg`;
  const targetFilePath = path.join(targetDirectory, fallbackImageFilename);
  const imageURL = path.join(Config.imageRoot.URL, fallbackImageFilename);
  
  await convertImageFormat({ sourceFilePath, targetFilePath, metadata, defaultSize, toSRGB: true });
  const blurData = await generateBlurData(targetFilePath); // get blur data from fallback image
  
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

// because there are multiple index.js files for the same gallery (the home page and the gallery page)
// we need to manage concurrency and prevent race conditions. A benefit is we can cache the results
// and reduce build time a bit. Therefore, this is the public function for processing an image file
const processedFilesCache = new Map(); // Cache to store processed results
const processingLocks = new Map();     // Locking mechanism to track ongoing processing tasks

export async function processImageFile(galleryDirectory, imageFile) {
  const cacheKey = `${galleryDirectory}/${imageFile}`;

  // Check if the file has already been processed
  if (processedFilesCache.has(cacheKey)) {
    return processedFilesCache.get(cacheKey);
  }

  // Check if the file is currently being processed
  if (processingLocks.has(cacheKey)) {
    return await processingLocks.get(cacheKey); // Wait for the ongoing task to complete
  }

  // Create a new processing task
  const processingTask = (async () => {
    return await processImage(galleryDirectory, imageFile);
  })();

  // Store the processing task in the lock map
  processingLocks.set(cacheKey, processingTask);

  try {
    const result = await processingTask;
    processedFilesCache.set(cacheKey, result); // Cache the result for future calls
    return result;
  } finally {
    processingLocks.delete(cacheKey); // Remove the lock once processing is complete
  }
}