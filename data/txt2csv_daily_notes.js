const fs = require('fs');
const path = require('path');

// Đường dẫn file nguồn và file đích
const inputPath = path.join(__dirname, '8-9-2025.txt');
const outputPath = path.join(__dirname, 'daily_notes_sample.csv');

// Đọc file txt
const raw = fs.readFileSync(inputPath, 'utf8');
const json = JSON.parse(raw);
const records = json.result || [];

// Header CSV - phù hợp với Prisma model daily_notes
const header = [
  'message_id','channel_id','clan_id','create_time','update_time','block','today','yesterday','date','project_name','work_type','working_time','is_daily_late','sender_id','member'
];

// Hàm tạo map dữ liệu theo ngày và user để tìm yesterday
function createDataMap(records) {
  const dataMap = new Map();
  
  records.forEach(record => {
    if (!record.dateAt || !record.user) return;
    
    const date = formatDateOnly(record.dateAt);
    const user = record.user;
    const key = `${date}_${user}`;
    
    if (!dataMap.has(key)) {
      dataMap.set(key, {
        date: date,
        user: user,
        today: record.mytimesheetNote ? record.mytimesheetNote.replace(/\n/g, ' ').replace(/\r/g, ' ') : '',
        record: record
      });
    }
  });
  
  return dataMap;
}

// Hàm tìm yesterday value từ ngày hôm trước
function findYesterdayValue(currentDate, user, dataMap) {
  // currentDate is already in YYYY-MM-DD format
  const currentDateObj = new Date(currentDate + 'T00:00:00'); // Avoid timezone issues
  const yesterdayDateObj = new Date(currentDateObj);
  yesterdayDateObj.setDate(yesterdayDateObj.getDate() - 1);
  
  const year = yesterdayDateObj.getFullYear();
  const month = String(yesterdayDateObj.getMonth() + 1).padStart(2, '0');
  const day = String(yesterdayDateObj.getDate()).padStart(2, '0');
  const yesterdayDate = `${year}-${month}-${day}`;
  
  const yesterdayKey = `${yesterdayDate}_${user}`;
  
  const yesterdayData = dataMap.get(yesterdayKey);
  return yesterdayData ? yesterdayData.today : 'none';
}

// Hàm chuyển đổi dateAt thành định dạng datetime cho create_time và update_time
function formatDateTime(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toISOString(); // Format: YYYY-MM-DDTHH:mm:ss.sssZ
  } catch (e) {
    return '';
  }
}

// Hàm chuyển đổi dateAt thành định dạng date (YYYY-MM-DD) cho field date
// Xử lý timezone đúng cách để tránh lệch ngày
function formatDateOnly(dateStr) {
  if (!dateStr) return '';
  try {
    // Nếu dateStr có timezone, ta cần parse về đúng timezone gốc
    if (dateStr.includes('+') || dateStr.includes('Z')) {
      // Parse date với timezone
      const date = new Date(dateStr);
      
      // Với dữ liệu Vietnam (+07:00), ta muốn lấy ngày theo timezone đó
      // Thay vì convert về UTC, ta lấy ngày theo intended timezone
      if (dateStr.includes('+07:00')) {
        // Extract date parts from original string before timezone conversion
        const datePart = dateStr.split('T')[0]; // Get YYYY-MM-DD part
        return datePart;
      }
      
      // For other timezones, use the date's local representation
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    // Nếu không có timezone, trích xuất trực tiếp
    const dateMatch = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
    return dateMatch ? dateMatch[1] : '';
  } catch (e) {
    console.error('Error parsing date:', dateStr, e);
    return '';
  }
}

// Hàm tạo sender_id giả (có thể dùng user id hoặc random)
function generateSenderId(user) {
  // Tạo một sender_id dựa trên user name hoặc random
  return user ? `user_${user.replace(/\s+/g, '_').toLowerCase()}` : `user_${Math.floor(Math.random() * 10000)}`;
}

// Tạo data map để tìm yesterday values
const dataMap = createDataMap(records);

// Tạo dòng CSV cho từng record - phù hợp với Prisma model
const lines = records.map(r => {
  const currentDate = formatDateOnly(r.dateAt);
  const yesterdayValue = findYesterdayValue(currentDate, r.user, dataMap);
  
  return [
    r.id || `msg_${Math.floor(Math.random() * 1000000)}`, // message_id
    '1955820000266686464', // channel_id
    '3812', // clan_id
    formatDateTime(r.dateAt), // create_time - DateTime
    formatDateTime(r.dateAt), // update_time - DateTime
    'none', // block
    r.mytimesheetNote ? (r.mytimesheetNote.replace(/\n/g, ' ').replace(/\r/g, ' ')) : '', // today
    yesterdayValue, // yesterday - lấy từ ngày hôm trước
    currentDate, // date - Date only (YYYY-MM-DD)
    r.projectName || '', // project_name (không phải project_value)
    r.workType || '', // work_type
    r.workingTime || 0, // working_time - Float
    false, // is_daily_late - Boolean (không phải daily_late)
    generateSenderId(r.user), // sender_id - bắt buộc có
    r.user || '' // member
  ];
});

// Ghi file CSV
const csv = [header.join(','), ...lines.map(row => row.map(x => `"${String(x).replace(/"/g, '""')}"`).join(','))].join('\n');
fs.writeFileSync(outputPath, csv, 'utf8');

console.log('✅ Đã xuất xong file daily_notes_sample.csv với', records.length, 'bản ghi!');
