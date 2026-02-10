import process from 'node:process';
import readline from 'node:readline';
import dotenv from 'dotenv';
import postgres from 'postgres';

dotenv.config();

const PROD_DB_URL = process.env.PROD_SUPABASE_DB_URL?.trim();
const DEV_DB_URL = process.env.DEV_SUPABASE_DB_URL?.trim();

if (!PROD_DB_URL || !DEV_DB_URL) {
  console.error('Error: PROD_SUPABASE_DB_URL and DEV_SUPABASE_DB_URL must be set in .env');
  process.exit(1);
}

if (PROD_DB_URL === DEV_DB_URL) {
  console.error(
    'Error: PROD_SUPABASE_DB_URL and DEV_SUPABASE_DB_URL must be different (safety check)',
  );
  process.exit(1);
}

/**
 * Tables to sync in dependency order (parents first).
 * Truncation happens in reverse order (children first) via CASCADE.
 */
const TABLES = [
  'publishers',
  'creators',
  'semantic_labels',
  'products',
  'products_creators',
  'product_references',
  'product_semantic_labels',
  'product_isbns',
  'profiles',
] as const;

const skipConfirmation = process.argv.includes('--yes');

/** Prompt user for interactive confirmation. */
async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (y/N) `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

async function main() {
  if (!skipConfirmation) {
    const confirmed = await confirm(
      'This will TRUNCATE all public content tables in the dev database and replace them with prod data. Continue?',
    );
    if (!confirmed) {
      console.log('Aborted.');
      process.exit(0);
    }
  }

  const prodDb = postgres(PROD_DB_URL, { max: 1 });
  const devDb = postgres(DEV_DB_URL, { max: 1 });

  try {
    console.log('Connecting to prod (read-only)...');
    await prodDb`SELECT 1`;

    console.log('Connecting to dev...');
    await devDb`SELECT 1`;

    // Export all data from prod
    const data: Record<string, postgres.Row[]> = {};
    for (const table of TABLES) {
      const rows = await prodDb`SELECT * FROM ${prodDb(table)}`;
      data[table] = rows;
      console.log(`  Exported ${rows.length} rows from prod.${table}`);
    }

    // Import into dev within a single transaction
    console.log('\nImporting into dev (single transaction)...');
    await devDb.begin(async (tx) => {
      // Truncate in reverse order (children first), CASCADE handles FKs
      for (const table of [...TABLES].reverse()) {
        await tx`TRUNCATE ${tx(table)} CASCADE`;
      }

      // Insert in dependency order (parents first)
      for (const table of TABLES) {
        const rows = data[table];
        if (rows.length === 0) {
          console.log(`  Skipped ${table} (0 rows)`);
          continue;
        }

        const columns = Object.keys(rows[0]);
        const values = rows.map((row) => columns.map((col) => row[col]));

        // Build and execute bulk insert
        await tx`
					INSERT INTO ${tx(table)} ${tx(columns)}
					VALUES ${tx(values)}
				`;
        console.log(`  Inserted ${rows.length} rows into dev.${table}`);
      }
    });

    console.log('\nSync complete.');
  } catch (error) {
    console.error('Sync failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await prodDb.end();
    await devDb.end();
  }
}

main();
