# Jest Setup Reference

Configuration and setup patterns sourced from Jest docs (jestjs.io).

## When to Use Jest

Use Jest when the project uses JavaScript or TypeScript but does NOT use Vite as its build tool. For Vite projects, use Vitest instead — it shares Vite's transform pipeline and avoids duplicate configuration.

Jest is the standard choice for: Webpack-based projects, Next.js, Express/Node backends, and plain JS/TS projects.

## Installation

```bash
# Basic
npm install --save-dev jest

# With TypeScript (ts-jest)
npm install --save-dev jest ts-jest @types/jest

# With React Testing Library
npm install --save-dev jest @testing-library/react @testing-library/user-event @testing-library/jest-dom jest-environment-jsdom

# With TypeScript + React
npm install --save-dev jest ts-jest @types/jest @testing-library/react @testing-library/user-event @testing-library/jest-dom jest-environment-jsdom
```

### Babel-based TypeScript (alternative to ts-jest)

```bash
npm install --save-dev jest babel-jest @babel/core @babel/preset-env @babel/preset-typescript
```

## Configuration: jest.config.ts

Jest auto-detects config files named `jest.config.js`, `jest.config.ts`, `jest.config.mjs`, `jest.config.cjs`, or `jest.config.json`.

### Minimal (TypeScript project, no React)

```typescript
import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
}

export default config
```

### Full (TypeScript + React)

```typescript
import type { Config } from 'jest'

const config: Config = {
  // Transform
  preset: 'ts-jest',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },

  // Environment
  testEnvironment: 'jsdom',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],

  // File patterns
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Module resolution
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/test/__mocks__/styleMock.js',
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg|webp)$': '<rootDir>/test/__mocks__/fileMock.js',
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Coverage
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}

export default config
```

## Asset Mocks

Jest cannot process CSS, images, or fonts. Create mock files:

### test/__mocks__/styleMock.js

```javascript
module.exports = {}
```

### test/__mocks__/fileMock.js

```javascript
module.exports = 'test-file-stub'
```

## Directory Structure

```
project/
├── src/
│   ├── components/
│   │   └── Button.tsx
│   ├── utils/
│   │   └── format.ts
│   └── __tests__/              # or co-locate as *.test.ts
│       ├── Button.test.tsx
│       └── format.test.ts
├── test/
│   ├── setup.ts                # setupFilesAfterEnv target
│   ├── utils.tsx               # custom render
│   └── __mocks__/
│       ├── styleMock.js
│       └── fileMock.js
├── jest.config.ts
└── package.json
```

Jest discovers test files by default in `__tests__` directories or files matching `*.test.*` / `*.spec.*`. Both co-located and separated layouts work.

## Setup File: test/setup.ts

```typescript
import '@testing-library/jest-dom'
```

Referenced via `setupFilesAfterEnv` in jest.config — runs after the test framework is installed but before tests execute. Jest globals (`jest`, `expect`) are available here.

## Custom Render: test/utils.tsx

Same pattern as Vitest — wrap components with providers:

```tsx
import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

const AllProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
```

## package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --reporters=default"
  }
}
```

## Next.js Specifics

Next.js has built-in Jest support. Use the `next/jest` preset:

```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}

export default createJestConfig(config)
```

This preset handles SWC transforms, CSS/image mocking, and module resolution automatically. Do not add `ts-jest` or manual transforms when using `next/jest`.
