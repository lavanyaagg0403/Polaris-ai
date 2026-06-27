import { initDb, query } from '../src/database/db.js';
import { processAgentRequest } from '../src/services/llmService.js';

const runVerification = async () => {
  console.log('=============================================');
  console.log('🧪 Starting Polaris AI Integration Verification...');
  console.log('=============================================\n');

  try {
    // 1. Initialize and Seed DB
    await initDb();
    console.log('✅ SQLite Database setup and seeded.');

    // 2. Mock Flagship Query
    const flagshipPrompt = "I have my Microsoft interview on Friday, my DSA assignment tomorrow, and I'm feeling overwhelmed.";
    console.log(`\n💬 Testing Flagship User Prompt: "${flagshipPrompt}"`);
    console.log('⏳ Processing multi-agent routing... (Planner + Career + Study + Productivity)');
    
    const response = await processAgentRequest(flagshipPrompt);

    // 3. Verify Response Payload structure
    console.log('\n📊 Validating response fields:');
    if (!response.plannerReasoning) throw new Error('Missing "plannerReasoning" field in response.');
    console.log('   ✓ plannerReasoning present.');
    
    if (!Array.isArray(response.agentLogs) || response.agentLogs.length === 0) {
      throw new Error('Missing or empty "agentLogs" array.');
    }
    console.log(`   ✓ agentLogs present (${response.agentLogs.length} logs).`);
    response.agentLogs.forEach((log, i) => {
      console.log(`     - Agent [${log.agent}]: ${log.action}`);
    });

    if (!response.finalResponse) throw new Error('Missing "finalResponse" markdown payload.');
    console.log('   ✓ finalResponse present.');

    // 4. Verify DB side-effects (automatic task scheduling by Productivity/Study/Career agents)
    console.log('\n🗄️ Querying SQLite Database for agent task creation:');
    const tasks = await query("SELECT * FROM tasks WHERE title LIKE '%Microsoft%' OR title LIKE '%BFS%' OR title LIKE '%breathing%'");
    
    console.log(`   Found ${tasks.length} auto-scheduled tasks in checklist:`);
    tasks.forEach(t => {
      console.log(`   [${t.status}] [Priority: ${t.priority}] ${t.title} (Category: ${t.category}, Due: ${t.due_date})`);
    });

    if (tasks.length < 3) {
      throw new Error(`Expected at least 3 auto-scheduled tasks, but found ${tasks.length}`);
    }
    console.log('\n🎉 Verification completed successfully! All agent outputs, schemas, and database modifications passed.');
    console.log('=============================================');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Verification Failed:', error.message);
    console.log('=============================================');
    process.exit(1);
  }
};

runVerification();
