import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { PROJECT_REPORT_SYSTEM_PROMPT } from './promt/ai.weeklyreport';
import { DailyNote } from '../report/interface/reports';
import { ReportsRepository } from '../report/reports.repository';
import { WeeklyReportResponse } from '../report/interface/reports';
import { encode } from 'gpt-tokenizer';

export type InputData = string[];

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
    console.log(`team member count: ${this.countMemberofTeam(dailyNotes)}`);
    try {
      let finalReport: WeeklyReportResponse | null = null;
      const input = this.clearInputData(dailyNotes, [
        'projectName',
        'memberName',
        'today',
        'date',
        'block',
      ]);

      // Tạo prompt và call AI
      const prompt = `${PROJECT_REPORT_SYSTEM_PROMPT}\n\nDaily Notes Data:\n${input}\n\nGenerate weekly report based on the above data.`;
      console.log(this.estimateInputTokens(prompt));
      const response = await this.client.post('/v1/chat/completions', {
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const aiResponse = response.data.choices[0].message.content;
      console.log(this.estimateInputTokens(aiResponse));
      // Loại bỏ các token không mong muốn và fix JSON
      let cleanResponse = aiResponse
        .replace(/<\|[^|]*\|>/g, '') // Loại bỏ <|token|>
        .trim();

      // Tìm JSON object đầu tiên
      const startIndex = cleanResponse.indexOf('{');
      if (startIndex !== -1) {
        cleanResponse = cleanResponse.substring(startIndex);
        
        // Đếm braces để tìm JSON object hoàn chỉnh
        let braceCount = 0;
        let endIndex = -1;
        
        for (let i = 0; i < cleanResponse.length; i++) {
          if (cleanResponse[i] === '{') braceCount++;
          if (cleanResponse[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
              endIndex = i + 1;
              break;
            }
          }
        }
        
        if (endIndex !== -1) {
          cleanResponse = cleanResponse.substring(0, endIndex);
        }
      }

      // Console log AI response dễ nhìn
      // console.log('🤖 AI Generated Weekly Report:');
      // console.log('='.repeat(60));
      try {
        // Thử parse JSON để format đẹp
        const parsedResponse = JSON.parse(cleanResponse);
        // console.log(JSON.stringify(parsedResponse, null, 2));
        // console.log('='.repeat(60));

        // Trả về parsed JSON response
        return parsedResponse as WeeklyReportResponse;
      } catch {
        // Nếu không phải JSON, in text thường
        // console.log(cleanResponse);
        // console.log('='.repeat(60));

        // Trả về raw response nếu không parse được
        return { raw_response: cleanResponse } as any;
      }
    } catch (error) {
      this.logger.error('Error generating weekly report', error);
      return null;
    }
  }

  private clearInputData(dailyNotes: DailyNote[], pick?: InputData): string {
    const extractedData = dailyNotes.map((note) => {
      const selectedData: Record<string, any> = {};
      if (pick) {
        pick.forEach((key) => {
          selectedData[key] = note[key];
        });
      }
      return selectedData;
    });

    return JSON.stringify(extractedData);
  }

  private async countMemberWeeklyReport(
    dailyNotes: DailyNote[],
  ): Promise<number> {
    return new Set(dailyNotes.map((n) => n.memberName)).size;
  }

  estimateInputTokens(input: string): number {
    // Sử dụng hàm encode từ gpt-tokenizer để lấy mảng token
    const tokens = encode(input);
    return tokens.length;
  }

  countMemberofTeam(dailyNotes: DailyNote[]): number {
    return new Set(dailyNotes.map((n) => n.memberName)).size;
  }
}
