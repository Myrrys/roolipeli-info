# Spec: AuthButton Component (Kide) — ROO-95

## 1. Blueprint (Design)

### Context

> **Goal:** A Svelte 5 component that renders an auth-state-aware navigation link
> for use in Kide layout surfaces (AppShell header slot, SiteHeader).
> **Why:** Multiple layout surfaces need a single, reusable CTA that adapts between
> "Kirjaudu" (logged out) and the user's display name (logged in). Auth state is
> always server-derived — never client-fetched.
> **Architectural Impact:** Adds `AuthButton.svelte` to `packages/design-system/src/components/`.
> Requires `ALLOW_DS_EDIT=true` gate (Tier 2 ASK). Auto-exported via the existing
> `"./components/*"` glob in `package.json` — no new entry required.

### Data Architecture

**No schema or API changes.** Props-only, stateless component.
Auth state is resolved by the Astro SSR parent via `supabase.auth.getUser()` and
the `profiles` table (see `specs/auth/spec.md`), then passed down as props.

### UI Architecture

#### Component API

**File:** `packages/design-system/src/components/AuthButton.svelte`

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `user` | `{ display_name?: string \| null } \| null \| undefined` | `undefined` | User profile object. Falsy = not logged in |
| `loginHref` | `string` | `'/kirjaudu'` | Href for the "Kirjaudu" link (supports i18n prefix) |
| `profileHref` | `string` | `'/tili'` | Href for the profile link |
| `loginLabel` | `string` | `'Kirjaudu'` | Label for the logged-out link (i18n at consumer level) |
| `fallbackLabel` | `string` | `'Tili'` | Label when user has no display name (i18n at consumer level) |

**Rendered output:**

- **Logged out** (`user` is falsy):
  ```html
  <a href="/kirjaudu" class="btn btn-filled">Kirjaudu</a>
  ```

- **Logged in** (`user` is truthy, `display_name` present):
  ```html
  <a href="/tili" class="btn btn-text">Matti M.</a>
  ```

- **Logged in, `display_name` is null/empty — uses `fallbackLabel`:**
  ```html
  <a href="/tili" class="btn btn-text">Tili</a>
  ```

**Label resolution pattern:** All visible strings are props with Finnish defaults.
The design-system layer has no access to main-site i18n utilities — consumers
resolve translations and pass them in:
```astro
<AuthButton
  user={profile}
  loginLabel={t('nav.login')}
  fallbackLabel={t('nav.account')}
  client:load
/>

#### Usage Pattern (SSR in Astro)

```astro
---
import AuthButton from '@roolipeli/design-system/components/AuthButton.svelte';
import { getProfile } from '../lib/profiles';

// SSR: resolve auth state server-side
const { data: { user } } = await supabase.auth.getUser();
const profile = user ? await getProfile(user.id) : null;
---

<!-- In AppShell header slot (ROO-94 use case) -->
<AppShell>
  <AuthButton slot="header" user={profile} client:load />
  <AdminNav slot="rail" />
  <slot />
