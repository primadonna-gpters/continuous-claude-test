module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/'],
  collectCoverageFrom: [
    'hub.js',
    'common.js',
    'games/*/game.js'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
