/* Copyright © 2025 jaymarnz, https://github.com/jaymarnz
   See LICENSE for details
*/

// script to delete all files in the public/images directory and data directory
// create the images directory if it doesn't exist

import fs from 'fs';
import path from 'path';
import Config from '../config/configLoader.cjs';

async function deleteDir(targetDirectory) {
  try {
    // Delete all files in the directory
    if (fs.existsSync(targetDirectory)) {
      console.log('deleting all files in directory:', targetDirectory);
      const files = fs.readdirSync(targetDirectory);
      for (const file of files) {
        const filePath = path.join(targetDirectory, file);
        if (fs.lstatSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
        }
      }
    } else {
      // Create the directory if it doesn't exist
      fs.mkdirSync(targetDirectory, { recursive: true });
    }
  } catch (error) {
    console.error(`Error cleaning up ${targetDirectory}:`, error);
    process.exit(1); // Exit the script with an error code
  }
}

async function cleanup() {
  await Promise.all([
    deleteDir(path.join(process.cwd(), Config.imageRoot.fileSystem)),
    deleteDir(path.join(process.cwd(), Config.tempDataDir))
  ]);
}

cleanup();