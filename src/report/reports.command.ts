import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ChannelMessage, ChannelMessageContent, Events } from 'mezon-sdk';
import { ReportService } from './reports.service';
import { BotService } from 'src/bot/bot.service';

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
    if (!parsed?.commandName.startsWith('*weeklyreport')) {
      return null;
    }

    const replyMessage = await this.reportService.sendReplyMessage(message);
    
    try {
      const reportResult = parsed.commandName === '*weeklyreport' 
        ? await this.reportService.handleWeeklyReport(parsed.time, message.channel_id, parsed.option)
        : null;
      
      const finalResult = {
        t: reportResult ? this.formatReportMessage(reportResult) : 'No report data available'
      };

      await this.reportService.updateMessageWithResult(message, replyMessage, finalResult);
      return finalResult;
    } catch (error) {
      const errorResult = {
        t: `Error generating report: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
      await this.reportService.updateMessageWithResult(message, replyMessage, errorResult);
      return errorResult;
    }
  }

  private formatReportMessage(reportData: any): string {
    const data = typeof reportData === 'string' 
      ? (() => { try { return JSON.parse(reportData); } catch { return reportData; } })()
      : reportData;

    if (typeof data === 'string') return data;

    const fieldMap = {
      project_name: '🏢 **Project Name**',
      member: '👥 **Team Members**',
      progress: '📈 **Progress**',
      customer_communication: '💬 **Customer Communication**',
      human_resource: '🧑‍💼 **Human Resources**',
      technical_solution: '⚙️ **Technical Solutions**',
      testing: '🧪 **Testing & QA**',
      milestone: '🎯 **Next Milestone**',
      week_goal: '✅ **Week Goals**',
      issue: '⚠️ **Issues**',
    };

    return '📊 **WEEKLY REPORT**\n\n' + 
      Object.entries(fieldMap)
        .filter(([key]) => data[key])
        .map(([key, label]) => 
          `${label}\n${key === 'member' && typeof data[key] === 'number' 
            ? `${data[key]} members` 
            : data[key]}\n`
        )
        .join('\n');
  }

  private extractAndParseCommand(message: ChannelMessage): {
    commandName: string;
    time: Date;
    option: boolean;
  } | null {
    const text = message?.content?.t;
    if (!text || typeof text !== 'string') return null;
    
    try {
      return this.reportService.parseCommand(text);
    } catch {
      return null;
    }
  }
}
