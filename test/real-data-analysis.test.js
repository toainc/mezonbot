// Test file using real CSV data to check member working days
const fs = require('fs');
const path = require('path');

// Function to parse CSV data
function parseCSV(csvContent) {
  const lines = csvContent.split('\n');
  const header = lines[0].split(',').map(h => h.replace(/"/g, ''));
  const records = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse CSV line with quoted fields
    const matches = line.match(/"([^"]*)"/g);
    if (!matches || matches.length < header.length) continue;
    
    const values = matches.map(m => m.slice(1, -1)); // Remove quotes
    const record = {};
    
    header.forEach((key, index) => {
      record[key] = values[index] || '';
    });
    
    records.push(record);
  }
  
  return records;
}

// Function to convert CSV data to DailyNote format
function convertToDateNotes(csvRecords) {
  return csvRecords.map(record => ({
    memberName: record.member || '',
    date: new Date(record.date),
    workingTime: parseFloat(record.working_time) || 0,
    projectName: record.project_name || '',
    channelId: record.channel_id || '',
    block: record.block || '',
    today: record.today || '',
    yesterday: record.yesterday || ''
  })).filter(note => 
    // Filter out invalid dates and members
    note.memberName && 
    !isNaN(note.date.getTime()) &&
    note.workingTime > 0
  );
}

// Function to filter weekdays only (Monday = 1 to Friday = 5)
function filterWeekdays(dailyNotes) {
  return dailyNotes.filter(note => {
    const dayOfWeek = note.date.getDay();
    return dayOfWeek >= 1 && dayOfWeek <= 5;
  });
}

// Function to count working days by member
function countWorkingDaysByMember(dailyNotes) {
  const memberStats = new Map();

  dailyNotes.forEach((note) => {
    const dateKey = note.date.toDateString();

    if (!memberStats.has(note.memberName)) {
      memberStats.set(note.memberName, {
        totalDays: 0,
        uniqueDates: new Set(),
        workingHours: 0,
        dates: []
      });
    }

    const memberData = memberStats.get(note.memberName);

    if (!memberData.uniqueDates.has(dateKey)) {
      memberData.uniqueDates.add(dateKey);
      memberData.totalDays += 1;
      memberData.workingHours += note.workingTime;
      memberData.dates.push(note.date.toISOString().split('T')[0]);
    }
  });

  return memberStats;
}

// Function to get members with less than 5 working days
function getMembersWithLessThan5Days(memberStats) {
  const result = [];
  
  memberStats.forEach((stats, memberName) => {
    if (stats.totalDays < 5) {
      result.push({
        memberName,
        totalDays: stats.totalDays,
        workingHours: stats.workingHours,
        missingDays: 5 - stats.totalDays,
        dates: stats.dates.sort()
      });
    }
  });
  
  return result.sort((a, b) => a.totalDays - b.totalDays);
}

