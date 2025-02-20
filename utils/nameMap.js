// Copyright © 2025 jaymarnz, https://github.com/jaymarnz
// See LICENSE for details

// This is needed because I can't see how to pass multiple parameters
// from getStaticPaths to getStaticProps and I want to canonicalize the paths
// but still be able to get data from the original location

// I tried to use an in-memory map but that doesn't work because those two
// function are effecively isolated from each other
//
// So insted this function serializes a map into a file that is discarded
// at the start of every build
import fs from 'fs';
import path from 'path';

import Config from '@config/configLoader.cjs';

const nameMapFilePath = path.join(process.cwd(), Config.tempDataDir, 'nameMap.json');

export function addNameMapping(canonicalName, originalName) {
  try {
    let nameMap = {};
    if (fs.existsSync(nameMapFilePath)) {
      const fileContents = fs.readFileSync(nameMapFilePath, 'utf8');
      nameMap = JSON.parse(fileContents);
    }
    nameMap[canonicalName] = originalName;
    fs.writeFileSync(nameMapFilePath, JSON.stringify(nameMap, null, 2));
  } catch (error) {
    console.error('Error adding name mapping:', error);
  }
}

export function getOriginalName(canonicalName) {
  try {
    if (fs.existsSync(nameMapFilePath)) {
      const fileContents = fs.readFileSync(nameMapFilePath, 'utf8');
      const nameMap = JSON.parse(fileContents);
      return nameMap[canonicalName] || null;
    } else {
      console.warn('nameMap.json does not exist.');
      return null;
    }
  } catch (error) {
    console.error('Error getting original name:', error);
    return null;
  }
}