# PBI-014: Admin Authentication Infrastructure

> **Spec Reference:** `specs/admin-ui/spec.md`
> **Persona:** @Dev
> **Version:** 0.4.0

---

## 1. The Directive

Set up Supabase Auth with Magic Link (passwordless) for admin access.

**In Scope:**
- Supabase Auth configuration (Magic Link / email OTP)
- Auth middleware protecting `/admin/*` routes
- Login page with email input
- Auth callback page for token exchange
- Logout endpoint
- Session handling via cookies
- Create first admin user

**Out of Scope:**
- Admin dashboard content (see PBI-015)
- CRUD operations (see PBI-016, 017, 018)
- OAuth providers (defer to v0.5)

---

## 2. Context Pointers

- **Auth Provider:** Supabase Auth with Magic Link (passwordless)
- **Session Storage:** HTTP-only cookies (not localStorage)
- **Role Check:** User metadata `role: 'admin'`

---

## 3. Verification Pointers

- **Success Criteria:**
  - Unauthenticated users redirected from `/admin/*` to `/admin/login`
  - Authenticated admins can access `/admin`
  - Logout clears session
- **Quality Gate:** `pnpm tsc --noEmit && pnpm biome check .`

---

## 4. Task Checklist

### Dependencies
- [ ] Install `@supabase/ssr` for server-side auth

### Supabase Configuration
- [ ] Enable Email provider in Supabase Dashboard (Auth → Providers)
- [ ] Configure Magic Link settings (enable, set expiry)
- [ ] Set Site URL and Redirect URLs in Supabase Dashboard
- [ ] Create admin user via Supabase Dashboard (Auth → Users → Add User)
- [ ] Set user metadata: `{ "role": "admin" }`
- [ ] Test magic link email delivery

### Auth Helpers
- [ ] Create `apps/main-site/src/lib/supabase.ts`:
  - `createSupabaseServerClient(cookies)` - Server client with cookie handling
  - `getUser(cookies)` - Get current user or null

### Middleware
- [ ] Create `apps/main-site/src/middleware.ts`
- [ ] Protect all `/admin/*` routes except `/admin/login`
- [ ] Check for valid session and admin role
- [ ] Redirect unauthenticated users to `/admin/login`

### Login Page
- [ ] Create `apps/main-site/src/pages/admin/login.astro`
- [ ] Email input form (no password field)
- [ ] Form submits to Supabase Auth `signInWithOtp({ email })`
- [ ] On success: show "Check your email for login link" message
- [ ] On error: show error message, re-render form
- [ ] If already logged in: redirect to `/admin`

### Auth Callback
- [ ] Create `apps/main-site/src/pages/admin/auth/callback.ts`
- [ ] Exchange token from URL for session
- [ ] Set session cookie
- [ ] Redirect to `/admin`
- [ ] Handle errors (expired link, invalid token)

### Logout Endpoint
- [ ] Create `apps/main-site/src/pages/admin/logout.ts`
- [ ] Call Supabase `signOut()`
- [ ] Clear session cookie
- [ ] Redirect to `/admin/login`

### Placeholder Dashboard
- [ ] Create `apps/main-site/src/pages/admin/index.astro`
- [ ] Simple "Welcome, Admin" message
- [ ] Logout button/link
- [ ] Placeholder for navigation (PBI-015)

### Environment Variables
- [ ] Verify `.env` has `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- [ ] Update `.env.example` with required variables

---

## 5. Refinement Rule

If reality diverges from the Spec:
- [ ] STOP and flag for @Architect review
- [ ] Document the divergence in this PBI
- [ ] Do NOT update Spec without explicit approval

---

## 6. Commit Template

```
feat(admin): add magic link authentication

- Configured Supabase Auth with Magic Link (passwordless)
- Added middleware protecting /admin/* routes
- Created login page with email input
- Created auth callback for token exchange
- Created logout endpoint with session clearing
- Added auth helper utilities

Part of v0.4.0 Admin UI release
```
