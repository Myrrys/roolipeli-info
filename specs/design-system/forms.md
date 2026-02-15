# Spec: Kide Forms (Design System)

## 1. Blueprint (Design)

### Context

> **Goal:** Create a cohesive, type-safe, and accessible form system for the "Kide" (Ice Crystal) design system.
> **Why:** Current forms in the main application are built with manual DOM manipulation, lack consistent validation feedback, and have poor UX for complex data (arrays, relationships).
> **Architectural Impact:** Introduces a suite of Svelte 5 components to `@roolipeli/design-system` for building forms, leveraging Zod for validation.

### UI Architecture

**Framework / Tech Stack:**
-   **Svelte 5:** Use Runes (`$state`, `$derived`, `$effect`) for reactive state management.
-   **Zod:** Schema-based validation.
-   **HTML/CSS:** Semantic elements styled with Kide tokens (`--kide-*`).

**Core Concepts:**
1.  **Controlled & Uncontrolled:** Components should support both controlled (bind:value) and uncontrolled modes where possible, but optimized for a "schema-first" approach.
2.  **Context awareness:** A `Form` wrapper provides the validation context (stores/signals) to all child fields, eliminating prop drilling for error messages.
3.  ** Accessibility First:** All inputs have linked labels (`for`/`id`) and error messages (`aria-describedby`).

**Components to Build:**

#### 1. Primitives (Stateless)
-   `Input.svelte`: Text, number, email, password, url.
-   `Textarea.svelte`: Auto-sizing textarea.
-   `Select.svelte`: Native select for simple lists.
-   `Checkbox.svelte` / `Switch.svelte`: Boolean toggles.
-   `RadioGroup.svelte`: Accessible radio button sets.
-   `Label.svelte`: Consistently styled labels with optional "required" indicator.
-   `FormError.svelte`: Field-level error message.

#### 2. Complex Components (Stateful/Interactive)
-   `Combobox.svelte`: Searchable single-select (replaces Publisher select).
-   `MultiSelect.svelte`: Searchable multi-select (replaces Semantic Label selection).
-   `ArrayField.svelte`: A higher-order component for managing lists of objects (e.g., Creators, References, ISBNs).
    -   Provides `add()`, `remove(index)`, `move(from, to)` slots/props.
    -   Handles drag-and-drop reordering (future pbi).
-   `FileUpload.svelte`: Drag & drop zone with preview (replaces current Cover Image setup).
    -   Integrated loading state and error handling.

#### 3. The `Form` Wrapper
-   `Form.svelte`:
    -   Props: `schema` (Zod), `initialValues`, `onSubmit`.
    -   Manages form state (touched, dirty, invalid, submitting).
    -   Exposes context to fields via Svelte `setContext`.

##### Form Context Interface (ROO-77 Core Contract)

The `Form` wrapper provides the following context to all child fields. This is the foundational API that every field component (ROO-78, ROO-79, etc.) depends on.

```typescript
import type { ZodObject, ZodRawShape } from 'zod';

/** Unique context key for Kide forms */
export const FORM_CONTEXT_KEY = Symbol('kide-form');

/** Per-field error messages, keyed by field name (dot-path for nested) */
type FieldErrors = Record<string, string[]>;

/** Context provided by Form.svelte to all child fields */
interface FormContext {
  /** Current field errors from last validation run. Reactive ($state). */
  readonly errors: FieldErrors;
  /** Set of field names the user has interacted with. Reactive ($state). */
  readonly touched: Set<string>;
  /** True while the onSubmit callback is executing. Reactive ($state). */
  readonly submitting: boolean;
  /** Mark a field as touched (called by child on blur). */
  touch(name: string): void;
  /** Get current form values as a plain object. */
  getValues(): Record<string, unknown>;
  /** Programmatically set a field value (for Combobox, FileUpload, etc.). */
  setValue(name: string, value: unknown): void;
}
```

**How fields consume the context:**
```svelte
<script lang="ts">
  import { getContext } from 'svelte';
  import { FORM_CONTEXT_KEY, type FormContext } from '@roolipeli/design-system/components/Form.svelte';

  const { name } = $props<{ name: string }>();
  const form = getContext<FormContext>(FORM_CONTEXT_KEY);

  const fieldErrors = $derived(form.errors[name] ?? []);
  const isTouched = $derived(form.touched.has(name));
  const showError = $derived(isTouched && fieldErrors.length > 0);
</script>
```

