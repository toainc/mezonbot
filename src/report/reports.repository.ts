import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { weekly_reports } from '../../generated/prisma';
import { DailyNote, WeeklyReportResponse } from './interface/reports';

// Simple UTC+7 timezone helper
function toUTCPlus7(date: Date): Date {
  return new Date(date.getTime() + (7 * 60 * 60 * 1000));
}

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllNodesInWeek(
    channelID: string,
    startDate: Date,
    endDate: Date,
  ): Promise<DailyNote[]> {
    // Convert to UTC+7 for database query
    const startDateUTC7 = toUTCPlus7(startDate);
    const endDateUTC7 = toUTCPlus7(endDate);
    
    const rawData = await this.prisma.daily_notes.findMany({
      where: {
        channel_id: channelID,
        date: {
          gte: startDateUTC7,
          lte: endDateUTC7,
        },
      },
      orderBy: { date: 'desc' },
    });

    // Map Prisma data to DailyNote interface and filter only weekdays
    return rawData
      .map(
        (note): DailyNote => ({
          projectName: note.project_name || '',
          channelId: note.channel_id,
          block: note.block || '',
          today: note.today || '',
          yesterday: note.yesterday || '',
          date: note.date || new Date(),
          workingTime: note.working_time || 0,
          memberName: note.member || '',
        }),
      )
      .filter((note) => {
        const dayOfWeek = note.date.getDay();
        // Only include weekdays (Monday = 1 to Friday = 5)
        return dayOfWeek >= 1 && dayOfWeek <= 5;
      });
  }

  findExistedReport(
    channelId: string,
    date: Date,
  ): Promise<weekly_reports | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Convert to UTC+7 for database query
    const startOfDayUTC7 = toUTCPlus7(startOfDay);
    const endOfDayUTC7 = toUTCPlus7(endOfDay);
    
    return this.prisma.weekly_reports.findFirst({
      where: {
        channel_id: channelId,
        date_log: {
          gte: startOfDayUTC7,
          lte: endOfDayUTC7,
        },
      },
    });
  }

  /**
   * Save weekly report response to database
   * @param channelId - Channel ID where the report was generated
   * @param reportData - Weekly report data from AI service
   * @param startDate - Start date of the week
   * @returns Created weekly report record
   */
  async saveWeeklyReport(
    channelId: string,
    reportData: WeeklyReportResponse,
    startDate: Date,
  ): Promise<weekly_reports> {
    const endOfWeek = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);
    endOfWeek.setHours(23, 59, 59, 999);
    
    // Convert to UTC+7 for database storage
    const startDateUTC7 = toUTCPlus7(startDate);
    const endOfWeekUTC7 = toUTCPlus7(endOfWeek);
    
    // Append daily less information to human_resource field
    let humanResourceWithDailyLess = reportData.human_resource;
    if (reportData.dailyLess && Array.isArray(reportData.dailyLess) && reportData.dailyLess.length > 0) {
      humanResourceWithDailyLess += '\n\nMembers with insufficient working days (less than 5 weekdays):\n';
      reportData.dailyLess.forEach((member: any) => {
        humanResourceWithDailyLess += `• ${member.memberName}: ${member.totalDays}/5 days (missing ${member.missingDays} days)\n`;
      });
    }
    
    return this.prisma.weekly_reports.create({
      data: {
        channel_id: channelId,
        project_name: reportData.project_name,
        member: reportData.member,
        progress: reportData.progress,
        customer_communication: reportData.customer_communication,
        human_resource: humanResourceWithDailyLess,
        technical_solution: reportData.technical_solution,
        testing: reportData.testing,
        milestone: reportData.milestone,
        week_goal: reportData.week_goal,
        issue: reportData.issue,
        end_of_week: endOfWeekUTC7,
        date_log: startDateUTC7,
      },
    });
  }
}
