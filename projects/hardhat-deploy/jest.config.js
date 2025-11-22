// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test-cucumber'],
  testMatch: ['**/*.steps.ts'],
  moduleFileExtensions: ['ts', 'js'],
  testTimeout: 120000,
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
};