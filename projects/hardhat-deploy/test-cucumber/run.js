'use strict';

const { spawnSync } = require('child_process');
const path = require('path');

const jestBin = require.resolve('jest/bin/jest');
const args = process.argv.slice(2);

let network =
  process.env.CUCUMBER_NETWORK ||
  process.env.HARDHAT_NETWORK ||
  'sepolia';

const passthroughArgs = [];

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];

  if (arg === '--network' && index + 1 < args.length) {
    network = args[index + 1];
    index += 1;
  } else if (arg.startsWith('--network=')) {
    const [, value = ''] = arg.split('=');
    if (value) {
      network = value;
    }
  } else {
    passthroughArgs.push(arg);
  }
}

if (!process.env.HARDHAT_NETWORK) {
  process.env.HARDHAT_NETWORK = network;
}

process.env.CUCUMBER_NETWORK = network;

console.log(`[cucumber] Using network: ${network}`);

const jestArgs = ['--config', path.resolve(__dirname, '..', 'jest.config.js')];

if (
  !passthroughArgs.some(
    (arg) => arg === '--runInBand' || arg.startsWith('--runInBand=')
  )
) {
  jestArgs.push('--runInBand');
}

if (!passthroughArgs.includes('--forceExit')) {
  jestArgs.push('--forceExit');
}

jestArgs.push(...passthroughArgs);

const result = spawnSync(process.execPath, [jestBin, ...jestArgs], {
  stdio: 'inherit',
  env: process.env,
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status === null ? 1 : result.status);

