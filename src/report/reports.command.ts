import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ChannelMessage, ChannelMessageContent, Events } from 'mezon-sdk';
import { ReportService } from './reports.service';
import { BotService } from 'src/bot/bot.service';
import { DailyNote } from './interface/reports';

@Injectable()
export class ReportsCommand {
  constructor(
    private readonly reportService: ReportService,
    private readonly botService: BotService,
  ) {}

  @OnEvent(Events.ChannelMessage)
  async handleCommand(message: ChannelMessage): Promise<ChannelMessageContent | null> {
    if (message.sender_id === this.botService.getBotId()) {
      return null;
    }

    const parsed = this.extractAndParseCommand(message);
    if (!parsed) {
      return null;
    }

    let finalResult: ChannelMessageContent | null = null;
    

    switch (parsed.commandName) {
      case '*weeklyreport':
        // send waiting message
        const replyMessage = await this.reportService.sendReplyMessage(message);
        
        try {
          const reportResult = await this.reportService.handleWeeklyReport(parsed.time, message.channel_id, parsed.option);
          
          // Gắn return value vào finalResult
          finalResult = {
            t: reportResult ? this.formatReportMessage(reportResult) : 'No report data available'
          };
        } catch (error) {
          finalResult = {
            t: `Error generating report: ${error instanceof Error ? error.message : 'Unknown error'}`
          };
        }

        // Update message with result
        await this.reportService.updateMessageWithResult(message, replyMessage, finalResult);
        break;
        
      case '*help':
        // send waiting message
        const helpReplyMessage = await this.reportService.sendReplyMessage(message);
        
        finalResult = {
          t: this.getHelpMessage()
        };
        
        // Update message with result
        await this.reportService.updateMessageWithResult(message, helpReplyMessage, finalResult);
        break;
        
      default:
        return null;
    }

    return finalResult;
  }

  private formatReportMessage(reportData: any): string {
    if (typeof reportData === 'string') {
      try {
        reportData = JSON.parse(reportData);
      } catch {
        return reportData;
      }
    }

    let formattedMessage = '📊 **WEEKLY REPORT**\n\n';
    
    const fieldMap = {
      'project_name': '🏢 **Project Name**',
      'member': '👥 **Team Members**',
      'progress': '📈 **Progress**',
      'customer_communication': '💬 **Customer Communication**',
      'human_resource': '🧑‍💼 **Human Resources**',
      'profession': '🛠️ **Professional Skills**',
      'technical_solution': '⚙️ **Technical Solutions**',
      'testing': '🧪 **Testing & QA**',
      'milestone': '🎯 **Next Milestone**',
      'week_goal': '✅ **Week Goals**',
      'issue': '⚠️ **Issues**',
      'risks': '🚨 **Risks**'
    };

    for (const [key, label] of Object.entries(fieldMap)) {
      if (reportData[key]) {
        // Handle different data types properly to avoid [object Object] display
        let formattedValue: string;
        
        if (typeof reportData[key] === 'string') {
          formattedValue = reportData[key];
        } else if (Array.isArray(reportData[key])) {
          // Handle arrays by joining with line breaks
          formattedValue = reportData[key].join('\n');
        } else if (typeof reportData[key] === 'object') {
          // Handle objects by converting to readable format
          formattedValue = JSON.stringify(reportData[key], null, 2);
        } else {
          // Handle other types (numbers, booleans, etc.)
          formattedValue = String(reportData[key]);
        }

        // Add dailyLess information to human_resource field
        if (key === 'human_resource' && reportData.dailyLess && Array.isArray(reportData.dailyLess) && reportData.dailyLess.length > 0) {
          formattedValue += '\n\nMembers has off days:\n';
          reportData.dailyLess.forEach((member: any) => {
            formattedValue += `• ${member.memberName}: ${5 - member.totalDays} days\n`;
          });
        }
        
        formattedMessage += `${label}\n${formattedValue}\n\n`;
      }
    }

    return formattedMessage;
  }

  private getHelpMessage(): string {
    return `🤖 **MezonBot Help** - AI-Powered Project Management Bot

📋 **Available Commands:**

**📊 Weekly Reports:**
\`*weeklyreport\` - Generate current week report
\`*weeklyreport 1\` - Generate report for 1 week ago  
\`*weeklyreport 2\` - Generate report for 2 weeks ago
\`*weeklyreport 0 r\` - Regenerate current week report with fresh data
\`*weeklyreport 1 r\` - Regenerate report for 1 week ago with fresh data

**❓ Help:**
\`*help\` - Show this help message

📝 **Usage Examples:**
• \`*weeklyreport\` - Get this week's automated report
• \`*weeklyreport 1\` - Get last week's report  
• \`*weeklyreport 2 r\` - Regenerate 2 weeks ago report

🔧 **Features:**
• 📊 Automated weekly reports with AI analysis
• 🤖 AI integration (LM Studio + API fallback)
• 📈 Progress tracking and team management
• 🔍 Technical analysis and testing evaluation
• 👥 Team member activity monitoring

💡 **Tips:**
• Use \`r\` option to regenerate reports with fresh data
• Reports are automatically generated from daily notes
• AI analyzes your team's progress and provides insights

🆘 **Need more help?**
Contact the development team or check the documentation.`;
  }

  /**
   * complain all the members daily enought 5 times in a week.
   */

  //extract and valid command
  private extractAndParseCommand(message: ChannelMessage): {
    commandName: string;
    time: Date;
    option: boolean;
  } | null {
    const text = message?.content?.t;
    if (!text || typeof text !== 'string') {
      return null;
    }
    try {
      return this.reportService.parseCommand(text);
    } catch (e) {
      return null;
    }
  }
}