</AppShell>
```

#### Design Token Mapping

| Element | CSS Class | Token Used |
|---------|-----------|------------|
| Logged-out link | `.btn.btn-filled` | `--kide-ice-mid` bg, white text (from `button.css`) |
| Logged-in link | `.btn.btn-text` | `--kide-ice-deep` text (from `button.css`) |

No new tokens or CSS required — reuses the existing `button.css` classes.

### Anti-Patterns

- **NEVER** call `supabase.auth.getUser()` or any async fetch inside `AuthButton` —
  this is an SSR contract violation. State is always passed via props.
- **NEVER** use `onMount` or `$effect` to derive auth state from cookies/localStorage.
- **NEVER** use `<button>` — use `<a>` per Kide "native elements first" principle
  (`specs/design-system/spec.md` §Architectural Principles).
- **NEVER** add wrapper divs — renders a single `<a>` element only.
- **NEVER** hardcode `/kirjaudu` or `/tili` URLs — accept as props for i18n flexibility
  (e.g., `/sv/kirjaudu`).
- **NEVER** hardcode visible label strings — all text is a prop with a Finnish default.
  Consumers resolve i18n and pass translated strings in.
- **NEVER** import or use `useTranslations` — the design-system layer has no access
  to main-site i18n utilities.

---

## 2. Contract (Quality)

### Definition of Done

- [ ] `AuthButton.svelte` created at `packages/design-system/src/components/`
- [ ] Svelte 5 runes syntax (`$props()`, no Options API)
- [ ] TypeScript strict mode — no `any`, all props typed
- [ ] Logged-out state: renders single `<a>` with `.btn.btn-filled` and `loginLabel`
- [ ] Logged-in state: renders single `<a>` with `.btn.btn-text` and `display_name`
- [ ] Logged-in with null `display_name`: renders `fallbackLabel`
- [ ] Custom `loginHref`/`profileHref`/`loginLabel`/`fallbackLabel` props are respected
- [ ] No new CSS file required (reuses `button.css`)
- [ ] Demo added to `apps/design-system` docs (dogfooding)
- [ ] `ALLOW_DS_EDIT=true` commit gate respected
- [ ] `pnpm biome check` passes
- [ ] `pnpm tsc --noEmit` passes
- [ ] E2E test in `apps/design-system/tests/e2e/auth-button.spec.ts` covers all 4 scenarios

### Regression Guardrails

- **Invariant:** `AuthButton` never fetches client-side — pure presentational component
- **Invariant:** Existing `.btn`, `.btn-filled`, `.btn-text` CSS classes are unchanged
- **Invariant:** Component renders a single `<a>` element — no wrapper elements
- **Invariant:** `button.css` is not modified by this PBI

### Scenarios (Gherkin)

**Scenario: Logged-out state renders login link**
- Given: `AuthButton` is rendered with `user={null}`
- When: Component mounts
- Then: A single `<a>` with class `btn btn-filled` is present in the DOM
- And: The link text is "Kirjaudu"
- And: The `href` is `/kirjaudu`

**Scenario: Logged-in state renders profile link with display name**
- Given: `AuthButton` is rendered with `user={{ display_name: 'Matti M.' }}`
- When: Component mounts
- Then: A single `<a>` with class `btn btn-text` is present in the DOM
- And: The link text is "Matti M."
- And: The `href` is `/tili`

**Scenario: Logged-in with null display_name shows fallback text**
- Given: `AuthButton` is rendered with `user={{ display_name: null }}`
- When: Component mounts
- Then: A single `<a>` with class `btn btn-text` is present in the DOM
- And: The link text is "Tili"

**Scenario: Custom hrefs are respected**
- Given: `AuthButton` is rendered with `loginHref="/sv/kirjaudu"` and `user={null}`
- When: Component mounts
- Then: The `<a>` element has `href="/sv/kirjaudu"`

---

## 3. Implementation Notes

### Package Export

No change required. The existing glob export in `packages/design-system/package.json`
already covers new Svelte components:
```json
"./components/*": "./src/components/*"
```

### Svelte 5 Skeleton

```svelte
<script lang="ts">
  interface Props {
    user?: { display_name?: string | null } | null;
    loginHref?: string;
    profileHref?: string;
    loginLabel?: string;
    fallbackLabel?: string;
  }

  let {
    user = null,
    loginHref = '/kirjaudu',
    profileHref = '/tili',
    loginLabel = 'Kirjaudu',
    fallbackLabel = 'Tili',
  }: Props = $props();
</script>

{#if user}
  <a href={profileHref} class="btn btn-text">
    {user.display_name || fallbackLabel}
  </a>
{:else}
  <a href={loginHref} class="btn btn-filled">{loginLabel}</a>
{/if}
```

> **Note:** The skeleton above is illustrative only. The dev has freedom on syntax —
> the constraint is the observable output defined in the Contract (§2).

### DS Docs Page

Add a demo page at `apps/design-system/src/pages/auth-button.astro` showing both
states with mock props. Add a nav link to `DocsLayout`.

### Constitution Notes

- **ASK tier triggered:** Commits to `packages/design-system` require `ALLOW_DS_EDIT=true`
- **Same-Commit Rule:** Spec and component must ship in the same commit
- **No new dependencies:** Pure Svelte 5 + existing CSS

---

## 4. Future Considerations

**Out of Scope for ROO-95:**
- Logout button / logout action (admin nav rail already handles this via footer slot)
- Admin "Ylläpito" link (handled in SiteHeader per `specs/auth/spec.md`)
- i18n label resolution (main-site consumers pass pre-resolved text via props if needed)
- Loading/skeleton state while SSR resolves

---

## 5. References

- **Linear:** [ROO-95 — Add AuthButton component to Kide design system](https://linear.app/pelilauta/issue/ROO-95/add-authbutton-component-to-kide-design-system)
- **Unblocks:** [ROO-94 — Admin view should use AppShell layout](https://linear.app/pelilauta/issue/ROO-94/admin-view-should-use-appshell-layout)
- **Auth flow:** `specs/auth/spec.md` — SiteHeader Integration section
- **Button CSS:** `packages/design-system/src/styles/components/button.css`
- **Parent Spec:** `specs/design-system/spec.md` — Architectural Principles

---

**Spec Status:** Draft
**Created:** 2026-02-20
**Linear Issue:** ROO-95
**Owner:** @Architect
