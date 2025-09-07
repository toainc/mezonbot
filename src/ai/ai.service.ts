import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { PROJECT_REPORT_SYSTEM_PROMPT } from './promt/ai.weeklyreport';
import { weekly_reports } from '../../generated/prisma';
import { DailyNote } from '../report/interface/reports';

interface WeeklyReportResponse {
  project_name: string;
  member: string;
  progress: string;
  customer_communication: string;
  human_resource: string;
  profession: string;
  technical_solution: string;
  testing: string;
  milestone: string;
  week_goal: string;
  issue: string;
  risks: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly BaseURL : string | undefined;
  private readonly model : string | undefined
  private readonly timeout: number
  private readonly client: AxiosInstance

  constructor(private readonly configService: ConfigService) {
    this.BaseURL = this.configService.get<string>('LM_STUDIO_API_URL') || undefined;
    this.model = this.configService.get<string>('LM_STUDIO_MODEL') || undefined;
    this.timeout = this.configService.get<number>('AI_TIMEOUT') || 1200000;

    this.client = axios.create({
        baseURL: this.BaseURL,
        headers: {
            'Content-Type': 'application/json'
        },
        timeout: this.timeout
    });
    this.logger.log(`LM Studio client initialized (URL=${this.BaseURL}, model=${this.model})`);
  }

  /**
   * Generate weekly report using AI based on daily notes data
   */
  async GenerateReport(dailyNotes: DailyNote[]): Promise<WeeklyReportResponse | null> {
    try {
      // Prepare input data for AI
      const inputData = this.prepareInputData(dailyNotes);
      
      // Create prompt with input data
      const prompt = PROJECT_REPORT_SYSTEM_PROMPT(JSON.stringify(inputData, null, 2));
      
      // Prepare request payload for LM Studio
      const requestPayload = {
        model: this.model,
        messages: [
          {
            role: "system",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      };

      this.logger.log('Sending request to AI service for report generation');
      
      // Make request to LM Studio
      const response = await this.client.post('/v1/chat/completions', requestPayload);
      
      if (response.data?.choices?.[0]?.message?.content) {
        const reportContent = JSON.parse(response.data.choices[0].message.content);
        this.logger.log('Successfully generated weekly report');
        return reportContent as WeeklyReportResponse;
      } else {
        this.logger.error('Invalid response structure from AI service');
        return null;
      }
      
    } catch (error) {
      this.logger.error('Error generating report:', error);
      if (error instanceof SyntaxError) {
        this.logger.error('Failed to parse AI response as JSON');
      }
      return null;
    }
  }

  /**
   * Prepare and format input data for AI processing
   */
  private prepareInputData(dailyNotes: DailyNote[]) {
    const summary = {
      totalNotes: dailyNotes.length,
      dateRange: {
        start: dailyNotes.length > 0 ? new Date(Math.min(...dailyNotes.map(note => note.date.getTime()))) : null,
        end: dailyNotes.length > 0 ? new Date(Math.max(...dailyNotes.map(note => note.date.getTime()))) : null
      },
      members: [...new Set(dailyNotes.map(note => note.memberName).filter(Boolean))],
      projects: [...new Set(dailyNotes.map(note => note.projectName).filter(Boolean))],
      totalWorkingTime: dailyNotes.reduce((sum, note) => sum + note.workingTime, 0),
      averageWorkingTime: dailyNotes.length > 0 ? dailyNotes.reduce((sum, note) => sum + note.workingTime, 0) / dailyNotes.length : 0
    };

    const groupedByMember = dailyNotes.reduce((acc, note) => {
      const member = note.memberName || 'Unknown';
      if (!acc[member]) {
        acc[member] = [];
      }
      acc[member].push(note);
      return acc;
    }, {} as Record<string, DailyNote[]>);

    const groupedByProject = dailyNotes.reduce((acc, note) => {
      const project = note.projectName || 'Unknown';
      if (!acc[project]) {
        acc[project] = [];
      }
      acc[project].push(note);
      return acc;
    }, {} as Record<string, DailyNote[]>);

    return {
      summary,
      dailyNotes: dailyNotes.map(note => ({
        date: note.date.toISOString().split('T')[0],
        member: note.memberName,
        project: note.projectName,
        workingTime: note.workingTime,
        today: note.today,
        yesterday: note.yesterday,
        block: note.block
      })),
      groupedByMember,
      groupedByProject
    };
  }
}
