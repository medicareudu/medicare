import { execSync } from 'child_process';

async function globalSetup() {
  console.log('Running global setup: Resetting and seeding the database...');
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      execSync('npx dotenv-cli -e backend/.env.test -- npm run db:reset --prefix backend', { stdio: 'inherit' });
      console.log('Database seeded successfully.');
      return;
    } catch (error) {
      console.warn(`Database reset attempt ${attempt} failed.`);
      if (attempt === maxRetries) {
        console.error('All database reset attempts failed:', error);
        throw error;
      }
      console.log('Waiting 5 seconds before retrying...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

export default globalSetup;
