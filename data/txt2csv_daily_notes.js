const fs = require('fs');
const path = require('path');

// Đường dẫn file nguồn và file đích
const inputPath = path.join(__dirname, '1757472191435.txt');
const outputPath = path.join(__dirname, 'daily_notes_sample.csv');

// Đọc file txt
const raw = fs.readFileSync(inputPath, 'utf8');
const json = JSON.parse(raw);
const records = json.result || [];

// Header CSV - phù hợp với Prisma model daily_notes
const header = [
  'message_id','channel_id','clan_id','create_time','update_time','block','today','yesterday','date','project_name','work_type','working_time','is_daily_late','sender_id','member'
];

// Hàm random chuỗi cho yesterday
function randomYesterday() {
  const samples = [
    'Hoàn thành task hôm qua',
    'Fix bug',
    'Code tính năng mới',
    'Review code',
    'Họp team',
    'Nghiên cứu tài liệu',
    'Viết test',
    'Tối ưu hiệu năng',
    'Hỗ trợ thành viên',
    'Không có'
  ];
  return samples[Math.floor(Math.random() * samples.length)];
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
function formatDateOnly(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0]; // Chỉ lấy phần YYYY-MM-DD
  } catch (e) {
    return '';
  }
}

// Hàm tạo sender_id giả (có thể dùng user id hoặc random)
function generateSenderId(user) {
  // Tạo một sender_id dựa trên user name hoặc random
  return user ? `user_${user.replace(/\s+/g, '_').toLowerCase()}` : `user_${Math.floor(Math.random() * 10000)}`;
}

// Tạo dòng CSV cho từng record - phù hợp với Prisma model
const lines = records.map(r => [
  r.id || `msg_${Math.floor(Math.random() * 1000000)}`, // message_id
  '1955820000266686464', // channel_id
  '3812', // clan_id
  formatDateTime(r.dateAt), // create_time - DateTime
  formatDateTime(r.dateAt), // update_time - DateTime
  'none', // block
  r.mytimesheetNote ? (r.mytimesheetNote.replace(/\n/g, ' ').replace(/\r/g, ' ')) : '', // today
  randomYesterday(), // yesterday
  formatDateOnly(r.dateAt), // date - Date only (YYYY-MM-DD)
  r.projectName || '', // project_name (không phải project_value)
  r.workType || '', // work_type
  r.workingTime || 0, // working_time - Float
  false, // is_daily_late - Boolean (không phải daily_late)
  generateSenderId(r.user), // sender_id - bắt buộc có
  r.user || '' // member
]);

// Ghi file CSV
const csv = [header.join(','), ...lines.map(row => row.map(x => `"${String(x).replace(/"/g, '""')}"`).join(','))].join('\n');
fs.writeFileSync(outputPath, csv, 'utf8');

console.log('✅ Đã xuất xong file daily_notes_sample.csv với', records.length, 'bản ghi!');
