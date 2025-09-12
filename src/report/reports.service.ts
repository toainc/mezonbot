import { Injectable } from '@nestjs/common';
import { ChannelMessage, ChannelMessageContent } from 'mezon-sdk';
import { BotService } from '../bot/bot.service';
import { ReportsRepository } from './reports.repository';
import { AiService } from 'src/ai/ai.service';
import { weekly_reports } from '../../generated/prisma';
import { DailyNote, WeeklyReportResponse } from './interface/reports';

@Injectable()
export class ReportService {
  constructor(
    private readonly botService: BotService,
    private readonly reportsRepository: ReportsRepository,
    private readonly aiService: AiService,
  ) {}
  calculateTimeRange(time: number): { startDate: Date } {
    const maxWeeks = 12;
    const validTime = Math.max(0, Math.min(time, maxWeeks));

    const now = new Date();
    const currentDay = now.getDay();

    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const currentWeek = new Date(now);
    currentWeek.setDate(now.getDate() - daysToMonday);

    const targetWeekStart = new Date(currentWeek);
    targetWeekStart.setDate(currentWeek.getDate() - validTime * 7);

    return { startDate: targetWeekStart };
  }

  parseCommand(command: string): {
    commandName: string;
    time: Date;
    option: boolean;
  } {
    const commandName = command.split(' ')[0].toLowerCase();
    const timeParam = parseInt(command.split(' ')[1]) || 0;
    const optionParam = command.split(' ')[2] === 'r' ? true : false;

    if (timeParam < 0 || timeParam > 12) {
      throw new Error('Time parameter must be between 0 and 12 weeks.');
    }

    try {
      return {
        commandName,
        time: this.calculateTimeRange(timeParam).startDate,
        option: optionParam,
      };
    } catch (error) {
      throw new Error('Error calculating time range: ' + error.message);
    }
  }

  /**
   * the logic get Daily data of members in week
   * apply prompt and submit to AI for generation the correct report response
   */
  async handleWeeklyReport(
    day: Date,
    channelId: string,
    option: boolean,
  ): Promise<WeeklyReportResponse | null> {
    console.log('Handling weekly report for time:', day);
    const endDate = new Date(day);
    endDate.setDate(day.getDate() + 6);

    //check if the report already exists or not when option is false
    if (!option) {
      const existingReport = await this.reportsRepository.findExistedReport(
        channelId,
        day,
      );
      if (existingReport) {
        console.log('Report already exists for this week');
        return existingReport;
      }
    }

    const inputData = await this.reportsRepository.findAllNodesInWeek(
      channelId,
      day,
      endDate,
    );
    console.log(
      `Found ${inputData.length} daily notes for the week starting ${day.toDateString()}`,
    );

    try {
      return await this.aiService.GenerateReport(inputData);
      // console.log('Generating new weekly report with data:', inputData);
    } catch (error) {
      console.error('Error generating AI report:', error);
      return null;
    }
  }

  /**
   *the logic to handle waiting reply message and update message with result
   */
  async sendReplyMessage(message: ChannelMessage) {
    return await this.botService.sendChannelMessage({
      type: 'channel',
      payload: {
        channel_id: message.channel_id,
        message: {
          type: 'system',
          content: 'Generating weekly report, please wait...',
        },
      },
      reply_to_message_id: message.id,
    });
  }

  async updateMessageWithResult(
    originalMessage: ChannelMessage,
    replyMessage: any,
    finalResult: ChannelMessageContent | null,
  ) {
    if (finalResult) {
      await this.botService.updateMessage({
        channel_id: originalMessage.channel_id,
        message_id: replyMessage.message_id,
        content: {
          type: 'system',
          content: finalResult.t || 'Weekly report generated successfully!',
        },
      });
    } else {
      await this.botService.updateMessage({
        channel_id: originalMessage.channel_id,
        message_id: replyMessage.message_id,
        content: {
          type: 'system',
          content: 'Failed to generate the weekly report.',
        },
      });
    }
  }
}
