import nextJest from "next/jest";
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
  },

  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  collectCoverage: true,
  coverageReporters: ["html", "text"],
  coverageDirectory: "<rootDir>/coverage/unit/",
};

export default createJestConfig(customJestConfig);
