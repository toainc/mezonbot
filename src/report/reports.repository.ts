import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { weekly_reports } from '../../generated/prisma';
import { DailyNote, WeeklyReportResponse } from './interface/reports';

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllNodesInWeek(
    channelID: string,
    startDate: Date,
    endDate: Date,
  ): Promise<DailyNote[]> {
    const rawData = await this.prisma.daily_notes.findMany({
      where: {
        channel_id: channelID,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'desc' },
    });

    // Map Prisma data to DailyNote interface
    return rawData.map(
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
    );
  }

  findExistedReport(
    channelId: string,
    date: Date,
  ): Promise<weekly_reports | null> {
    return this.prisma.weekly_reports.findFirst({
      where: {
        channel_id: channelId,
        date_log: date,
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
    
    // Append daily less information to human_resource field
    let humanResourceWithDailyLess = reportData.human_resource;
    if (reportData.dailyLess && Array.isArray(reportData.dailyLess) && reportData.dailyLess.length > 0) {
      humanResourceWithDailyLess += '\n\nMembers has off days:\n';
      reportData.dailyLess.forEach((member: any) => {
        humanResourceWithDailyLess += `• ${member.memberName}: ${member.totalDays} days (${member.workingHours}h)\n`;
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
        profession: reportData.profession,
        technical_solution: reportData.technical_solution,
        testing: reportData.testing,
        milestone: reportData.milestone,
        week_goal: reportData.week_goal,
        issue: reportData.issue,
        risks: reportData.risks,
        end_of_week: endOfWeek,
        date_log: startDate,
      },
    });
  }
}
