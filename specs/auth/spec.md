# Spec: Regular User Authentication

## 1. Blueprint (Design)

### Context
> **Goal:** Allow regular users to log in, manage their account, and request data deletion.
> **Why:** Enable future features like content suggestions, favorites, and personalized experiences while maintaining GDPR compliance.
> **Architectural Impact:** Adds `profiles` table, public auth routes (`/kirjaudu`, `/tili`, `/auth/callback`), extends middleware, and integrates with SiteHeader.

### Authentication Strategy

**Provider:** Supabase Auth with Magic Link (passwordless email)

**Why Magic Link:**
- Consistent with existing admin auth flow
- No passwords to manage or forget
- More secure (no credentials to leak)
- Simple UX: enter email → click link → logged in

**User Roles:**
| Role | Permissions | Implementation |
|------|-------------|----------------|
| `admin` | Full CRUD on all entities | Existing: `app_metadata.role = 'admin'` |
| `user` | Read-only + own profile management | Default: no `app_metadata.role` or `role = 'user'` |
| `anonymous` | Read-only public catalog | No session |

### Auth Flow

1. User navigates to `/kirjaudu` (or clicks "Kirjaudu" in SiteHeader)
2. User enters email → Supabase sends magic link (the `next` query param from `/kirjaudu?next=X` is forwarded into `emailRedirectTo` as `/auth/callback?next=X`)
3. User clicks link in email → redirected to `/auth/callback`
4. Callback validates `next` parameter (relative path only, no `//`)
5. Callback exchanges code for session
6. If first login: `profiles` row created via DB trigger
7. Session stored in HTTP-only cookie
8. User redirected to `next` or `/` (home)

### Data Architecture

**New Table: `profiles`**

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**RLS Policies:**

```sql
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins have full access (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Enable write access for admins"
  ON profiles FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
```

**Zod Schema:**

```typescript
// packages/database/src/schemas/core.ts
import { z } from 'zod';

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  display_name: z.string().max(100).nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Profile = z.infer<typeof ProfileSchema>;
```

### UI Architecture

#### Routes

```
/kirjaudu              → Public login page (Magic Link request)
/auth/callback         → Token exchange (shared for all users)
/tili                  → Account page (requires auth)
/api/auth/delete       → Account deletion endpoint (POST)
```

#### Components

**Modified:**
- `SiteHeader.astro` - Conditional login/logout button + user display

**New:**
- `apps/main-site/src/pages/kirjaudu.astro` - Login form
- `apps/main-site/src/pages/auth/callback.ts` - Auth callback
- `apps/main-site/src/pages/tili.astro` - Account page
- `apps/main-site/src/pages/api/auth/delete.ts` - Deletion API

#### Data Flow

```
SiteHeader (SSR)
  ↓
Check session via supabase.auth.getUser()
  ↓
If logged in: show display_name + logout link
If not: show "Kirjaudu" link
```

### Account Deletion Flow

1. User navigates to `/tili`
2. User clicks "Poista tili" (Delete account)
3. Confirmation modal appears
4. User confirms by typing email or clicking confirm
5. POST to `/api/auth/delete`
6. Server deletes user from `auth.users` (cascades to `profiles`)
7. Session cleared
8. User redirected to `/` with success message

### File Structure

```
apps/main-site/src/
├── pages/
│   ├── kirjaudu.astro          # Public login page
│   ├── tili.astro              # Account management
│   ├── auth/
│   │   └── callback.ts         # Shared auth callback
│   └── api/
│       └── auth/
│           └── delete.ts       # Account deletion
├── middleware.ts               # Extended for /tili protection
└── components/
    └── SiteHeader integration  # Conditional auth UI
```

### Anti-Patterns

- **NEVER** use `user_metadata` for role checks (user-modifiable)
- **NEVER** expose user email publicly (privacy)
- **NEVER** allow deletion without confirmation
- **NEVER** skip `next` parameter validation (open redirect prevention)
- **NEVER** fetch user data client-side in Svelte (use Astro SSR)

---

## 2. Contract (Quality)

### Definition of Done

**Database:**
- [ ] `profiles` table created with proper constraints
- [ ] RLS policies applied (own profile read/update, admin read all)
- [ ] Trigger for auto-profile creation on signup
- [ ] Zod schema in `@roolipeli/database`
- [ ] Types regenerated via `supabase gen types`

**Public Login (`/kirjaudu`):**
- [ ] Magic Link email sent on form submit
- [ ] Success message shown after submission
- [ ] Error handling for invalid email
- [ ] Redirect to `next` param after login (if provided)
- [ ] Already logged-in users redirected to `/tili`

**Auth Callback (`/auth/callback`):**
- [ ] Exchanges code for session
- [ ] Validates `next` param (relative path, no `//`)
- [ ] Redirects to `next` or `/` on success
- [ ] Redirects to `/kirjaudu?error=...` on failure

**Account Page (`/tili`):**
- [ ] Protected by middleware (redirects to `/kirjaudu` if not logged in)
- [ ] Shows user email and display_name
- [ ] Allows updating display_name
- [ ] Shows "Poista tili" button
- [ ] Shows account creation date

**Account Deletion:**
- [ ] Requires confirmation
- [ ] Deletes user from `auth.users` (cascades profile)
- [ ] Clears session
- [ ] Redirects to `/` with success message

