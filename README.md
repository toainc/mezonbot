# 🤖 MezonBot - AI-Powered Project Management Bot

MezonBot is an intelligent bot system integrated with AI to analyze daily reports and automatically generate weekly reports for IT projects. The bot uses NestJS framework and integrates with the Mezon platform to provide smart project management features.

## 🌟 Key Features

- **📊 Automated Weekly Reports**: Analyzes daily notes data and generates detailed weekly reports
- **🤖 AI Integration**: Uses LM Studio and AI API for natural language processing with fallback mechanism
- **💬 Mezon Bot Integration**: Seamless integration with Mezon platform
- **📈 Progress Tracking**: Real-time project progress analysis and monitoring
- **👥 Team Management**: Tracks activities and contributions of each team member
- **🔍 Technical Analysis**: Evaluates technical solutions and testing processes

## 🛠️ Technology Stack

- **Backend**: NestJS (Node.js framework)
- **Database**: MySQL with Prisma ORM
- **AI**: LM Studio (Local AI server) with AI API fallback
- **Platform**: Mezon SDK
- **Language**: TypeScript
- **Testing**: Jest

## 📋 System Requirements

### Required Software:

- **Node.js**: >= 18.0.0
- **npm** or **yarn**: Latest version
- **MySQL**: >= 8.0
- **LM Studio**: Latest version (for local AI processing)

### Recommended Hardware:

- **RAM**: >= 8GB (16GB recommended for AI processing)
- **Storage**: >= 10GB free space
- **CPU**: Multi-core processor (Intel i5/AMD Ryzen 5 or higher)
- **GPU**: Optional but recommended for AI processing

## 🚀 Installation Guide

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/mezonbot.git
cd mezonbot
```

### 2. Install Dependencies

```bash
# Using npm
npm install

# Or using yarn
yarn install
```

### 3. Database Setup

#### 3.1 Create MySQL Database
```sql
CREATE DATABASE teta;
```

#### 3.2 Configure Database Connection
Create `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL="mysql://username:password@localhost:3306/teta"

# Mezon Configuration
MEZON_TOKEN=your_mezon_bot_token_here

# AI Configuration - LM Studio (Primary)
LM_STUDIO_API_URL=http://localhost:1234
LM_STUDIO_MODEL=your_local_model_name

# AI Configuration - AI API (Fallback)
AI_API_URL=https://api.deepseek.com
AI_API_MODEL=deepseek-chat
AI_API_KEY=your_ai_api_key_here

# AI Service Configuration
AI_TIMEOUT=120000
```

#### 3.3 Run Database Migration
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed database
npx prisma db seed
```

### 4. LM Studio Setup

