import process from 'node:process';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function setAdmin(email: string) {
  console.log(`Looking up user: ${email}`);

  // List users to find ID by email
  const {
    data: { users },
    error: listError,
  } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('Error listing users:', listError.message);
    process.exit(1);
  }

  const user = users.find((u) => u.email === email);

  if (!user) {
    console.error(`User not found: ${email}`);
    console.log('Available users:', users.map((u) => u.email).join(', '));
    process.exit(1);
  }

  console.log(`Found user ${user.id}. Setting role to 'admin'...`);

  const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, role: 'admin' },
  });

  if (updateError) {
    console.error('Error updating user:', updateError.message);
    process.exit(1);
  }

  console.log(`✓ User ${email} is now an admin.`);
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: tsx scripts/set-admin.ts <email>');
  process.exit(1);
}

setAdmin(email);
