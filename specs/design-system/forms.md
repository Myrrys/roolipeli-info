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
    -   Exposes context to fields.

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

### Anti-Patterns
-   **Do not** rely on browser-native validation `reportValidity()` alone; use Zod for consistent UX.
-   **Do not** mix form logic with layout logic in Astro files; encapsulate in Svelte.
-   **Do not** use `setTimeout` for debouncing; use a proper utility.

---

## 2. Contract (Quality)

### Definition of Done

-   [ ] `Form`, `Field`, `Input`, `Select`, `Checkbox` components created in `@roolipeli/design-system`.
-   [ ] `Combobox` and `ArrayField` created for complex data.
-   [ ] Storybook or equivalent demo pages created in `apps/design-system`.
-   [ ] Unit tests (Vitest) for validation logic and state management (Zod schemas, Svelte runes).
-   [ ] `ProductForm.astro` refactored to use the new system (or replaced by `ProductForm.svelte`).

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

### Regressions Guardrails
-   Ensure existing `PasswordLoginForm.svelte` can be refactored to use new components without breaking.

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
