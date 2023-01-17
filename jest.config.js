module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!**/*.test.ts"
  ],
  coverageReporters: ["lcov", "text"],
  verbose: true,
}
