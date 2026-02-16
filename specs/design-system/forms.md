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

**Combobox (ROO-80)**
-   **Goal:** Searchable single-select dropdown replacing native `<select>` for large option sets (50+ items).
-   **WAI-ARIA Pattern:** [Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) — editable input with listbox popup.
-   **Tokens:**
    -   Input: Reuses `.input` styles (height, border, focus ring, hover, error)
    -   Listbox: `--kide-surface` background, `--kide-shadow-soft` elevation, `--kide-control-border` border, `--kide-control-radius` corners
    -   Option default: transparent background, `--kide-ink-primary` text
    -   Option active (keyboard-highlighted): `--kide-ice-light` background
    -   Option selected: `--kide-ice-mid` left border accent (2px)
    -   Empty state: `--kide-ink-muted` text ("No results")
    -   Max listbox height: `15rem` (scrollable)
-   **Structure:**
    -   `.combobox` — wrapper `div` (position: relative)
    -   `.combobox__input` — text input (reuses `.input` CSS class)
    -   `.combobox__listbox` — dropdown `ul` (absolutely positioned below input)
    -   `.combobox__option` — list item `li`
    -   `.combobox__option--active` — keyboard-highlighted option
    -   `.combobox__option--selected` — currently selected option
    -   `.combobox__empty` — "No results" message
    -   `.combobox__clear` — optional clear button (appears when value selected)
-   **ARIA Attributes:**
    -   Input: `role="combobox"`, `aria-expanded`, `aria-controls="<listbox-id>"`, `aria-activedescendant="<option-id>"`, `aria-autocomplete="list"`
    -   Listbox: `role="listbox"`, `id` matching `aria-controls`
    -   Option: `role="option"`, `id` (unique), `aria-selected="true|false"`
-   **Keyboard:**
    -   `ArrowDown` — Open listbox (if closed), move highlight to next option
    -   `ArrowUp` — Move highlight to previous option
    -   `Enter` — Select highlighted option, close listbox
    -   `Escape` — Close listbox, restore previous value in input
    -   `Home` / `End` — Jump to first / last option
    -   Typing — Filters options by label (case-insensitive substring match)
-   **Behavior:**
    -   On selection: input displays selected option's `label`, form value is option's `value`
    -   Filtering is case-insensitive substring match on `label`
    -   When listbox opens, all options shown (filter is current input text)
    -   Clear button (×) resets value to empty string and clears input
    -   On blur: if input text doesn't match any option, revert to last valid selection
-   **Props:**
    -   `name: string` — form field name
    -   `label: string` — label text
    -   `options: Array<{ value: string; label: string }>` — option list
    -   `value` ($bindable) — currently selected value (string)
    -   `placeholder?: string` — placeholder text
    -   `required?: boolean`
    -   `disabled?: boolean`
    -   `class?: string`
-   **Form Context Integration:** Same pattern as Select/Input — reads errors/touched, calls `setValue`/`touch`
-   **Standalone usage:** Works without Form context (same pattern as all primitives)

**FileUpload (ROO-81)**
-   **Goal:** Drag & drop file upload with preview, replacing manual DOM manipulation in ProductForm.
-   **Tokens:**
    -   Drop zone: `--kide-surface` background, `--kide-control-border` dashed border, `--kide-control-radius` corners
    -   Drop zone hover/drag-over: `--kide-ice-light` background, `--kide-ice-mid` border
    -   Drop zone text: `--kide-ink-muted`
    -   Preview container: `--kide-surface` background, `--kide-control-border` border, `--kide-control-radius` corners
    -   Error state: `--kide-danger` border
    -   Remove button: `--kide-danger` text, `--kide-danger-hover` on hover
    -   Loading indicator: `--kide-ice-mid` accent
    -   Min height: `8rem` (drop zone)
-   **Structure:**
    -   `.file-upload` — wrapper `div`
    -   `.file-upload__dropzone` — drag & drop target area
    -   `.file-upload__dropzone--active` — drag-over highlight
    -   `.file-upload__dropzone--has-file` — hidden when file selected
    -   `.file-upload__input` — hidden native `<input type="file">`
    -   `.file-upload__preview` — preview container (visible when file selected or existing value)
    -   `.file-upload__image` — preview image element
    -   `.file-upload__info` — file name/size text
    -   `.file-upload__remove` — remove/clear button
    -   `.file-upload__loading` — loading indicator overlay
    -   `.file-upload__error` — error message (reuses FormError)
