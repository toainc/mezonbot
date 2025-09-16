import { Injectable } from '@nestjs/common';
import { ChannelMessage, ChannelMessageContent } from 'mezon-sdk';
import { BotService } from '../bot/bot.service';
import { ReportsRepository } from './reports.repository';
import { AiService } from 'src/ai/ai.service';
import { DailyNote, WeeklyReportResponse } from './interface/reports';
import { get } from 'http';

// Simple UTC+7 timezone helper
function toUTCPlus7(date: Date): Date {
  return new Date(date.getTime() + (7 * 60 * 60 * 1000));
}

/**
 * Service for handling weekly report generation and management
 * Processes commands, generates AI reports, and manages bot responses
 */
@Injectable()
export class ReportService {
  constructor(
    private readonly botService: BotService,
    private readonly reportsRepository: ReportsRepository,
    private readonly aiService: AiService,
  ) {}
  /**
   * Calculate start date for weekly report based on weeks back from current Monday
   */
  calculateTimeRange(time: number): { startDate: Date } {
    const validTime = Math.max(0, Math.min(time, 12));
    const now = new Date();
    const daysToMonday = now.getDay() === 0 ? 6 : now.getDay() - 1;
    
    // Calculate Monday of the target week
    const currentWeek = new Date(
      now.getTime() - daysToMonday * 24 * 60 * 60 * 1000,
    );
    currentWeek.setDate(currentWeek.getDate() - validTime * 7);
    currentWeek.setHours(0, 0, 0, 0);
    
    return { startDate: currentWeek };
  }

  /**
   * Parse command string to extract command name, time parameter and regenerate option
   */
  parseCommand(command: string): {
    commandName: string;
    time: Date;
    option: boolean;
  } {
    const [commandName, timeStr, optionStr] = command.split(' ');
    
    // Handle help command
    if (commandName.toLowerCase() === '*help') {
      return {
        commandName: '*help',
        time: new Date(),
        option: false,
      };
    }
    
    const timeParam = parseInt(timeStr) || 0;

    if (timeParam < 0 || timeParam > 12) {
      throw new Error('Time parameter must be between 0 and 12 weeks.');
    }

    return {
      commandName: commandName.toLowerCase(),
      time: this.calculateTimeRange(timeParam).startDate,
      option: optionStr === 'r',
    };
  }

  /**
   * Generate weekly report from daily notes data or return existing report
   * Uses AI service to analyze daily notes and create comprehensive report
   */
  async handleWeeklyReport(
    day: Date,
    channelId: string,
    option: boolean,
  ): Promise<WeeklyReportResponse | null> {
    const endDate = new Date(day.getTime() + 6 * 24 * 60 * 60 * 1000);
    endDate.setHours(23, 59, 59, 999);
    console.log(day);

    if (!option) {
      const existingReport = await this.reportsRepository.findExistedReport(
        channelId,
        day,
      );
      if (existingReport) return existingReport;
    }

    const inputData = await this.reportsRepository.findAllNodesInWeek(
      channelId,
      day,
      endDate,
    );
    console.log(
      `Found ${inputData.length} daily notes for week ${day.toDateString()}`,
    );

    try {
      const dailyCheck = await this.DailyLess(inputData);
      console.log(`Members with less than 5 working days: ${dailyCheck.length}`);
      const aiResponse = await this.aiService.GenerateReport(inputData);
      if (aiResponse) {
        aiResponse.project_name = inputData[0]?.projectName || 'Unknown Project';
        aiResponse.member = new Set(inputData.map(n => n.memberName)).size;
        const finalReport = { ...aiResponse, dailyLess: dailyCheck };
        
        // Save the weekly report to database
        try {
          await this.reportsRepository.saveWeeklyReport(channelId, finalReport, day);
          console.log(`Weekly report saved to database for channel ${channelId} on ${day.toDateString()}`);
        } catch (saveError) {
          console.error('Error saving weekly report to database:', saveError);
          // Continue execution even if save fails
        }
        
        return finalReport;
      }
      return null;
    } catch (error) {
      console.error('Error generating AI report:', error);
      return null;
    }
  }

  /**
   * Send waiting message to user while generating report
   */
  async sendReplyMessage(message: ChannelMessage) {
    return this.botService.sendChannelMessage({
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

  /**
   * Update bot message with final report result or error message
   */
  async updateMessageWithResult(
    originalMessage: ChannelMessage,
    replyMessage: any,
    finalResult: ChannelMessageContent | null,
  ) {
    return this.botService.updateMessage({
      channel_id: originalMessage.channel_id,
      message_id: replyMessage.message_id,
      content: {
        type: 'system',
        content:
          finalResult?.t ||
          (finalResult
            ? 'Weekly report generated successfully!'
            : 'Failed to generate the weekly report.'),
      },
    });
  }

  async DailyLess(data: DailyNote[]) : Promise<any> {
    const uniqueRecords = cleanCheckOffDate(data)
    const memberStats = analyzeWeeklyDataByMember(await uniqueRecords);
    const membersWithLessThan5Days = Array.from(memberStats.entries())
      .filter(([_, stats]) => stats.totalDays < 5)
      .map(([memberName, stats]) => ({
        memberName,
        totalDays: stats.totalDays,
      }));

    console.log(`membersWithLessThan5Days: ${JSON.stringify(membersWithLessThan5Days)}`)
    return membersWithLessThan5Days;
  }
}

function analyzeWeeklyDataByMember(dailyNotes: DailyNote[]) {
  const memberStats = new Map<
    string,
    {
      totalDays: number;
      uniqueDates: Set<string>;
      workingHours: number;
    }
  >();

  dailyNotes.forEach((note) => {
    const dateKey = note.date.toDateString();

    if (!memberStats.has(note.memberName)) {
      memberStats.set(note.memberName, {
        totalDays: 0,
        uniqueDates: new Set<string>(),
        workingHours: 0,
      });
    }

    const memberData = memberStats.get(note.memberName)!;

    if (!memberData.uniqueDates.has(dateKey)) {
      memberData.uniqueDates.add(dateKey);
      memberData.totalDays += 1;
      memberData.workingHours += note.workingTime;
    }
  });
  return memberStats;
}

async function cleanCheckOffDate(dailyNotes: DailyNote[]): Promise<DailyNote[]> {
  const uniqueRecords = new Map<string, DailyNote>();

  dailyNotes.forEach(note => {
    const key = `${note.memberName}-${note.date.toDateString()}`;
    if (!uniqueRecords.has(key)) {
      uniqueRecords.set(key, note);
    }
  });

  return Array.from(uniqueRecords.values());
}