**Validation flow:**
1. On submit, `Form` runs `schema.safeParse(values)`
2. If validation fails, maps Zod `issues` to `FieldErrors` by path
3. Moves focus to the first invalid field's `<input>` (via `name` attribute selector)
4. Calls `onSubmit(data)` only if validation passes

### Detailed Component Specs

**Input / Textarea**
-   **Tokens:**
    -   Height: `--kide-control-height-md` (40px)
    -   Navigational/Focus: `--kide-control-focus-ring`
    -   Border: `--kide-border-input` (alias of `--kide-border-strong`)
-   **States:**
    -   Default
    -   Focus (Ice Light ring)
    -   Error (Red border + error text)
    -   Disabled (Muted bg/text)

**ArrayField (The "missing component")**
-   **Goal:** Eliminate manual `document.createElement` logic in `ProductForm.astro`.
-   **Usage:**
    ```svelte
    <ArrayField name="creators" let:items let:add let:remove>
        {#each items as item, i}
            <div class="row">
                <Combobox bind:value={item.creator_id} options={creators} />
                <Input bind:value={item.role} placeholder="Role" />
                <Button on:click={() => remove(i)} variant="icon-danger">×</Button>
            </div>
        {/each}
        <Button on:click={add} variant="secondary">+ Add Creator</Button>
    </ArrayField>
    ```

### Build Pipeline (ROO-77)

**Strategy: No build step.** Svelte components are distributed as raw `.svelte` files.

- `packages/design-system/src/components/Form.svelte` (and all future Svelte components) are consumed directly by Astro's Vite pipeline via `@astrojs/svelte`
- The existing `"./components/*": "./src/components/*"` wildcard export in `package.json` already supports this
- No `svelte-package`, `vite lib mode`, or pre-compilation needed
- TypeScript types are co-located in `.svelte` files (using `<script lang="ts">`) or in adjacent `.ts` files for shared interfaces
- `apps/design-system` already has `@astrojs/svelte` + `svelte.config.js` configured

**Dependency note:** `zod` must be added to `packages/design-system` dependencies (currently only in `@roolipeli/database`). This is acceptable since Zod is already in the monorepo and is the mandated validation library.

### Anti-Patterns
-   **Do not** rely on browser-native validation `reportValidity()` alone; use Zod for consistent UX.
-   **Do not** mix form logic with layout logic in Astro files; encapsulate in Svelte.
-   **Do not** use `setTimeout` for debouncing; use a proper utility.

### Constraints
-   **Protected package:** `packages/design-system` requires `ALLOW_DS_EDIT=true` env var to commit (CLAUDE.md §3 Tier 2). Lefthook enforces this.
-   **ASK tier triggered:** All ROO-76 child issues modify the design system. Developer must set `ALLOW_DS_EDIT=true` before committing.

---

## 2. Contract (Quality)

### Definition of Done

**Epic-level (ROO-76):**
-   [ ] `Form`, `Input`, `Select`, `Checkbox` components created in `@roolipeli/design-system`.
-   [ ] `Combobox` and `ArrayField` created for complex data.
-   [ ] Demo pages created in `apps/design-system`.
-   [ ] Unit tests (Vitest) for validation logic and state management (Zod schemas, Svelte runes).
-   [ ] `ProductForm.astro` refactored to use the new system (or replaced by `ProductForm.svelte`).

**Phase 1 — Form Wrapper (ROO-77):**
-   [ ] `Form.svelte` created at `packages/design-system/src/components/Form.svelte`
-   [ ] Accepts `schema` (Zod), `initialValues` (generic `Record<string, unknown>`), and `onSubmit` callback
-   [ ] Manages reactive state: `errors`, `touched`, `submitting` via Svelte 5 Runes (`$state`)
-   [ ] Provides `FormContext` to children via `setContext(FORM_CONTEXT_KEY, ...)`
-   [ ] Runs `schema.safeParse()` on submit and maps Zod issues to per-field error arrays
-   [ ] Moves focus to first invalid field on validation failure (via `[name="fieldName"]` selector)
-   [ ] Calls `onSubmit(validatedData)` only when validation passes
-   [ ] `zod` added to `packages/design-system` dependencies
-   [ ] Svelte 5 components importable from `@roolipeli/design-system/components/Form.svelte` in main-site
-   [ ] Unit tests (Vitest) for: validation mapping, context exposure, focus management
-   [ ] Demo page at `apps/design-system/src/pages/forms.astro` showing Form with a simple Zod schema
-   [ ] E2E test in `apps/design-system/tests/e2e/` verifying submit + validation + focus behavior

