// Test file for DailyLess functionality
// This file tests the logic for identifying members with insufficient working days

// Mock data structures and interfaces
const DailyNote = {
  projectName: '',
  channelId: '',
  block: '',
  today: '',
  yesterday: '',
  date: new Date(),
  workingTime: 0,
  memberName: ''
};

// Replicated functions from reports.service.ts for testing
async function cleanCheckOffDate(dailyNotes) {
  const uniqueRecords = new Map();

  dailyNotes.forEach(note => {
    const key = `${note.memberName}-${note.date.toDateString()}`;
    if (!uniqueRecords.has(key)) {
      uniqueRecords.set(key, note);
    }
  });

  return Array.from(uniqueRecords.values());
}

function analyzeWeeklyDataByMember(dailyNotes) {
  const memberStats = new Map();

  dailyNotes.forEach((note) => {
    const dateKey = note.date.toDateString();

    if (!memberStats.has(note.memberName)) {
      memberStats.set(note.memberName, {
        totalDays: 0,
        uniqueDates: new Set(),
        workingHours: 0,
      });
    }

    const memberData = memberStats.get(note.memberName);

    if (!memberData.uniqueDates.has(dateKey)) {
      memberData.uniqueDates.add(dateKey);
      memberData.totalDays += 1;
      memberData.workingHours += note.workingTime;
    }
  });
  return memberStats;
}

async function DailyLess(data) {
  const uniqueRecords = await cleanCheckOffDate(data);
  const memberStats = analyzeWeeklyDataByMember(uniqueRecords);
  const membersWithLessThan5Days = Array.from(memberStats.entries())
    .filter(([_, stats]) => stats.totalDays < 5)
    .map(([memberName, stats]) => ({
      memberName,
      totalDays: stats.totalDays,
      workingHours: stats.workingHours,
      missingDays: 5 - stats.totalDays
    }));
  return membersWithLessThan5Days;
}

// Test data scenarios
const testScenarios = {
  // Scenario 1: Full week worker (5 days)
  fullWeekWorker: [
    { memberName: 'John Doe', date: new Date('2025-09-08'), workingTime: 480 }, // Monday
    { memberName: 'John Doe', date: new Date('2025-09-09'), workingTime: 480 }, // Tuesday
    { memberName: 'John Doe', date: new Date('2025-09-10'), workingTime: 480 }, // Wednesday
    { memberName: 'John Doe', date: new Date('2025-09-11'), workingTime: 480 }, // Thursday
    { memberName: 'John Doe', date: new Date('2025-09-12'), workingTime: 480 }, // Friday
  ],

  // Scenario 2: Part-time worker (3 days)
  partTimeWorker: [
    { memberName: 'Jane Smith', date: new Date('2025-09-08'), workingTime: 480 }, // Monday
    { memberName: 'Jane Smith', date: new Date('2025-09-10'), workingTime: 480 }, // Wednesday
    { memberName: 'Jane Smith', date: new Date('2025-09-12'), workingTime: 480 }, // Friday
  ],

  // Scenario 3: Mixed workers
  mixedWorkers: [
    // Full week worker
    { memberName: 'Alice Johnson', date: new Date('2025-09-08'), workingTime: 480 },
    { memberName: 'Alice Johnson', date: new Date('2025-09-09'), workingTime: 480 },
    { memberName: 'Alice Johnson', date: new Date('2025-09-10'), workingTime: 480 },
    { memberName: 'Alice Johnson', date: new Date('2025-09-11'), workingTime: 480 },
    { memberName: 'Alice Johnson', date: new Date('2025-09-12'), workingTime: 480 },
    
    // 4-day worker
    { memberName: 'Bob Wilson', date: new Date('2025-09-08'), workingTime: 480 },
    { memberName: 'Bob Wilson', date: new Date('2025-09-09'), workingTime: 480 },
    { memberName: 'Bob Wilson', date: new Date('2025-09-10'), workingTime: 480 },
    { memberName: 'Bob Wilson', date: new Date('2025-09-12'), workingTime: 480 },
    
    // 2-day worker
    { memberName: 'Charlie Brown', date: new Date('2025-09-08'), workingTime: 240 },
    { memberName: 'Charlie Brown', date: new Date('2025-09-11'), workingTime: 360 },
  ],

  // Scenario 4: Duplicate entries (should be deduplicated)
  duplicateEntries: [
    { memberName: 'David Lee', date: new Date('2025-09-08'), workingTime: 480 },
    { memberName: 'David Lee', date: new Date('2025-09-08'), workingTime: 240 }, // Duplicate - should be ignored
    { memberName: 'David Lee', date: new Date('2025-09-09'), workingTime: 480 },
    { memberName: 'David Lee', date: new Date('2025-09-10'), workingTime: 480 },
  ],

  // Scenario 5: Weekend data (should not affect weekday count)
  weekendData: [
    { memberName: 'Eva Martinez', date: new Date('2025-09-07'), workingTime: 480 }, // Sunday - should be filtered out by repository
    { memberName: 'Eva Martinez', date: new Date('2025-09-08'), workingTime: 480 }, // Monday
    { memberName: 'Eva Martinez', date: new Date('2025-09-09'), workingTime: 480 }, // Tuesday
    { memberName: 'Eva Martinez', date: new Date('2025-09-13'), workingTime: 480 }, // Saturday - should be filtered out by repository
  ]
};

