<script lang="ts">
import Form from '@roolipeli/design-system/components/Form.svelte';
import Input from '@roolipeli/design-system/components/Input.svelte';

import { z } from 'zod';

const schema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  age: z.coerce.number().min(18, 'Must be at least 18').optional(),
});

const initialValues = {
  username: 'Ville',
  email: '',
};

let successMessage = $state('');

function handleSubmit(values: Record<string, unknown>) {
  console.log('Form submitted:', values);
  successMessage = `Form submitted successfully with: ${JSON.stringify(values)}`;
}
</script>

<div class="demo-form-wrapper">
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
</div>

<style>
    .actions {
        display: flex;
        gap: 1rem;
        margin-top: 2rem;
    }
    .success-message {
        margin-top: 1rem;
        padding: 1rem;
        background: var(--kide-surface-success, #dcfce7);
        color: var(--kide-text-success, #166534);
        border-radius: var(--kide-radius-md, 0.375rem);
    }
</style>
