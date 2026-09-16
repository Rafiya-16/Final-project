import 'dotenv/config';
import { runNightlyProjectCodeJob } from './nightly-project-code.job';
import prisma from '../config/database';

async function main() {
  await runNightlyProjectCodeJob();
}

main()
  .catch((error) => {
    console.error('Nightly project-code job failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
