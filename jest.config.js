module.exports = {
  clearMocks: true,
  moduleFileExtensions: ["js", "ts"],
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!**/*.test.ts",
    // because main.ts is tested out of process. See main.test.ts
    "!src/main.ts",
  ],
  coverageReporters: ["lcov", "text"],
  coverageThreshold: {
    global: {
      statements: 85,
      branches: 66,
    },
  },
  verbose: true,
}
