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
-   `Input.svelte`: Text, number, email, password, url. Forwards native attributes (class, placeholder, etc.) directly to the input.
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
    -   Focus ring: `--kide-control-ring-focus`
    -   Border: `--kide-control-border` (maps to `--kide-border-subtle`)
    -   Border hover: `--kide-ice-mid`
    -   Placeholder text: `--kide-ink-muted`
-   **States:**
    -   Default
    -   Hover (Ice Mid border)
    -   Focus (Ice Light ring)
    -   Error (Red border + error text)
    -   Disabled (Muted bg/text, `not-allowed` cursor)
-   **Standalone usage:** Components MUST work without a parent `Form` wrapper. When no Form context exists, error/touched state is simply inactive.

**Textarea-specific:**
-   Auto-sizes height to content via `$effect` adjusting `style.height` on input
-   Optional `maxlength` prop shows character count below the field (`{current}/{max}`)
-   Uses `.textarea` CSS class from `input.css` (no fixed height, `min-height: 5rem`, vertical resize)

**Select**
-   Native `<select>` wrapper — follows "Native First" principle (specs/design-system/spec.md)
-   CSS already exists in `input.css` (`.select` class with custom dropdown arrow)
-   **Tokens:** Same as Input (height, border, focus, hover, disabled, error)
-   **States:** Default, Hover, Focus, Error, Disabled (same as Input)
-   **Standalone usage:** Works without Form context (same pattern as Input)
-   **Props:**
    -   `options: Array<{ value: string; label: string }>` — option list
    -   `placeholder?: string` — renders as disabled first `<option>`
    -   Standard: `name`, `label`, `required`, `disabled`, `value` ($bindable)

**Checkbox**
-   Native `<input type="checkbox">` with `appearance: none` + custom CSS
-   **Tokens:**
    -   Unchecked: `--kide-control-bg` background, `--kide-control-border` border
    -   Checked: `--kide-ice-mid` background, `--kide-text-on-filled` checkmark
    -   Focus: `--kide-control-ring-focus`
    -   Size: `1.25rem` (20px), border-radius: `--kide-control-radius`
-   **States:** Default, Hover (ice-mid border), Checked, Indeterminate, Focus, Disabled, Error
-   **Indeterminate:** Set via `indeterminate` prop, renders a dash instead of checkmark
-   **Layout:** Label renders inline-right of the checkbox (clickable area covers both)
-   **Standalone usage:** Works without Form context

**Switch**
-   Native `<input type="checkbox" role="switch">` with custom track/thumb CSS
-   **Tokens:**
    -   Track off: `--kide-control-border` background
    -   Track on: `--kide-ice-mid` background
    -   Thumb: `--kide-surface` (white circle)
    -   Focus: `--kide-control-ring-focus` on track
    -   Track size: `2.5rem × 1.25rem`, thumb: `1rem` circle
-   **States:** Off, On, Focus, Disabled
-   **ARIA:** `role="switch"`, `aria-checked` mirrors checked state
-   **Standalone usage:** Works without Form context

**RadioGroup**
-   Container: `<fieldset role="radiogroup">` with `<legend>` for group label
-   Options: Native `<input type="radio">` with `appearance: none` + custom CSS
-   **Tokens:**
    -   Unchecked: `--kide-control-bg`, `--kide-control-border` (circle)
    -   Checked: `--kide-ice-mid` inner dot, `--kide-ice-mid` border
    -   Focus: `--kide-control-ring-focus`
    -   Size: `1.25rem` circle, inner dot `0.5rem`
-   **Layout:** `orientation` prop: `"vertical"` (default, stacked) or `"horizontal"` (inline)
-   **Keyboard:** Arrow keys move selection between options (standard radio behavior)
-   **Props:**
    -   `name: string` — shared name for all radio inputs
    -   `label: string` — group label (renders as `<legend>`)
    -   `options: Array<{ value: string; label: string }>` — radio options
    -   `orientation?: "vertical" | "horizontal"`
    -   `value` ($bindable) — currently selected value
-   **Standalone usage:** Works without Form context

