<script lang="ts">
import Checkbox from '@roolipeli/design-system/components/Checkbox.svelte';
import Form from '@roolipeli/design-system/components/Form.svelte';
import Input from '@roolipeli/design-system/components/Input.svelte';
import RadioGroup from '@roolipeli/design-system/components/RadioGroup.svelte';
import Select from '@roolipeli/design-system/components/Select.svelte';
import Switch from '@roolipeli/design-system/components/Switch.svelte';
import Textarea from '@roolipeli/design-system/components/Textarea.svelte';

import { z } from 'zod';

const schema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  age: z.coerce.number().min(18, 'Must be at least 18').optional(),
  bio: z.string().max(200, 'Bio must be 200 characters or less').optional(),
  category: z.string().min(1, 'Please select a category'),
  agree: z.literal(true, { errorMap: () => ({ message: 'You must agree to the terms' }) }),
  color: z.string().min(1, 'Please select a color'),
});

const initialValues = {
  username: 'Ville',
  email: '',
  role: 'User',
  category: '',
  agree: false,
  notifications: false,
  color: '',
};

const categoryOptions = [
  { value: 'rpg', label: 'RPG' },
  { value: 'board', label: 'Board Game' },
  { value: 'card', label: 'Card Game' },
  { value: 'miniatures', label: 'Miniatures' },
];

const colorOptions = [
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
  { value: 'blue', label: 'Blue' },
];

let successMessage = $state('');
// biome-ignore lint/style/useConst: Svelte bind:value requires let with $state
let standaloneValue = $state('');
// biome-ignore lint/style/useConst: Svelte bind:value requires let with $state
let standaloneSelectValue = $state('');
// biome-ignore lint/style/useConst: Svelte bind:checked requires let with $state
let standaloneCheckbox = $state(false);
// biome-ignore lint/style/useConst: Svelte bind:checked requires let with $state
let standaloneSwitch = $state(false);
// biome-ignore lint/style/useConst: Svelte bind:value requires let with $state
let standaloneRadio = $state('');

function handleSubmit(values: Record<string, unknown>) {
  successMessage = `Form submitted successfully with: ${JSON.stringify(values)}`;
}
</script>

<div class="demo-form-wrapper">
    <h2>Form Example</h2>
    <Form {schema} {initialValues} onSubmit={handleSubmit}>
        <Input
            name="username"
            label="Username"
            required
            placeholder="Enter username"
        />
        <Input
            name="email"
            label="Email"
            type="email"
            required
            placeholder="Enter email"
        />
        <Input
            name="age"
            label="Age (Optional)"
            type="number"
            placeholder="Enter age"
        />
        <Input
            name="role"
            label="Role"
            disabled
            value="User"
        />
        <Textarea
            name="bio"
            label="Bio (Optional)"
            placeholder="Tell us about yourself"
            maxlength={200}
        />
        <Select
            name="category"
            label="Category"
            options={categoryOptions}
            placeholder="Choose a category..."
            required
        />
        <Checkbox
            name="agree"
            label="I agree to the terms and conditions"
            required
        />
        <Switch
            name="notifications"
            label="Enable notifications"
        />
        <RadioGroup
            name="color"
            label="Favorite Color"
            options={colorOptions}
            required
        />

        <div class="actions">
            <button type="submit" class="btn btn-filled">Submit</button>
            <button type="reset" class="btn btn-text">Reset</button>
        </div>
    </Form>

    {#if successMessage}
        <div class="success-message" role="alert">
            {successMessage}
        </div>
    {/if}

    <h2 class="section-title">Standalone Controls (No Form Wrapper)</h2>

    <div class="standalone-section">
        <h3>Input</h3>
        <Input
            name="standalone"
            label="Standalone Input"
            placeholder="This input works without a Form context"
            bind:value={standaloneValue}
        />
        {#if standaloneValue}
            <p class="standalone-value">Current value: {standaloneValue}</p>
        {/if}
    </div>

    <div class="standalone-section">
        <h3>Select</h3>
        <Select
            name="standalone-select"
            label="Standalone Select"
            options={categoryOptions}
            placeholder="Choose..."
            bind:value={standaloneSelectValue}
        />
        {#if standaloneSelectValue}
            <p class="standalone-value">Selected: {standaloneSelectValue}</p>
        {/if}
    </div>

    <div class="standalone-section">
        <h3>Checkbox</h3>
        <Checkbox
            name="standalone-checkbox"
            label="Standalone Checkbox"
            bind:checked={standaloneCheckbox}
        />
        <p class="standalone-value">Checked: {standaloneCheckbox}</p>
    </div>

    <div class="standalone-section">
        <h3>Switch</h3>
        <Switch
            name="standalone-switch"
            label="Standalone Switch"
            bind:checked={standaloneSwitch}
        />
        <p class="standalone-value">On: {standaloneSwitch}</p>
    </div>

    <div class="standalone-section">
        <h3>RadioGroup</h3>
        <RadioGroup
            name="standalone-radio"
            label="Standalone RadioGroup"
            options={colorOptions}
            bind:value={standaloneRadio}
        />
        {#if standaloneRadio}
            <p class="standalone-value">Selected: {standaloneRadio}</p>
        {/if}
    </div>

    <div class="standalone-section">
        <h3>RadioGroup (Horizontal)</h3>
        <RadioGroup
            name="standalone-radio-h"
            label="Horizontal Layout"
            options={colorOptions}
            orientation="horizontal"
        />
    </div>
</div>

<style>
    .demo-form-wrapper {
        max-width: 600px;
        margin: 0 auto;
    }

    h2 {
        margin-bottom: var(--kide-space-3);
        color: var(--kide-ink-primary);
    }

    h3 {
        margin-bottom: var(--kide-space-2);
        color: var(--kide-ink-primary);
        font-size: var(--kide-font-size-lg);
    }

    .section-title {
        margin-top: var(--kide-space-6);
    }

    .actions {
        display: flex;
        gap: var(--kide-space-2);
        margin-top: var(--kide-space-4);
    }

    .success-message {
        margin-top: var(--kide-space-2);
        padding: var(--kide-space-2);
        background: var(--kide-success-bg);
        color: var(--kide-success);
        border-radius: var(--kide-radius-md);
    }

    .standalone-section {
        padding: var(--kide-space-4);
        background: var(--kide-surface);
        border: 1px solid var(--kide-border-subtle);
        border-radius: var(--kide-radius-md);
        margin-bottom: var(--kide-space-3);
    }

    .standalone-value {
        margin-top: var(--kide-space-2);
        color: var(--kide-ink-muted);
        font-size: var(--kide-font-size-sm);
    }
</style>