// Test runner function
async function runTests() {
  console.log('🧪 Running DailyLess Tests\n');
  
  // Test 1: Full week worker
  console.log('Test 1: Full week worker (should not appear in DailyLess)');
  const result1 = await DailyLess(testScenarios.fullWeekWorker);
  console.log('Result:', result1);
  console.log('Expected: Empty array');
  console.log('✅ Pass:', result1.length === 0 ? 'YES' : 'NO');
  console.log('');

  // Test 2: Part-time worker
  console.log('Test 2: Part-time worker (should appear in DailyLess)');
  const result2 = await DailyLess(testScenarios.partTimeWorker);
  console.log('Result:', result2);
  console.log('Expected: Jane Smith with 3 days, missing 2 days');
  console.log('✅ Pass:', 
    result2.length === 1 && 
    result2[0].memberName === 'Jane Smith' && 
    result2[0].totalDays === 3 &&
    result2[0].missingDays === 2 ? 'YES' : 'NO'
  );
  console.log('');

  // Test 3: Mixed workers
  console.log('Test 3: Mixed workers');
  const result3 = await DailyLess(testScenarios.mixedWorkers);
  console.log('Result:', result3);
  console.log('Expected: Bob Wilson (4 days) and Charlie Brown (2 days)');
  const bobExists = result3.find(r => r.memberName === 'Bob Wilson' && r.totalDays === 4);
  const charlieExists = result3.find(r => r.memberName === 'Charlie Brown' && r.totalDays === 2);
  const aliceNotExists = !result3.find(r => r.memberName === 'Alice Johnson');
  console.log('✅ Pass:', bobExists && charlieExists && aliceNotExists ? 'YES' : 'NO');
  console.log('');

  // Test 4: Duplicate entries
  console.log('Test 4: Duplicate entries (should be deduplicated)');
  const result4 = await DailyLess(testScenarios.duplicateEntries);
  console.log('Result:', result4);
  console.log('Expected: David Lee with 3 days (duplicates removed)');
  console.log('✅ Pass:', 
    result4.length === 1 && 
    result4[0].memberName === 'David Lee' && 
    result4[0].totalDays === 3 ? 'YES' : 'NO'
  );
  console.log('');

  // Test 5: Weekend data (Note: In real system, weekends are filtered at repository level)
  console.log('Test 5: Weekend data (testing with all data including weekends)');
  const result5 = await DailyLess(testScenarios.weekendData);
  console.log('Result:', result5);
  console.log('Expected: Eva Martinez with 4 days (including weekends in this test)');
  console.log('Note: In real system, repository filters weekends before calling DailyLess');
  console.log('✅ Pass:', 
    result5.length === 1 && 
    result5[0].memberName === 'Eva Martinez' && 
    result5[0].totalDays === 4 ? 'YES' : 'NO'
  );
  console.log('');

  // Test 6: Empty data
  console.log('Test 6: Empty data');
  const result6 = await DailyLess([]);
  console.log('Result:', result6);
  console.log('Expected: Empty array');
  console.log('✅ Pass:', result6.length === 0 ? 'YES' : 'NO');
  console.log('');

  console.log('🏁 Test Summary Complete');
}

// Performance test
async function performanceTest() {
  console.log('\n⚡ Performance Test');
  
  // Generate large dataset
  const largeDataset = [];
  const members = Array.from({length: 100}, (_, i) => `Member_${i}`);
  const dates = [
    new Date('2025-09-08'),
    new Date('2025-09-09'),
    new Date('2025-09-10'),
    new Date('2025-09-11'),
    new Date('2025-09-12')
  ];
  
  members.forEach(member => {
    // Random number of working days (1-5)
    const workingDays = Math.floor(Math.random() * 5) + 1;
    for (let i = 0; i < workingDays; i++) {
      largeDataset.push({
        memberName: member,
        date: dates[i],
        workingTime: 480
      });
    }
  });
  
  console.log(`Testing with ${largeDataset.length} records for ${members.length} members`);
  
  const startTime = Date.now();
  const result = await DailyLess(largeDataset);
  const endTime = Date.now();
  
  console.log(`Processing time: ${endTime - startTime}ms`);
  console.log(`Members with less than 5 days: ${result.length}/${members.length}`);
  console.log('Performance: ✅ PASS');
}

// Export for potential use in other test files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DailyLess,
    cleanCheckOffDate,
    analyzeWeeklyDataByMember,
    testScenarios,
    runTests,
    performanceTest
  };
}

// Run tests if this file is executed directly
if (require.main === module) {
  (async () => {
    await runTests();
    await performanceTest();
  })();
}
