import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { PROJECT_REPORT_SYSTEM_PROMPT } from './promt/ai.weeklyreport';
import { DailyNote } from '../report/interface/reports';
import { ReportsRepository } from '../report/reports.repository';
import { WeeklyReportResponse } from '../report/interface/reports';

interface InputData {
  yesterday: string;
  today: string;
  block: string;
  member: string;
  date: Date;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly BaseURL: string | undefined;
  private readonly model: string | undefined;
  private readonly timeout: number;
  private readonly client: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    this.BaseURL =
      this.configService.get<string>('LM_STUDIO_API_URL') || undefined;
    this.model = this.configService.get<string>('LM_STUDIO_MODEL') || undefined;
    this.timeout = this.configService.get<number>('AI_TIMEOUT') || 1200000;

    this.client = axios.create({
      baseURL: this.BaseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: this.timeout,
    });
    this.logger.log(
      `LM Studio client initialized (URL=${this.BaseURL}, model=${this.model})`,
    );
  }

  /**
   * Generate weekly report using AI based on daily notes data
   */
  async GenerateReport(
    dailyNotes: DailyNote[],
  ): Promise<WeeklyReportResponse | null> {
    try {
      let finalReport: WeeklyReportResponse | null = {
        project_name: '',
        member: 0,
        progress: '',
        customer_communication: '',
        human_resource: '',
        profession: '',
        technical_solution: '',
        testing: '',
        milestone: '',
        week_goal: '',
        issue: '',
        risks: '',
      };

      finalReport.project_name =
        dailyNotes[0]?.projectName || 'Unknown Project';
      finalReport.member = await this.countMemberWeeklyReport(dailyNotes);

      let inputData: InputData[] = await this.ClearInputData(dailyNotes);

      //update promt with input data
      const promt = PROJECT_REPORT_SYSTEM_PROMPT(JSON.stringify(inputData[0]));
      this.logger.log('Generated system prompt for AI');

      const chunks = await this.ChunkInputData(inputData);

      const response = await this.client.post('/v1/chat/completions', {
        model: this.model,
        messages: [
          { role: 'system', content: promt },
          {
            role: 'user',
            content: `Please generate a weekly report based on the provided data. Ensure the report is comprehensive and covers all required sections. Using chunk data as below: ${JSON.stringify(chunks)} to generate the report`,
          },
        ],
        max_tokens: 2000,
        temperature: 0.5,
      });

      if(!response.data || !response.data.choices || response.data.choices.length === 0) {
        this.logger.error('Invalid response from AI service');
        return null;
      }
      
      const aiContent = response.data.choices[0].message.content;
      this.logger.log('Received response from AI service');

      let aiReport: WeeklyReportResponse;
      try {
        aiReport = JSON.parse(aiContent);
      } catch (error) {
        this.logger.error('Error parsing AI response as JSON', error);
        return null;
      }

      return aiReport;
    } catch (error) {
      this.logger.error('Error generating report', error);
      return null;
    }
  }

  /**
   * Split input data into chunks to fit model input limits with 2000 tokens per chunk
   */
  private async ChunkInputData(inputData: InputData[]): Promise<InputData[][]> {
    const chunks: InputData[][] = [];
    const MAX_TOKENS = 2000;
    let currentChunk: InputData[] = [];
    let currentTokenCount = 0;

    for (const note of inputData) {
      // Estimate tokens for this note (rough approximation: 4 characters per token)
      const noteJson = JSON.stringify(note);
      const estimatedTokens = Math.ceil(noteJson.length / 4);

      // If adding this note would exceed the token limit, start a new chunk
      if (
        currentTokenCount + estimatedTokens > MAX_TOKENS &&
        currentChunk.length > 0
      ) {
        chunks.push([...currentChunk]);
        currentChunk = [note];
        currentTokenCount = estimatedTokens;
      } else {
        currentChunk.push(note);
        currentTokenCount += estimatedTokens;
      }
    }

    // Add the last chunk if it has any notes
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  private async ClearInputData(dailyNote: DailyNote[]): Promise<InputData[]> {
    return dailyNote.map((note) => ({
      yesterday: note.yesterday,
      today: note.today,
      block: note.block,
      member: note.memberName,
      date: note.date,
    }));
  }

  /**
   * Combine text from two report sections, avoiding duplication
   */
  private combineText(text1: string, text2: string): string {
    if (!text1 && !text2) return '';
    if (!text1) return text2;
    if (!text2) return text1;

    // If texts are similar or one contains the other, use the longer one
    if (text1.includes(text2) || text2.includes(text1)) {
      return text1.length >= text2.length ? text1 : text2;
    }

    // Otherwise combine them with a separator
    return `${text1}\n\n${text2}`;
  }

  private async countMemberWeeklyReport(
    dailyNotes: DailyNote[],
  ): Promise<number> {
    return new Set(dailyNotes.map((n) => n.memberName)).size;
  }
}
