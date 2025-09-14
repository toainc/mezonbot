# 🤖 MezonBot - AI-Powered Project Management Bot

MezonBot là một hệ thống bot thông minh được tích hợp với AI để phân tích báo cáo hàng ngày và tạo ra các báo cáo tuần tự động cho các dự án IT. Bot sử dụng NestJS framework và tích hợp với Mezon platform để cung cấp các tính năng quản lý dự án thông minh.

## 🌟 Tính năng chính

- **📊 Báo cáo tuần tự động**: Phân tích dữ liệu daily notes và tạo báo cáo tuần chi tiết
- **🤖 AI Integration**: Sử dụng LM Studio để xử lý ngôn ngữ tự nhiên
- **💬 Mezon Bot Integration**: Tích hợp seamless với Mezon platform
- **📈 Theo dõi tiến độ**: Phân tích và theo dõi tiến độ dự án realtime
- **👥 Quản lý nhân sự**: Theo dõi hoạt động và đóng góp của từng thành viên
- **🔍 Phân tích kỹ thuật**: Đánh giá giải pháp kỹ thuật và testing

## 🛠️ Công nghệ sử dụng

- **Backend**: NestJS (Node.js framework)
- **Database**: MySQL với Prisma ORM
- **AI**: LM Studio (Local AI server)
- **Platform**: Mezon SDK
- **Language**: TypeScript
- **Testing**: Jest

## 📋 Yêu cầu hệ thống

### Phần mềm cần cài đặt:

- **Node.js**: >= 18.0.0
- **npm** hoặc **yarn**: Latest version
- **MySQL**: >= 8.0
- **LM Studio**: Latest version (để chạy AI local)

### Phần cứng khuyến nghị:

- **RAM**: >= 8GB (16GB khuyến nghị cho AI processing)
- **Storage**: >= 10GB free space
- **CPU**: Multi-core processor (Intel i5/AMD Ryzen 5 hoặc cao hơn)
- **GPU**: Optional nhưng khuyến nghị cho AI processing

## 🚀 Hướng dẫn cài đặt

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/mezonbot.git
cd mezonbot
```

### 2. Cài đặt Dependencies

```bash
# Sử dụng npm
npm install

# Hoặc sử dụng yarn
yarn install
```

### 3. Thiết lập Database

#### 3.1 Tạo MySQL Database
```sql
CREATE DATABASE teta;
```

#### 3.2 Cấu hình Database Connection
Tạo file `.env` trong thư mục root:

```env
# Database Configuration
DATABASE_URL="mysql://username:password@localhost:3306/teta"

# Mezon Configuration
MEZON_TOKEN=your_mezon_bot_token_here

# LM Studio Configuration
LM_STUDIO_API_URL=http://127.0.0.1:1234
LM_STUDIO_MODEL=your_model_name
AI_TIMEOUT=1200000

# AI System Prompt
AI_SYSTEM_PROMPT="You are a helpful project management assistant for analyzing daily reports and creating team summaries."
```

#### 3.3 Chạy Database Migration
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed database
npx prisma db seed
```

### 4. Thiết lập LM Studio

#### 4.1 Tải và cài đặt LM Studio
- Tải LM Studio từ [lmstudio.ai](https://lmstudio.ai/)
- Cài đặt và khởi động ứng dụng

#### 4.2 Tải Model AI
- Mở LM Studio
- Search và tải model phù hợp (khuyến nghị: models với 7B-20B parameters)
- Load model vào server

#### 4.3 Khởi động Local Server
- Trong LM Studio, chuyển sang tab "Local Server"
- Click "Start Server" 
- Đảm bảo server chạy trên `http://127.0.0.1:1234`

### 5. Cấu hình Mezon Bot

#### 5.1 Tạo Bot trên Mezon
- Đăng nhập vào Mezon
- Tạo bot mới và lấy bot token
- Cấu hình permissions cho bot

#### 5.2 Cập nhật Environment Variables
```env
MEZON_TOKEN=your_actual_bot_token
```

## 🏃‍♂️ Khởi động hệ thống

### Development Mode

```bash
# Khởi động với hot reload
npm run start:dev

# Hoặc với debugging
npm run start:debug
```

### Production Mode

```bash
# Build project
npm run build

# Khởi động production
npm run start:prod
```

### Development với Watch Mode

```bash
# Theo dõi file changes và auto restart
npm run start:dev
```

## 📝 Sử dụng Bot

### Lệnh cơ bản:

```
*weeklyreport                    # Tạo báo cáo tuần
*weeklyreport --option          # Tạo báo cáo với tùy chọn đặc biệt
```

### Ví dụ sử dụng:

1. **Tạo báo cáo tuần cơ bản:**
   ```
   *weeklyreport
   ```

2. **Tạo báo cáo với options:**
   ```
   *weeklyreport --detailed
   ```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## 🔧 Development Scripts

```bash
# Format code
npm run format

# Lint code
npm run lint

# Build project
npm run build
```

## 📊 Cấu trúc dự án

```
mezonbot/
├── src/
│   ├── ai/                 # AI service và prompts
│   ├── bot/                # Mezon bot logic
│   ├── report/             # Report generation
│   ├── listener/           # Event listeners
│   └── prisma/             # Database service
├── prisma/                 # Database schema
├── data/                   # Sample data
└── test/                   # Test files
```

## ⚙️ Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | MySQL connection string | - | ✅ |
| `MEZON_TOKEN` | Mezon bot token | - | ✅ |
| `LM_STUDIO_API_URL` | LM Studio API endpoint | `http://127.0.0.1:1234` | ✅ |
| `LM_STUDIO_MODEL` | AI model name | - | ✅ |
| `AI_TIMEOUT` | AI request timeout (ms) | `1200000` | ❌ |

## 🐛 Troubleshooting

### Common Issues:

#### 1. Database Connection Error
```bash
# Kiểm tra MySQL service
sudo systemctl status mysql

# Restart MySQL
sudo systemctl restart mysql
```

#### 2. LM Studio Connection Error
- Đảm bảo LM Studio server đang chạy
- Kiểm tra URL và port trong `.env`
- Verify model đã được load

#### 3. Mezon Bot Token Invalid
- Kiểm tra token trong Mezon dashboard
- Đảm bảo bot có đủ permissions

#### 4. AI Response Issues
- Kiểm tra AI model compatibility
- Verify prompt configuration
- Check token limits

## 📈 Performance Tuning

### AI Optimization:
- Sử dụng models phù hợp với hardware
- Điều chỉnh `AI_TIMEOUT` based on response time
- Optimize prompt length

### Database Optimization:
- Thêm indexes cho frequently queried fields
- Regular database maintenance
- Connection pooling configuration

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the UNLICENSED License.

## 🆘 Support

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra [Troubleshooting](#-troubleshooting) section
2. Search existing [Issues](https://github.com/yourusername/mezonbot/issues)
3. Create new issue nếu chưa có

## 🔄 Updates

Để update hệ thống:

```bash
# Pull latest changes
git pull origin main

# Update dependencies
npm install

# Run new migrations
npx prisma migrate dev

# Restart application
npm run start:dev
```