### Testing Strategy (Alignment with specs/testing-strategy.md)

**Unit Testing (Vitest):**
- **Scope:** Component logic, Zod schema validation, State management (Runes).
- **Location:** `packages/design-system/src/components/*.test.ts`

**E2E Testing (Layer 1 - UI-Only Mocking):**
- **Scope:** Verify component interactions, accessibility focus management, and client-side validation feedback in isolation.
- **Tool:** Playwright (in `apps/design-system`).
- **Strategy:** Use `page.route` to mock any necessary API calls (though most form primitives should be pure UI). Verify `aria-invalid` states and error message visibility.

**Integration Testing (Layer 2/3):**
- **Scope:** Verify `ProductForm` submission in `apps/main-site`.
- **Strategy:** Use existing `apps/main-site` E2E tests to verify the refactored form works with the real backend (or local Supabase).

### Accessibility Requirements
-   **Focus Management:** Moving focus to the first invalid field on submit.
-   **ARIA:** `aria-invalid="true"`, `aria-describedby="error-id"`, `aria-required="true"`.
-   **Keyboard:** Full keyboard navigation support (Enter to submit, Esc to clear/close dropdowns).

### Regression Guardrails
-   Ensure existing `PasswordLoginForm.svelte` can be refactored to use new components without breaking.
-   Existing Astro component exports (`Breadcrumbs.astro`, `EntityCover.astro`, `SiteHeader.astro`) must continue working after Svelte components are added.
-   CSS exports (`input.css`, `button.css`, etc.) must remain unchanged — Svelte components import them internally.
-   `apps/design-system` existing E2E tests must pass after new pages are added.

### Scenarios (Gherkin)

**Scenario: Form submits valid data (ROO-77)**
- Given: A `Form` wraps fields matching a Zod schema `z.object({ name: z.string().min(1), email: z.string().email() })`
- And: The user has filled `name` = "Ville" and `email` = "test@example.com"
- When: The user clicks submit
- Then: `onSubmit` is called with `{ name: "Ville", email: "test@example.com" }`
- And: No error messages are displayed

**Scenario: Form blocks submission on invalid data and focuses first error (ROO-77)**
- Given: A `Form` wraps fields matching a Zod schema with `name` (required) and `email` (email format)
- And: The user has left `name` empty and entered `email` = "not-an-email"
- When: The user clicks submit
- Then: `onSubmit` is NOT called
- And: The `name` field shows a validation error
- And: The `email` field shows a validation error
- And: Focus moves to the `name` input (first invalid field)

**Scenario: Field errors appear in context for child components (ROO-77)**
- Given: A `Form` with schema `z.object({ title: z.string().min(3) })`
- And: A child component reads `FormContext.errors["title"]`
- When: The user submits with `title` = "AB"
- Then: `FormContext.errors["title"]` contains a Zod error message
- And: `FormContext.touched` includes "title"

**Scenario: Form shows submitting state during async onSubmit (ROO-77)**
- Given: A `Form` with an async `onSubmit` that takes 500ms
- When: The user submits valid data
- Then: `FormContext.submitting` is `true` while `onSubmit` executes
- And: The submit button is disabled during submission
- And: `FormContext.submitting` returns to `false` after completion

**Scenario: Svelte components importable from design-system (ROO-77)**
- Given: `Form.svelte` exists at `packages/design-system/src/components/Form.svelte`
- When: `apps/main-site` imports `@roolipeli/design-system/components/Form.svelte`
- Then: The import resolves without errors
- And: The component renders in an Astro page with `client:load`

---

## 3. Implementation Plan (Phased)

### Phase 1: Core Primitives
-   Setup Svelte 5 in `design-system`.
-   Implement `Input`, `Label`, `Button` (Svelte wrapper around css), `FormError`.
-   Implement `Form` context with Zod integration.

### Phase 2: Complex Inputs
-   Implement `Combobox` (Searchable).
-   Implement `FileUpload` (with preview).

### Phase 3: Dynamic Data
-   Implement `ArrayField`.
-   Refactor `ProductForm` to use the new system.
-   Refactor `ProductForm.astro` to be a wrapper around `ProductForm.svelte`.

---

## 4. References

-   **Zod:** [Documentation](https://zod.dev/)
-   **Svelte 5 Runes:** [Documentation](https://svelte.dev/docs/svelte/runes)
-   **WAI-ARIA Pattern implementation:** [Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)
