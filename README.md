# roolipeli-info

Kanoninen tietolähde suomalaisista ja suomessa tehdyistä roolipeleistä.

## Prerequisites

- **Node.js** v20 (LTS)
- **pnpm** v8 or later

## Local Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/roolipeli-info.git
   cd roolipeli-info
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Copy the example environment file and configure as needed:

   ```bash
   cp apps/main-site/.env.example apps/main-site/.env
   ```
   
   > **Note:** For E2E tests to run successfully, you must also set `TEST_USER_PASSWORD` in your `.env` file (or CI environment). This is used for programmatic login validation.

4. **Start a development server**

   ```bash
   # Main site (public knowledge base)
   pnpm --filter main-site dev

   # Design system documentation
   pnpm --filter design-system dev
   ```

## Project Structure

```
apps/
  main-site/        # Public knowledge base (Astro SSR)
  design-system/    # Design system documentation site

packages/
  database/         # Supabase types and Zod schemas
  design-system/    # CSS tokens and Svelte components
  config/           # Shared TypeScript configuration
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm --filter <app> dev` | Start development server for an app |
| `pnpm build` | Build all apps and packages |
| `pnpm test:unit` | Run unit tests (Vitest) |
| `pnpm test:e2e` | Run end-to-end tests (Playwright) |
| `pnpm biome check --write .` | Lint and format code |

## Tech Stack

- **Framework:** Astro (SSR) + Svelte 5
- **Database:** Supabase (PostgreSQL)
- **Styling:** Vanilla CSS with design tokens
- **Testing:** Vitest + Playwright
- **Tooling:** pnpm workspaces, Biome, Lefthook