**ArrayField (The "missing component")**
-   **Goal:** Eliminate manual `document.createElement` logic in `ProductForm.astro`.
-   **Usage:**
    ```svelte
    <ArrayField name="creators" let:items let:add let:remove>
        {#each items as item, i}
            <div class="row">
                <Combobox bind:value={item.creator_id} options={creators} />
                <Input bind:value={item.role} placeholder="Role" />
                <button type="button" onclick={() => remove(i)} class="btn btn-danger btn-icon">×</button>
            </div>
        {/each}
        <button type="button" onclick={add} class="btn btn-outlined">+ Add Creator</button>
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

**Phase 1 — Input Primitives (ROO-78):**

_Prerequisite: ROO-77 delivered basic Input, Label, FormError. ROO-78 hardens these and adds Textarea._

-   [ ] **Textarea.svelte** created at `packages/design-system/src/components/Textarea.svelte`
    -   Auto-sizes height to content (no scrollbar until max height)
    -   Optional `maxlength` with visible character count (`{current}/{max}`)
    -   Same Form context integration as Input (errors, touched, value sync)
    -   Uses `.textarea` CSS class from `input.css`
-   [ ] **Input.svelte hardened:**
    -   Works standalone (without Form context) — gracefully handles `undefined` context
    -   `disabled` prop properly forwarded and visually reflected
    -   `aria-describedby` always points to error container ID (not conditionally removed)
    -   Hover state uses `--kide-ice-mid` border
-   [ ] **FormError.svelte hardened:**
    -   Shows all errors for a field (not just first)
    -   Works standalone (without Form context) — accepts `errors` prop as override
-   [ ] **Label.svelte hardened:**
    -   Replace hardcoded `margin-left: 0.25em` with token-based spacing
-   [ ] **CSS updates to `input.css`:**
    -   Add `.input:hover` / `.textarea:hover` / `.select:hover` border state using `--kide-ice-mid`
    -   Add `::placeholder` color using `--kide-ink-muted`
-   [ ] All 4 components have unit tests in `packages/design-system/src/components/`
-   [ ] Demo page updated to showcase: Textarea, disabled inputs, standalone usage (no Form wrapper)
-   [ ] E2E test covers Textarea auto-sizing and disabled state

**Phase 1 — Selection & Boolean Controls (ROO-79):**

_Prerequisite: ROO-77 Form context, ROO-78 Input/Label/FormError patterns._

-   [ ] **Select.svelte** created at `packages/design-system/src/components/Select.svelte`
    -   Wraps native `<select>` with Form context integration
    -   Accepts `options` array and `placeholder` prop
    -   Uses existing `.select` CSS from `input.css`
    -   Works standalone (without Form context)
-   [ ] **Checkbox.svelte** created at `packages/design-system/src/components/Checkbox.svelte`
    -   Custom-styled via `appearance: none` on native input
    -   Supports `indeterminate` state
    -   Label area clickable (inline layout)
    -   Works standalone
-   [ ] **Switch.svelte** created at `packages/design-system/src/components/Switch.svelte`
    -   Track + thumb toggle using `role="switch"`
    -   `aria-checked` reflects state
    -   Works standalone
-   [ ] **RadioGroup.svelte** created at `packages/design-system/src/components/RadioGroup.svelte`
    -   `<fieldset role="radiogroup">` with `<legend>`
    -   Arrow key navigation between options
    -   Horizontal and vertical orientation
    -   Works standalone
-   [ ] **CSS added to `input.css`:** `.checkbox`, `.switch`, `.radio`, `.radio-group` classes
-   [ ] Demo page updated with Select, Checkbox, Switch, RadioGroup examples
-   [ ] E2E tests cover all 4 components' core interactions

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
- And: The submit button is disabled (via attribute) during submission
- And: `FormContext.submitting` returns to `false` after completion

**Scenario: Svelte components importable from design-system (ROO-77)**
- Given: `Form.svelte` exists at `packages/design-system/src/components/Form.svelte`
- When: `apps/main-site` imports `@roolipeli/design-system/components/Form.svelte`
- Then: The import resolves without errors
- And: The component renders in an Astro page with `client:load`

**Scenario: Input works standalone without Form context (ROO-78)**
- Given: An `Input` component rendered WITHOUT a parent `Form`
- And: The `name` prop is "title" and `label` is "Title"
- When: The user types "Hello"
- Then: The input value updates to "Hello"
- And: No errors are thrown
- And: No FormError is rendered

**Scenario: Textarea auto-sizes to content (ROO-78)**
- Given: A `Textarea` component inside a `Form`
- When: The user types multiple lines of text exceeding the initial height
- Then: The textarea height grows to fit the content
- And: No vertical scrollbar appears (until max height, if set)

**Scenario: Textarea shows character count (ROO-78)**
- Given: A `Textarea` with `maxlength={200}`
- When: The user has typed 150 characters
- Then: A counter displays "150/200"
- And: When the user reaches 200 characters, input is capped

**Scenario: Disabled input prevents interaction (ROO-78)**
- Given: An `Input` with `disabled={true}`
- When: The user attempts to click or type in the input
- Then: The input does not receive focus
- And: The input has `--kide-control-bg-disabled` background
- And: The cursor shows `not-allowed`

**Scenario: FormError shows all validation messages (ROO-78)**
- Given: A field "password" with errors `["Too short", "Needs uppercase"]`
- When: The form has been submitted
- Then: Both error messages are visible to the user
- And: Each has `role="alert"` for screen reader announcement

**Scenario: Select shows placeholder and syncs value (ROO-79)**
- Given: A `Select` with `placeholder="Choose..."` and options `[{value: "a", label: "Alpha"}, {value: "b", label: "Beta"}]`
- When: The user selects "Beta"
- Then: The select value updates to "b"
- And: The placeholder option is no longer selected

**Scenario: Checkbox toggles and supports indeterminate (ROO-79)**
- Given: A `Checkbox` with `name="agree"` and `label="I agree"`
- When: The user clicks the checkbox
- Then: The checkbox becomes checked
- And: `aria-checked` is "true"
- When: The `indeterminate` prop is set to `true`
- Then: The checkbox displays a dash indicator
- And: `aria-checked` is "mixed"

**Scenario: Switch toggles boolean value (ROO-79)**
- Given: A `Switch` with `name="notifications"` and `label="Enable notifications"`
- And: The switch is initially off
- When: The user clicks the switch
- Then: The switch slides to the "on" position
- And: `aria-checked` changes to "true"
- And: The track background changes to `--kide-ice-mid`

**Scenario: RadioGroup selects option with keyboard (ROO-79)**
- Given: A `RadioGroup` with `name="color"` and options `["Red", "Green", "Blue"]`
- And: "Red" is currently selected
- When: The user presses the Down arrow key
- Then: "Green" becomes selected
- And: Focus moves to the "Green" radio input

**Scenario: Selection controls work standalone (ROO-79)**
- Given: A `Checkbox` rendered WITHOUT a parent `Form`
- When: The user clicks it
- Then: It toggles without errors
- And: No FormError is rendered

---

## 3. Implementation Plan (Phased)

### Phase 1: Core Primitives
-   Setup Svelte 5 in `design-system`.
-   Implement `Input`, `Label`, `FormError`.
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
