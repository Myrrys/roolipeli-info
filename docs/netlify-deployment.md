# Netlify Deployment Guide

This guide covers deploying both roolipeli.info sites to Netlify from our monorepo.

## Overview

**Two Sites from One Repository:**
- **Main Site** (`apps/main-site`): Astro SSR with i18n (fi/sv/en)
- **Design System Docs** (`apps/design-system`): Astro static site

Both sites deploy independently to Netlify-provided domains (e.g., `*.netlify.app`).

## Prerequisites

- GitHub repository with code pushed
- Netlify account (free tier works)
- Repository connected to Netlify

## Deployment Process

### 1. Create Sites on Netlify

**For Main Site:**

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Click "Add new site" → "Import an existing project"
3. Select your Git provider and authorize
4. Choose the `roolipeli-info` repository
5. Configure build settings:
   - **Base directory**: Leave empty (monorepo root)
   - **Package directory**: `apps/main-site`
   - **Build command**: `pnpm run build`
   - **Publish directory**: `apps/main-site/dist`
   - **Functions directory**: `apps/main-site/.netlify/functions` (auto-detected)

**For Design System Docs:**

1. Click "Add new site" again
2. Import from the same repository
3. Configure build settings:
   - **Base directory**: Leave empty (monorepo root)
   - **Package directory**: `apps/design-system`
   - **Build command**: `pnpm run build`
   - **Publish directory**: `apps/design-system/dist`

### 2. Environment Variables

No environment variables required for initial deployment.

Both sites have `netlify.toml` configuration files that specify:
- Node.js version (20)
- pnpm version (9)
- Build commands
- Caching headers

### 3. Monorepo Intelligence

Netlify automatically detects the monorepo structure and only rebuilds when relevant files change:

**Main Site rebuilds when:**
- Changes in `apps/main-site/`
- Changes in `packages/design-system/` (dependency)
- Changes in `packages/database/` (dependency)
- Changes in `packages/config/` (dependency)

**Design System Docs rebuilds when:**
- Changes in `apps/design-system/`
- Changes in `packages/design-system/` (dependency)

### 4. Automatic Deployments

After setup, Netlify automatically deploys:
- **Production**: On push to `main` branch
- **Deploy Previews**: On pull requests (if configured)

## Site Configuration

### Main Site (SSR)

**Adapter**: `@astrojs/netlify` v6.6.3+
**Output**: `server` (SSR mode)
**Features**:
- Server-side rendering for dynamic content
- i18n routing (fi/sv/en)
- Netlify Functions for SSR
- Automatic skew protection (Astro 5.15+)

**netlify.toml highlights**:
```toml
[build]
  command = "pnpm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/.netlify/functions/server"
  status = 200
```

### Design System Docs (Static)

**Adapter**: None (static export)
**Output**: `static` (default)
**Features**:
- Pre-rendered HTML for fast delivery
- Aggressive asset caching
- CDN distribution

**netlify.toml highlights**:
```toml
[build]
  command = "pnpm run build"
  publish = "dist"

[[headers]]
  for = "/_astro/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

## Build Process

### Local Testing

Before deploying, test builds locally:

```bash
# Test main-site build
pnpm --filter main-site build

# Test design-system build
pnpm --filter design-system build

# Run all tests
pnpm test:e2e
```

### Netlify Build

Netlify runs these commands from the repository root:

1. **Install dependencies**: `pnpm install` (from root, respects pnpm-workspace.yaml)
2. **Build**: `cd apps/[site] && pnpm run build`
3. **Publish**: Uploads `apps/[site]/dist` to CDN

Build logs available in Netlify Dashboard under "Deploys".

## Domain Configuration

### Default Netlify Domains

After deployment, you'll receive:
- Main Site: `https://[random-name].netlify.app`
- Design System: `https://[random-name].netlify.app`

### Renaming Sites

1. Go to Site Settings → General → Site details
2. Click "Change site name"
3. Choose a custom subdomain (e.g., `roolipeli-main.netlify.app`)

### Custom Domains (Future)

To use custom domains:
1. Go to Site Settings → Domain management
2. Add custom domain (e.g., `roolipeli.info`)
3. Configure DNS records as instructed
4. Netlify provides automatic HTTPS via Let's Encrypt

## Troubleshooting

### Build Fails: "pnpm not found"

**Solution**: Ensure `netlify.toml` includes:
```toml
[build.environment]
  PNPM_VERSION = "9"
```

### Build Fails: "Package not found"

**Cause**: Base directory set incorrectly
**Solution**: Leave base directory empty, use package directory only

### Main Site Returns 404

**Cause**: Missing redirect rule for SSR
**Solution**: Verify `netlify.toml` has:
```toml
[[redirects]]
  from = "/*"
  to = "/.netlify/functions/server"
  status = 200
```

### Design System Shows Blank Page

**Cause**: Incorrect publish directory
**Solution**: Verify publish directory is `dist` not `dist/client`

### Slow Builds

**Optimization**: Netlify caches `node_modules` between builds. Monorepo awareness means only changed apps rebuild.

## Performance Optimization

### Asset Caching

Both sites use aggressive caching for static assets:
- **Astro assets** (`/_astro/*`): 1 year cache (immutable)
- **HTML**: 1 hour cache (design-system) or no cache (main-site SSR)

### Build Optimization

**Skip unchanged apps**: Netlify automatically cancels builds when no changes detected in relevant directories.

## Monitoring

### Build Status

Check build status in Netlify Dashboard:
- Green checkmark: Successful deployment
- Red X: Build failed (click for logs)
- Yellow: Build in progress

### Analytics

Netlify provides basic analytics (free tier):
- Page views
- Bandwidth usage
- Build minutes

## CI/CD Integration

The monorepo is already configured with:
- **Biome**: Linting and formatting
- **Lefthook**: Pre-commit hooks
- **Commitlint**: Conventional commits
- **Playwright**: E2E tests

Netlify can run tests before deployment by updating `netlify.toml`:

```toml
[build]
  command = "pnpm test:e2e && pnpm run build"
```

However, this is **not recommended** initially as it increases build time. Better to run tests in GitHub Actions first.

## References

- [Astro + Netlify Deployment Guide](https://docs.astro.build/en/guides/deploy/netlify/)
- [Netlify Monorepo Support](https://docs.netlify.com/build/configure-builds/monorepos/)
- [@astrojs/netlify Documentation](https://docs.astro.build/en/guides/integrations-guide/netlify/)
- [Netlify Build Configuration](https://docs.netlify.com/build/configure-builds/overview/)

## Next Steps

After successful deployment:

1. **Update ARCHITECTURE.md** with live site URLs
2. **Configure deploy notifications** (Slack, email)
3. **Set up branch deploys** for preview environments
4. **Add environment variables** when connecting to Supabase (future)
5. **Configure custom domains** when DNS is ready

---

*Last updated: 2026-01-15*