#### 4.1 Download and Install LM Studio
- Download LM Studio from [lmstudio.ai](https://lmstudio.ai/)
- Install and launch the application

#### 4.2 Download AI Model
- Open LM Studio
- Search and download a suitable model (recommended: models with 7B-20B parameters)
- Load the model into the server

#### 4.3 Start Local Server
- In LM Studio, switch to "Local Server" tab
- Click "Start Server"
- Ensure server is running on `http://localhost:1234`

### 5. Mezon Bot Configuration

#### 5.1 Create Bot on Mezon
- Log in to Mezon
- Create a new bot and get the bot token
- Configure permissions for the bot

#### 5.2 Update Environment Variables
```env
MEZON_TOKEN=your_actual_bot_token
```

## 🏃‍♂️ Running the System

### Development Mode

```bash
# Start application
yarn start

# Start with hot reload
yarn start:dev

# Or with debugging
yarn start:debug
```

### Production Mode

```bash
# Build project
npm run build

# Start production
npm run start:prod
```

### Development with Watch Mode

```bash
# Watch file changes and auto restart
npm run start:dev
```

## 📝 Bot Usage

### Basic Commands:

```
*weeklyreport                    # Generate weekly report
*weeklyreport 1                  # Generate report for 1 week ago
*weeklyreport 2 r                # Regenerate report for 2 weeks ago
```

### Usage Examples:

1. **Generate current week report:**
   ```
   *weeklyreport
   ```

2. **Generate report for previous week:**
   ```
   *weeklyreport 1
   ```

3. **Regenerate report with fresh data:**
   ```
   *weeklyreport 0 r
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

## 📊 Project Structure

```
mezonbot/
├── src/
│   ├── ai/                 # AI service and prompts
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
| `LM_STUDIO_API_URL` | LM Studio API endpoint | `http://localhost:1234` | ❌ |
| `LM_STUDIO_MODEL` | Local AI model name | - | ❌ |
| `AI_API_URL` | AI API endpoint | `https://api.deepseek.com` | ❌ |
| `AI_API_MODEL` | AI API model name | `deepseek-chat` | ❌ |
| `AI_API_KEY` | AI API key | - | ✅ |
| `AI_TIMEOUT` | AI request timeout (ms) | `120000` | ❌ |

## 🤖 AI Service Architecture

The system uses a hybrid AI approach with intelligent fallback:

### Primary Service - LM Studio:
- **Local processing**: Fast and cost-effective
- **Privacy**: Data stays on your machine
- **Customizable**: Use any compatible model

### Fallback Service - AI API:
- **Cloud-based**: High availability
- **Reliable**: Professional API service
- **Automatic**: Seamless failover when LM Studio is unavailable

### Fallback Scenarios:
| Situation | Action |
|-----------|--------|
| LM Studio offline | → Switch to AI API |
| LM Studio timeout | → Switch to AI API |
| LM Studio network error | → Switch to AI API |
| LM Studio not configured | → Use AI API only |
| Both services fail | → Return error |

## 🐛 Troubleshooting

### Common Issues:

#### 1. Database Connection Error
```bash
# Check MySQL service status
sudo systemctl status mysql

# Restart MySQL
sudo systemctl restart mysql
```

#### 2. LM Studio Connection Error
- Ensure LM Studio server is running
- Check URL and port in `.env` file
- Verify model is loaded properly

#### 3. AI API Error
- Check API key validity
- Verify internet connection
- Check API rate limits

#### 4. Mezon Bot Token Invalid
- Verify token in Mezon dashboard
- Ensure bot has sufficient permissions

#### 5. AI Response Issues
- Check AI model compatibility
- Verify prompt configuration
- Check token limits and timeouts

## 📈 Performance Tuning

### AI Optimization:
- Use models suitable for your hardware
- Adjust `AI_TIMEOUT` based on response time
- Optimize prompt length and complexity

### Database Optimization:
- Add indexes for frequently queried fields
- Regular database maintenance
- Configure connection pooling

### Memory Management:
- Monitor RAM usage during AI processing
- Adjust chunk sizes for large datasets
- Consider model quantization for better performance

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines:
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation for new features
- Use conventional commit messages

## 📄 License

This project is licensed under the UNLICENSED License.

## 🆘 Support

If you encounter issues, please:
1. Check the [Troubleshooting](#-troubleshooting) section
2. Search existing [Issues](https://github.com/yourusername/mezonbot/issues)
3. Create a new issue if none exists

### Getting Help:
- 📧 Email: support@yourcompany.com
- 💬 Discord: [Your Discord Server]
- 📚 Documentation: [Your Documentation Site]

## 🔄 Updates

To update the system:

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

## 🚀 Deployment

### Production Deployment:

1. **Environment Setup:**
   ```bash
   NODE_ENV=production
   ```

2. **Build and Start:**
   ```bash
   npm run build
   npm run start:prod
   ```

3. **Process Management:**
   ```bash
   # Using PM2
   pm2 start dist/main.js --name mezonbot
   pm2 save
   pm2 startup
   ```

### Docker Deployment:

```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

## 📊 Monitoring and Analytics

- **Application Health**: Monitor AI service response times
- **Database Performance**: Track query execution times
- **Bot Activity**: Monitor command usage and success rates
- **AI Usage**: Track token consumption and model performance

---

**Made with ❤️ by the MezonBot Team**

