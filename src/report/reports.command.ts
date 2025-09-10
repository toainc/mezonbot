import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ChannelMessage, ChannelMessageContent, Events } from 'mezon-sdk';
import { ReportService } from './reports.service';
import { BotService } from 'src/bot/bot.service';
import { parse } from 'path';

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
    

    if(parsed.commandName.startsWith('*weeklyreport')) {
      // send waiting message
      const replyMessage = await this.reportService.sendReplyMessage(message);
      
      try {
        switch (parsed.commandName) {
          case '*weeklyreport':
            const reportResult = await this.reportService.handleWeeklyReport(parsed.time, message.channel_id, parsed.option);
            
            // Gắn return value vào finalResult
            finalResult = {
              t: reportResult ? this.formatReportMessage(reportResult) : 'No report data available'
            };
            break;
          default:
            finalResult = {
              t: 'Unknown command'
            };
            break;
        }
      } catch (error) {
        finalResult = {
          t: `Error generating report: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }

      // Update message with result
      await this.reportService.updateMessageWithResult(message, replyMessage, finalResult);
    } else {
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
        formattedMessage += `${label}\n${reportData[key]}\n\n`;
      }
    }

    return formattedMessage;
  }

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
