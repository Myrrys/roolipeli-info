<script lang="ts">
import Form from '@roolipeli/design-system/components/Form.svelte';
import Input from '@roolipeli/design-system/components/Input.svelte';
import Textarea from '@roolipeli/design-system/components/Textarea.svelte';

import { z } from 'zod';

const schema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  age: z.coerce.number().min(18, 'Must be at least 18').optional(),
  bio: z.string().max(200, 'Bio must be 200 characters or less').optional(),
});

const initialValues = {
  username: 'Ville',
  email: '',
  role: 'User',
};

let successMessage = $state('');
const standaloneValue = $state('');

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

    <h2 class="section-title">Standalone Input (No Form Wrapper)</h2>
    <div class="standalone-section">
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
    }

    .standalone-value {
        margin-top: var(--kide-space-2);
        color: var(--kide-ink-muted);
        font-size: var(--kide-font-size-sm);
    }
</style>
