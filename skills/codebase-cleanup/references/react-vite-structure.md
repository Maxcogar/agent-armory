# React/Vite Standard Project Structure

## Standard Directory Structure

```
project-root/
├── public/                # Static assets served directly
│   ├── favicon.ico
│   └── robots.txt
├── src/                   # Source code
│   ├── assets/           # Images, fonts, static files
│   ├── components/       # Reusable React components
│   │   ├── common/      # Shared components
│   │   ├── layout/      # Layout components
│   │   └── ui/          # UI components
│   ├── pages/           # Page components (or views/routes)
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Utility functions
│   ├── services/        # API services
│   ├── store/           # State management (Redux/Zustand/etc)
│   ├── styles/          # Global styles
│   ├── types/           # TypeScript type definitions
│   ├── App.jsx          # Root component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── tests/               # Test files
├── .env                 # Environment variables (git-ignored)
├── .env.example         # Environment variable template
├── .eslintrc           # ESLint configuration
├── .gitignore          # Git ignore rules
├── .prettierrc         # Prettier configuration
├── index.html          # HTML entry point
├── package.json        # Dependencies and scripts
├── README.md           # Project documentation
├── tsconfig.json       # TypeScript config (if using TS)
├── vite.config.js      # Vite configuration
└── yarn.lock/package-lock.json

```

## Files Typically Safe to Remove

### Build Artifacts
- `dist/` (regenerated on build)
- `build/` (old CRA builds)
- `.cache/`
- `.parcel-cache/`
- `*.log`
- `.DS_Store` (macOS)
- `Thumbs.db` (Windows)

### Development Artifacts
- `node_modules/` (regenerated from lock file)
- `coverage/` (test coverage, regenerated)
- `.nyc_output/`
- `*.orig` (git merge artifacts)

### Backup/Old Files
- `*.backup`
- `*.old`
- `*_backup.*`
- `*.bak`
- `*~` (editor backups)

## Files That MUST Be Preserved

### Critical Configuration
- `package.json`
- `package-lock.json` or `yarn.lock`
- `vite.config.js/ts`
- `tsconfig.json` (if TypeScript)
- `.env.production` (production secrets)

### Source Code
- All files in `src/`
- Custom hooks
- Business logic
- API integrations

### Documentation
- `README.md`
- API documentation
- Deployment guides
- Architecture decisions

## Common Anti-Patterns to Fix

### Improper File Locations
- Components in root `src/` instead of `src/components/`
- Styles mixed with components (unless CSS-in-JS)
- Test files not co-located or in `tests/`
- Config files scattered throughout src

### Naming Inconsistencies
- Mixed casing (camelCase vs kebab-case)
- Index.js vs index.js
- Component.js vs Component.jsx
- Inconsistent file extensions

### Duplicate Implementations
- Multiple date formatting utilities
- Several API client implementations
- Repeated component logic

## Environment-Specific Files

### Development Only
- `.env.development`
- `*.test.js`
- `*.spec.js`
- Mock data files
- Storybook files (`*.stories.js`)
- Development utilities

### Production Only
- `.env.production`
- Optimized assets
- Service worker files
- Production configs

### Build-Time Only
- Webpack configs (if ejected from CRA)
- Build scripts
- CI/CD configs

## Vite-Specific Considerations

### Vite Assets
- `public/` - Files served as-is
- Import assets directly in JS for processing
- Use `import.meta.env` for env variables

### Vite Cache
- `.vite/` directory can be safely deleted
- `node_modules/.vite/` - dependency pre-bundling cache

### Common Vite Issues
- Incorrect asset imports from public folder
- Missing type definitions for `import.meta`
- Plugin conflicts
- HMR boundary issues
