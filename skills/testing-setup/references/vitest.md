# Vitest Setup Reference

Configuration and setup patterns sourced from vitest docs (vitest.dev).

## When to Use Vitest

Use vitest when the project uses Vite as its build tool. Vitest shares Vite's config, transform pipeline, and plugin system — no duplicate configuration. If the project does not use Vite, use Jest instead.

## Installation

```bash
# npm
npm install --save-dev vitest

# With React Testing Library
npm install --save-dev vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom

# yarn
yarn add -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom

# pnpm
pnpm add -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

For non-React projects, skip the `@testing-library/*` packages. Replace `jsdom` with `happy-dom` if preferred (faster but less complete DOM implementation).

## Configuration: vitest.config.ts

If a `vite.config.ts` already exists, vitest reads it automatically — you can add the `test` block there instead of creating a separate file. A separate `vitest.config.ts` takes precedence if it exists.

### Minimal (add to existing vite.config.ts)

```typescript
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
  },
})
```

### Full standalone vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Enable globals (describe, test, expect without imports)
    globals: true,

    // DOM environment for component tests
    environment: 'jsdom',  // or 'happy-dom', 'node'

    // Setup files run before each test file
    setupFiles: ['./test/setup.ts'],

    // File patterns
    include: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],

    // Coverage
    coverage: {
      provider: 'v8',  // or 'istanbul'
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    },

    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,

    // Parallelization
    pool: 'threads',  // or 'forks', 'vmThreads'

    // Mock behavior
    clearMocks: true,
    restoreMocks: true,

    // Snapshot formatting
    snapshotFormat: {
      printBasicPrototype: false,
    },
  },
})
```

### Environment options

```typescript
test: {
  environmentOptions: {
    jsdom: {
      url: 'http://localhost:3000',
    },
    happyDOM: {
      width: 300,
      height: 400,
    },
  },
}
```

## TypeScript Support

If using `globals: true`, add vitest types to tsconfig.json:

```json
{
  "compilerOptions": {
    "types": ["vitest/globals"]
  }
}
```

## Directory Structure

```
project/
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   └── Button.test.tsx      # co-located tests
│   ├── utils/
│   │   ├── format.ts
│   │   └── format.test.ts
│   └── hooks/
│       ├── useAuth.ts
│       └── useAuth.test.ts
├── test/
│   ├── setup.ts                  # global setup file
│   └── utils.tsx                 # custom render, test helpers
├── vite.config.ts                # or vitest.config.ts
└── package.json
```

Vitest supports both co-located tests (next to source) and separated tests (in a test/ directory). Co-location is the convention for Vite projects.

## Setup File: test/setup.ts

### With React Testing Library

```typescript
import '@testing-library/jest-dom'
```

That single import adds custom matchers like `toBeInTheDocument()`, `toHaveTextContent()`, etc. When `globals: true` is set in vitest config, cleanup runs automatically after each test.

### Without globals (explicit cleanup)

```typescript
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import '@testing-library/jest-dom'

afterEach(() => {
  cleanup()
})
```

## Custom Render Utility: test/utils.tsx

Wraps components with providers used across the app (theme, router, auth, etc.):

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

Tests import from `test/utils` instead of `@testing-library/react` to get the wrapped render.

## package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

`vitest` (no args) starts watch mode. `vitest run` runs once and exits (for CI).

## Test Projects (Workspaces)

For monorepos or projects needing multiple environments:

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'jsdom',
          include: ['src/**/*.test.{ts,tsx}'],
        },
      },
      {
        test: {
          name: 'api',
          environment: 'node',
          include: ['api/**/*.test.ts'],
        },
      },
    ],
  },
})
```
