import { Injectable } from '@nestjs/common';

@Injectable()
export class ReportService {
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

  parseCommand(command: string): { commandName: string; time: Date } {
    const commandName = command.split(' ')[0].toLowerCase();
    const timeParam = parseInt(command.split(' ')[1]) || 0;

    if (timeParam < 0 || timeParam > 12) {
      throw new Error('Time parameter must be between 0 and 12 weeks.');
    }

    try {
      return {
        commandName,
        time: this.calculateTimeRange(timeParam).startDate,
      };
    } catch (error) {
      throw new Error('Error calculating time range: ' + error.message);
    }
  }

  async handleWeeklyReport(time: Date): Promise<any> {
    // Implement your logic to handle the weekly report here
    console.log('Handling weekly report for time:', time);
    // inputData = PharseDatabase(time);
    return null;
  }

  
}
