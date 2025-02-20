/* Copyright © 2025 jaymarnz, https://github.com/jaymarnz
   See LICENSE for details
*/

import * as child from 'child_process';
import Config from '../config/configLoader.cjs';

async function deploy(bucket) {
  console.log(child.execSync(`aws s3 sync --no-progress --only-show-errors --delete --exclude ".DS_Store" out/ s3://${bucket}`).toString());
}

const target = process.argv[2];
if (!target || (target !== 'dev' && target !== 'prod')) {
  console.error('Error: You must specify a deployment target ["dev" or "prod"]');
  process.exit(1);
}

deploy(target === 'prod' ? Config.awsBucket.prod : Config.awsBucket.dev );