**SiteHeader Integration:**
- [ ] Shows "Kirjaudu" link when not logged in
- [ ] Shows user display_name (or email fallback) when logged in
- [ ] Shows logout link when logged in

**Quality:**
- [ ] `pnpm biome check .` passes
- [ ] `pnpm tsc --noEmit` passes
- [ ] No `any` types
- [ ] All forms use Zod validation
- [ ] E2E tests for all scenarios

### Regression Guardrails

- **Invariant:** Admin routes remain protected (no regression from public auth)
- **Invariant:** `app_metadata.role` is authoritative for permissions
- **Invariant:** Session cookies are HTTP-only
- **Invariant:** Open redirect prevention on all callback URLs

### Scenarios (Gherkin)

**Scenario: User logs in for the first time**
- Given: User has no existing account
- When: User navigates to `/kirjaudu`
- And: User enters email and submits
- Then: "Check your email" message shown
- When: User clicks magic link in email
- Then: New user created in `auth.users`
- And: Profile row auto-created via trigger
- And: Session cookie set
- And: User redirected to `/`

**Scenario: Returning user logs in**
- Given: User has existing account
- When: User enters email on `/kirjaudu`
- And: Clicks magic link
- Then: Session established
- And: Redirected to `/` (or `next` param)

**Scenario: User views account page**
- Given: User is logged in
- When: User navigates to `/tili`
- Then: Page shows email and display_name
- And: Shows account creation date
- And: Shows "Update" and "Delete" options

**Scenario: User updates display name**
- Given: User is on `/tili`
- When: User changes display_name to "Matti M."
- And: Submits form
- Then: Profile updated in database
- And: Success message shown

**Scenario: User deletes account**
- Given: User is on `/tili`
- When: User clicks "Poista tili"
- Then: Confirmation modal appears
- When: User confirms deletion
- Then: User deleted from `auth.users`
- And: Profile cascaded (deleted)
- And: Session cleared
- And: Redirected to `/` with success message

**Scenario: Login fails due to Supabase error**
- Given: User is on `/kirjaudu`
- When: User submits email and `signInWithOtp` returns an error
- Then: Error message is shown on the page
- And: Form remains visible for retry

**Scenario: Unauthenticated user tries to access /tili**
- Given: User is not logged in
- When: User navigates to `/tili`
- Then: Redirected to `/kirjaudu?next=/tili`

**Scenario: User sees loading state during login**
- Given: User is on `/kirjaudu`
- When: User submits email
- And: Network request is pending
- Then: Submit button is disabled
- And: Loading spinner is visible

**Scenario: User sees specific error code from Supabase**
- Given: User is on `/kirjaudu`
- When: User submits email
- And: Supabase returns 429 (Rate Limit)
- Then: Page shows "Too many requests, try again later"

**Scenario: SiteHeader shows login state**
- Given: User is not logged in
- When: User views any page
- Then: SiteHeader shows "Kirjaudu" link
- Given: User is logged in
- When: User views any page
- Then: SiteHeader shows display_name and logout link

---

## 3. Implementation Notes

### Middleware Extension

```typescript
// Extend existing middleware to protect /tili
if (url.pathname === '/tili') {
  const supabase = createSupabaseServerClient(context);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect(`/kirjaudu?next=${encodeURIComponent(url.pathname)}`);
  }
}
```

### Shared Callback Logic

The `/auth/callback` route handles both admin and regular user logins:
- Validates `next` parameter
- Exchanges code for session
- Redirects appropriately

### Account Deletion with Supabase Admin

```typescript
// /api/auth/delete.ts
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

// Delete user (cascades to profiles via FK)
await supabaseAdmin.auth.admin.deleteUser(userId);
```

### i18n Keys

```typescript
// New translation keys needed:
'nav.login': 'Kirjaudu',
'nav.logout': 'Kirjaudu ulos',
'nav.account': 'Tili',
'account.title': 'Tilisi',
'account.email': 'Sähköposti',
'account.displayName': 'Näyttönimi',
'account.createdAt': 'Tili luotu',
'account.update': 'Päivitä',
'account.delete': 'Poista tili',
'account.deleteConfirm': 'Haluatko varmasti poistaa tilisi?',
'account.deleteSuccess': 'Tilisi on poistettu.',
'login.title': 'Kirjaudu sisään',
'login.emailSent': 'Kirjautumislinkki lähetetty!',
'login.error': 'Virhe kirjautumisessa',
```

---

## 4. Dependencies & Constraints

### Existing Dependencies (No New)
- `@supabase/ssr` - Already in use for admin auth
- `@supabase/supabase-js` - Already in use

### Constraints
- **SSR Required:** Auth pages must be server-rendered
- **Cookie-based Auth:** JWT in HTTP-only cookie (existing pattern)
- **GDPR Compliance:** Account deletion must be complete and immediate

---

## 5. Related Specs

- `specs/admin-ui/spec.md` - Admin authentication (related patterns)
- `specs/design-system/layout-and-navigation.md` - SiteHeader integration
- `specs/testing-strategy.md` - Overall testability and infrastructure strategy

---

**Spec Status:** Draft
**Created:** 2026-02-04
**Linear Issue:** ROO-30
**Owner:** @Architect
