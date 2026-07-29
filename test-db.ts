import { storage } from './server/storage.js';

async function test() {
  const periods = await storage.getPeriods();
  console.log("Periods from DB:", periods);

  const activePeriod = await storage.getActivePeriodNow();
  console.log("Currently Active Period:", activePeriod);

  process.exit(0);
}

test().catch(console.error);