-   **Behavior:**
    -   Drop zone accepts files via drag & drop or click-to-browse
    -   Visual feedback on drag-over (background + border change)
    -   For image/* MIME types: shows thumbnail preview via `URL.createObjectURL()`
    -   Validates on selection: rejects files exceeding `maxSize` or not matching `accept`
    -   Displays file name and human-readable size (e.g., "2.4 MB")
    -   Existing file URL (`value` prop) renders as preview on mount
    -   Remove button clears file and reverts to drop zone
    -   Loading state (controlled by parent via `loading` prop) shows overlay
    -   Does NOT perform upload itself — emits file to parent via callback
-   **Props:**
    -   `name: string` — form field name
    -   `label: string` — label text
    -   `accept?: string` — comma-separated MIME types (default: `"image/jpeg,image/png,image/webp"`)
    -   `maxSize?: number` — max file size in bytes (default: `5242880` / 5MB)
    -   `value?: string` — existing file URL (for edit mode)
    -   `loading?: boolean` — show loading overlay
    -   `required?: boolean`
    -   `disabled?: boolean`
    -   `class?: string`
    -   `onSelect?: (file: File) => void` — called when valid file is selected
    -   `onRemove?: () => void` — called when remove button is clicked
-   **Form Context Integration:** Same pattern as other fields — reads errors/touched, calls `touch` on interaction
-   **Standalone usage:** Works without Form context
-   **Note:** This component is presentation-only. Actual upload to Supabase Storage is the parent's responsibility (Astro SSR or Form `onSubmit`).

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

**Phase 2 — Combobox (ROO-80):**

_Prerequisite: ROO-77 Form context, ROO-78 Input/Label/FormError, ROO-79 Select patterns._

-   [ ] **Combobox.svelte** created at `packages/design-system/src/components/Combobox.svelte`
    -   Text input with dropdown listbox popup
    -   Type-ahead filtering (case-insensitive substring match on label)
    -   Single selection: selected option label displayed in input, value synced to form
    -   Clear button (×) to reset selection
    -   On blur: reverts to last valid selection if input text doesn't match
-   [ ] **Full WAI-ARIA combobox pattern:**
    -   `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, `aria-autocomplete="list"`
    -   Listbox with `role="listbox"`, options with `role="option"` + `aria-selected`
-   [ ] **Keyboard navigation:**
    -   ArrowDown/ArrowUp to navigate options
    -   Enter to select, Escape to close
    -   Home/End to jump to first/last option
-   [ ] **CSS added to `input.css`:** `.combobox`, `.combobox__input`, `.combobox__listbox`, `.combobox__option`, `.combobox__option--active`, `.combobox__option--selected`, `.combobox__empty`, `.combobox__clear`
-   [ ] **Form context integration:** errors, touched, setValue, touch — same pattern as Input/Select
-   [ ] **Standalone usage:** Works without Form wrapper
-   [ ] **Unit tests** for: filtering logic, selection, keyboard navigation, ARIA attribute updates
-   [ ] **Demo page** updated at `apps/design-system/src/pages/forms.astro` with Combobox section (50+ options to verify performance)
-   [ ] **E2E test** in `apps/design-system/tests/e2e/forms.spec.ts` covering core Combobox interactions

**Phase 2 — FileUpload (ROO-81):**

_Prerequisite: ROO-77 Form context, ROO-78 Input/Label/FormError._

-   [x] **FileUpload.svelte** created at `packages/design-system/src/components/FileUpload.svelte`
    -   Drag & drop zone with visual feedback (border + background change on drag-over)
    -   Click-to-browse fallback via hidden `<input type="file">`
    -   Image preview via `URL.createObjectURL()` for image/* files
    -   Client-side validation: `accept` (MIME type filter) and `maxSize` (byte limit)
    -   Existing file preview when `value` prop provided
    -   Remove button clears selection and preview
    -   Loading overlay controlled by `loading` prop
-   [x] **CSS added to `input.css`:** `.file-upload`, `.file-upload__dropzone`, `.file-upload__dropzone--active`, `.file-upload__dropzone--has-file`, `.file-upload__preview`, `.file-upload__image`, `.file-upload__info`, `.file-upload__remove`, `.file-upload__loading`
-   [x] **Form context integration:** errors, touched — same pattern as Input/Select
-   [x] **Standalone usage:** Works without Form wrapper
-   [x] **Unit tests** for: MIME type validation, file size validation, human-readable size formatting
-   [x] **Demo page** updated at `apps/design-system/src/pages/forms.astro` with FileUpload section
-   [x] **E2E test** in `apps/design-system/tests/e2e/forms.spec.ts` covering drag-drop, validation rejection, preview, remove

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

**Scenario: Combobox filters options as user types (ROO-80)**
- Given: A `Combobox` with 50+ publisher options
- When: The user types "Hel" in the input
- Then: The listbox shows only options whose label contains "Hel" (case-insensitive)
- And: Options not matching are hidden
- And: The listbox is visible (`aria-expanded="true"`)

**Scenario: Combobox selects option with keyboard (ROO-80)**
- Given: A `Combobox` with options and the listbox is open
- And: The first option is highlighted (`aria-activedescendant` points to it)
- When: The user presses ArrowDown twice then Enter
- Then: The third option is selected
- And: The input displays the selected option's label
- And: The listbox closes (`aria-expanded="false"`)
- And: The form value equals the selected option's `value`

**Scenario: Combobox closes on Escape (ROO-80)**
- Given: A `Combobox` with a previously selected value "Alpha"
- And: The listbox is open and the user has typed "Bet"
- When: The user presses Escape
- Then: The listbox closes
- And: The input text reverts to "Alpha" (previous selection)

**Scenario: Combobox shows empty state (ROO-80)**
- Given: A `Combobox` with options ["Alpha", "Beta", "Gamma"]
- When: The user types "xyz"
- Then: The listbox shows a "No results" message
- And: No options are rendered

**Scenario: Combobox clear button resets value (ROO-80)**
- Given: A `Combobox` with "Beta" currently selected
- When: The user clicks the clear button (×)
- Then: The input text is cleared
- And: The form value is reset to empty string
- And: The listbox is closed

**Scenario: Combobox integrates with Form validation (ROO-80)**
- Given: A `Form` with schema requiring `publisher_id` (non-empty string)
- And: A `Combobox` with `name="publisher_id"` and no selection
- When: The user submits the form
- Then: The Combobox shows a validation error
- And: Focus moves to the Combobox input

**Scenario: Combobox works standalone without Form (ROO-80)**
- Given: A `Combobox` rendered WITHOUT a parent `Form`
- When: The user selects an option
- Then: The selection works correctly
- And: No errors are thrown

**Scenario: Combobox reverts on blur with invalid text (ROO-80)**
- Given: A `Combobox` with "Alpha" currently selected
- When: The user clears the input, types "invalid text", then tabs away
- Then: The input text reverts to "Alpha"
- And: The form value remains the value for "Alpha"

**Scenario: FileUpload accepts valid file via click (ROO-81)**
- Given: A `FileUpload` with `accept="image/jpeg,image/png,image/webp"` and `maxSize={5242880}`
- When: The user clicks the drop zone and selects a 2MB JPEG file
- Then: A thumbnail preview is shown
- And: The file name and size ("2.0 MB") are displayed
- And: The `onSelect` callback is called with the File object

**Scenario: FileUpload rejects oversized file (ROO-81)**
- Given: A `FileUpload` with `maxSize={5242880}` (5MB)
- When: The user selects a 10MB file
- Then: An error message "File size must be less than 5 MB" is shown
- And: No preview is displayed
- And: `onSelect` is NOT called

**Scenario: FileUpload rejects invalid MIME type (ROO-81)**
- Given: A `FileUpload` with `accept="image/jpeg,image/png,image/webp"`
- When: The user selects a `.pdf` file
- Then: An error message "File type not accepted" is shown
- And: No preview is displayed

**Scenario: FileUpload shows drag-over feedback (ROO-81)**
- Given: A `FileUpload` in its default state
- When: The user drags a file over the drop zone
- Then: The drop zone background changes to `--kide-ice-light`
- And: The border changes to `--kide-ice-mid`

**Scenario: FileUpload remove clears selection (ROO-81)**
- Given: A `FileUpload` with a file currently selected
- When: The user clicks the remove button
- Then: The preview is hidden
- And: The drop zone is shown again
- And: `onRemove` callback is called

**Scenario: FileUpload shows existing file (ROO-81)**
- Given: A `FileUpload` with `value="https://storage.example.com/covers/img.jpg"`
- When: The component mounts
- Then: The image preview shows the existing file URL
- And: The remove button is visible

**Scenario: FileUpload shows loading state (ROO-81)**
- Given: A `FileUpload` with `loading={true}`
- When: The component renders
- Then: A loading overlay is visible over the preview/drop zone
- And: The drop zone and remove button are not interactive

**Scenario: FileUpload works standalone without Form (ROO-81)**
- Given: A `FileUpload` rendered WITHOUT a parent `Form`
- When: The user selects a valid file
- Then: The preview works correctly
- And: No errors are thrown

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
