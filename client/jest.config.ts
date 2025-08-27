import nextJest from "next/jest.js";
import type { Config } from "jest";

const createJestConfig = nextJest({
  dir: "./",
});

/** @type {Config} */
const customJestConfig: Config = {
  testEnvironment: "jest-environment-jsdom",

  testMatch: [
    "<rootDir>/tests/unit/**/*.test.ts",
    "<rootDir>/tests/unit/**/*.test.tsx",
  ],

  moduleNameMapper: {
    "^@/components/(.*)$": "<rootDir>/src/components/$1",
    "^@/hooks/(.*)$": "<rootDir>/src/hooks/$1",
    "^@/utils/(.*)$": "<rootDir>/src/utils/$1",
    "^@/services/(.*)$": "<rootDir>/src/services/$1",
    "^@/contexts/(.*)$": "<rootDir>/src/contexts/$1",
  },

  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  collectCoverage: true,
  coverageReporters: ["html", "text"],
  coverageDirectory: "<rootDir>/coverage/unit/",
  coveragePathIgnorePatterns: [
    "<rootDir>/tests/unit/helpers/",
    "<rootDir>/tests/unit/fixtures/",
  ],
};

export default createJestConfig(customJestConfig);
