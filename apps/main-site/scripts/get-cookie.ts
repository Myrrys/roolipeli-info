import { createAdminSession } from '../tests/e2e/test-utils';

async function main() {
  try {
    const cookies = await createAdminSession('vitkukissa@gmail.com');
    console.log(JSON.stringify(cookies));
  } catch (error) {
    console.error('Failed to get cookies:', error);
    process.exit(1);
  }
}

main();
