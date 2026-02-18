-- Standard test users for E2E tests
-- Passwords are set programmatically by test-utils.ts via service role
-- IDs are fixed to ensure idempotency and consistent references if needed

-- 1. Admin User
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'admin@roolipeli.info',
    '$2a$10$abcdefghijklmnopqrstuvwxyz0123456789', -- Placeholder, overwritten by test-utils
    now(),
    NULL,
    now(),
    '{"provider": "email", "providers": ["email"], "role": "admin"}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

-- 2. Regular User
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'user@roolipeli.info',
    '$2a$10$abcdefghijklmnopqrstuvwxyz0123456789', -- Placeholder
    now(),
    NULL,
    now(),
    '{"provider": "email", "providers": ["email"]}', -- No role = regular user
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

-- Ensure identities exist for these users to allow sign-in
INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '{"sub": "00000000-0000-0000-0000-000000000001", "email": "admin@roolipeli.info"}',
    'email',
    'admin@roolipeli.info',
    now(),
    now(),
    now()
),
(
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    '{"sub": "00000000-0000-0000-0000-000000000002", "email": "user@roolipeli.info"}',
    'email',
    'user@roolipeli.info',
    now(),
    now(),
    now()
) ON CONFLICT (id) DO NOTHING;
