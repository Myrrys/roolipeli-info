export * from './queries';
export * from './schemas';
export type { Database, Json } from './types/supabase';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types/supabase';
export type DatabaseClient = SupabaseClient<Database>;