// Main test function
function testRealData() {
  console.log('📊 Testing with Real CSV Data\n');
  
  // Read CSV file
  const csvPath = path.join(__dirname, '..', 'data', 'daily_notes_sample.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error('❌ CSV file not found at:', csvPath);
    return;
  }
  
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  console.log('✅ CSV file loaded successfully');
  
  // Parse CSV
  const csvRecords = parseCSV(csvContent);
  console.log(`📋 Total CSV records: ${csvRecords.length}`);
  
  // Convert to DailyNote format
  const dailyNotes = convertToDateNotes(csvRecords);
  console.log(`📝 Valid daily notes: ${dailyNotes.length}`);
  
  // Filter weekdays only
  const weekdayNotes = filterWeekdays(dailyNotes);
  console.log(`📅 Weekday notes only: ${weekdayNotes.length}`);
  
  // Get date range
  const dates = weekdayNotes.map(note => note.date).sort();
  const startDate = dates[0].toISOString().split('T')[0];
  const endDate = dates[dates.length - 1].toISOString().split('T')[0];
  console.log(`📆 Date range: ${startDate} to ${endDate}`);
  
  // Count working days by member
  const memberStats = countWorkingDaysByMember(weekdayNotes);
  console.log(`👥 Total unique members: ${memberStats.size}\n`);
  
  // Show all members and their working days
  console.log('📋 All Members Working Days:');
  console.log('='.repeat(80));
  
  const allMembers = Array.from(memberStats.entries()).sort((a, b) => b[1].totalDays - a[1].totalDays);
  
  allMembers.forEach(([memberName, stats]) => {
    const status = stats.totalDays >= 5 ? '✅' : '⚠️';
    console.log(`${status} ${memberName}:`);
    console.log(`   Days: ${stats.totalDays}/5 | Hours: ${stats.workingHours} minutes`);
    console.log(`   Dates: [${stats.dates.join(', ')}]`);
    if (stats.totalDays < 5) {
      console.log(`   Missing: ${5 - stats.totalDays} day(s)`);
    }
    console.log('');
  });
  
  // Get members with less than 5 days (for DailyLess)
  const membersWithLessThan5Days = getMembersWithLessThan5Days(memberStats);
  
  console.log('⚠️  Members with Less Than 5 Working Days (DailyLess):');
  console.log('='.repeat(60));
  
  if (membersWithLessThan5Days.length === 0) {
    console.log('🎉 All members have worked 5 full days!');
  } else {
    membersWithLessThan5Days.forEach(member => {
      console.log(`👤 ${member.memberName}:`);
      console.log(`   Working days: ${member.totalDays}/5`);
      console.log(`   Missing days: ${member.missingDays}`);
      console.log(`   Total hours: ${member.workingHours} minutes`);
      console.log(`   Worked on: [${member.dates.join(', ')}]`);
      console.log('');
    });
  }
  
  // Summary statistics
  console.log('📊 Summary Statistics:');
  console.log('='.repeat(40));
  console.log(`Total members: ${memberStats.size}`);
  console.log(`Members with full week (5 days): ${allMembers.filter(([_, stats]) => stats.totalDays >= 5).length}`);
  console.log(`Members with partial week (<5 days): ${membersWithLessThan5Days.length}`);
  
  const avgWorkingDays = allMembers.reduce((sum, [_, stats]) => sum + stats.totalDays, 0) / allMembers.length;
  console.log(`Average working days per member: ${avgWorkingDays.toFixed(2)}`);
  
  return {
    totalMembers: memberStats.size,
    fullWeekMembers: allMembers.filter(([_, stats]) => stats.totalDays >= 5).length,
    partialWeekMembers: membersWithLessThan5Days.length,
    membersWithLessThan5Days,
    allMemberStats: Object.fromEntries(memberStats)
  };
}

// Test specific member
function testSpecificMember(memberName) {
  console.log(`\n🔍 Testing Specific Member: ${memberName}`);
  console.log('='.repeat(50));
  
  const csvPath = path.join(__dirname, '..', 'data', 'daily_notes_sample.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const csvRecords = parseCSV(csvContent);
  const dailyNotes = convertToDateNotes(csvRecords);
  const weekdayNotes = filterWeekdays(dailyNotes);
  
  const memberNotes = weekdayNotes.filter(note => note.memberName === memberName);
  
  if (memberNotes.length === 0) {
    console.log(`❌ No data found for member: ${memberName}`);
    return;
  }
  
  const memberStats = countWorkingDaysByMember(memberNotes);
  const stats = memberStats.get(memberName);
  
  console.log(`👤 Member: ${memberName}`);
  console.log(`📅 Working days: ${stats.totalDays}`);
  console.log(`⏰ Total hours: ${stats.workingHours} minutes`);
  console.log(`📆 Dates worked: [${stats.dates.sort().join(', ')}]`);
  
  if (stats.totalDays < 5) {
    console.log(`⚠️  Missing ${5 - stats.totalDays} day(s) for full week`);
  } else {
    console.log(`✅ Full working week completed`);
  }
  
  return stats;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testRealData,
    testSpecificMember,
    parseCSV,
    convertToDateNotes,
    filterWeekdays,
    countWorkingDaysByMember,
    getMembersWithLessThan5Days
  };
}

// Run tests if this file is executed directly
if (require.main === module) {
  const result = testRealData();
  
  // Test some specific members
  console.log('\n' + '='.repeat(80));
  testSpecificMember('Quang Võ Nhật');
  testSpecificMember('Hiếu Trần Trung'); 
  testSpecificMember('Hiếu Đỗ Hoàng');
}
