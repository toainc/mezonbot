import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { weekly_reports } from '../../generated/prisma';
import { DailyNote, WeeklyReportResponse } from './interface/reports';

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async Project(note: DailyNote): Promise<string> {
    return note.projectName || 'Unknown Project';
  }

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

  async saveWeeklyReport(
    channelId: string,
    dateLog: Date,
    reportData: WeeklyReportResponse,
    member: number
  ): Promise<void> {
    this.prisma.weekly_reports.create({
      data: {
        channel_id: channelId,
        date_log: dateLog,
        project_name: reportData.project_name || '',
        member: member,
        progress: reportData.progress || '',
        customer_communication: reportData.customer_communication || '',
        human_resource: reportData.human_resource || '',
        technical_solution: reportData.technical_solution,
        testing: reportData.testing,
        milestone: reportData.milestone,
        week_goal: reportData.week_goal,
        issue: reportData.issue || '',
      },
    });
  }
}
