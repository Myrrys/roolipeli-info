<script lang="ts">
import Checkbox from '@roolipeli/design-system/components/Checkbox.svelte';
import Combobox from '@roolipeli/design-system/components/Combobox.svelte';
import FileUpload from '@roolipeli/design-system/components/FileUpload.svelte';
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
  publisher_id: z.string().min(1, 'Please select a publisher'),
  agree: z.literal(true, { errorMap: () => ({ message: 'You must agree to the terms' }) }),
  color: z.string().min(1, 'Please select a color'),
});

const initialValues = {
  username: 'Ville',
  email: '',
  role: 'User',
  category: '',
  publisher_id: '',
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

const publisherOptions = [
  { value: 'p1', label: 'Artic Union' },
  { value: 'p2', label: 'Burger Games' },
  { value: 'p3', label: 'Celluloidi Oy' },
  { value: 'p4', label: 'Dudeson Oy' },
  { value: 'p5', label: 'Eeppinen Kertomus Oy' },
  { value: 'p6', label: 'Fantasia Kustannus' },
  { value: 'p7', label: 'Gradientia Oy' },
  { value: 'p8', label: 'Huonosti Pelattu Oy' },
  { value: 'p9', label: 'Ironspine Entertainment' },
  { value: 'p10', label: 'Jallu Games' },
  { value: 'p11', label: 'Kaiku Games' },
  { value: 'p12', label: 'Langasta Kustannus' },
  { value: 'p13', label: 'Mekanismi Oy' },
  { value: 'p14', label: 'Nopat & Hahmolomakkeet' },
  { value: 'p15', label: 'Odysseia-lehti' },
  { value: 'p16', label: 'Parnasso Oy' },
  { value: 'p17', label: 'Quentin Games' },
  { value: 'p18', label: 'Ropecon ry' },
  { value: 'p19', label: 'Salama Publishing' },
  { value: 'p20', label: 'Tuonela Productions' },
  { value: 'p21', label: 'Ultima Ratio Oy' },
  { value: 'p22', label: 'Vallaton Pelit' },
  { value: 'p23', label: 'Waasa Graphics' },
  { value: 'p24', label: 'Xenofobia Games' },
  { value: 'p25', label: 'Yhdistyneet Pelaajat' },
  { value: 'p26', label: 'Zidane Publishing' },
  { value: 'p27', label: 'Arvoituksen Pelaajat' },
  { value: 'p28', label: 'Boreas Games' },
  { value: 'p29', label: 'Crimson Dawn Studios' },
  { value: 'p30', label: 'Draken Kustannus' },
  { value: 'p31', label: 'Elämyspelit Oy' },
  { value: 'p32', label: 'Fimbulvetr Games' },
  { value: 'p33', label: 'Gjallarhorn Publishing' },
  { value: 'p34', label: 'Hiidenkivi Games' },
  { value: 'p35', label: 'Imatra Creations' },
  { value: 'p36', label: 'Joukahainen Studios' },
  { value: 'p37', label: 'Kalevala Games' },
  { value: 'p38', label: 'Lohikäärme Pelit' },
  { value: 'p39', label: 'Mytologia Publishing' },
  { value: 'p40', label: 'Näkijä Games' },
  { value: 'p41', label: 'Otava Pelituotanto' },
  { value: 'p42', label: 'Pohjola Interactive' },
  { value: 'p43', label: 'Quest Finland Oy' },
  { value: 'p44', label: 'Rannikkoseikkailu' },
  { value: 'p45', label: 'Seitsemän Veljestä Games' },
  { value: 'p46', label: 'Taiga Entertainment' },
  { value: 'p47', label: 'Ukonvasara Productions' },
  { value: 'p48', label: 'Valkyyria Publishing' },
  { value: 'p49', label: 'Werner & Smith Oy' },
  { value: 'p50', label: 'X-Pelit Finland' },
  { value: 'p51', label: 'Yliopisto Pelit' },
  { value: 'p52', label: 'Zaibatsu Games Finland' },
  { value: 'p53', label: 'Ässä-Pelit Oy' },
  { value: 'p54', label: 'Öinen Seikkailu Games' },
  { value: 'p55', label: 'Aalto Games Studio' },
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
// biome-ignore lint/style/useConst: Svelte bind:value requires let with $state
let standaloneCombobox = $state('');
// biome-ignore lint/style/useConst: Svelte bind:value requires let with $state
let selectedFileName = $state('');

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
        <Combobox
            name="publisher_id"
            label="Publisher"
            options={publisherOptions}
            placeholder="Search publishers..."
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
        <FileUpload
            name="cover"
            label="Cover Image"
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

    <div class="standalone-section">
        <h3>Combobox</h3>
        <Combobox
            name="standalone-combobox"
            label="Standalone Combobox"
            options={publisherOptions}
            placeholder="Search publishers..."
            bind:value={standaloneCombobox}
        />
        {#if standaloneCombobox}
            <p class="standalone-value">Selected: {standaloneCombobox}</p>
        {/if}
    </div>

    <div class="standalone-section">
        <h3>FileUpload</h3>
        <FileUpload
            name="standalone-file"
            label="Standalone File Upload"
            onSelect={(file) => { selectedFileName = file.name; }}
            onRemove={() => { selectedFileName = ''; }}
        />
        {#if selectedFileName}
            <p class="standalone-value">Selected: {selectedFileName}</p>
        {/if}
    </div>

    <div class="standalone-section">
        <h3>FileUpload (with existing value)</h3>
        <FileUpload
            name="existing-file"
            label="File Upload with Existing Image"
            value="https://placehold.co/300x200/e2e8f0/64748b?text=Cover+Image"
        />
    </div>

    <div class="standalone-section">
        <h3>FileUpload (loading state)</h3>
        <FileUpload
            name="loading-file"
            label="File Upload (Loading)"
            loading={true}
            value="https://placehold.co/300x200/e2e8f0/64748b?text=Uploading..."
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
