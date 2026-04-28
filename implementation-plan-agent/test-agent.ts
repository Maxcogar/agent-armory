import { generatePlanFlow } from './src/index';

async function test() {
  try {
    console.log('--- STARTING AGENT TEST ---');
    const result = await generatePlanFlow('Add authentication to the LeafLab dashboard.');
    console.log('--- PLAN GENERATED ---');
    console.log(JSON.stringify(result.plan, null, 2));
    console.log('--- AUDIT REPORT ---');
    console.log(JSON.stringify(result.audit, null, 2));
  } catch (err) {
    console.error('--- AGENT FAILED ---');
    console.error(err);
  }
}

test();
