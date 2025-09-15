import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { PROJECT_REPORT_SYSTEM_PROMPT } from './promt/ai.weeklyreport';
import { AI_MERGE_RESPONSE_PROMPT } from './promt/ai.mergeresponse';
import { DailyNote } from '../report/interface/reports';
import { WeeklyReportResponse } from '../report/interface/reports';
import { encode } from 'gpt-tokenizer';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly lmStudioURL: string | undefined;
  private readonly lmStudioModel: string | undefined;
  private readonly deepseekURL: string;
  private readonly deepseekModel: string;
  private readonly deepseekApiKey: string;
  private readonly timeout: number;
  private readonly lmStudioClient: AxiosInstance;
  private readonly deepseekClient: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    // LM Studio Configuration
    this.lmStudioURL = this.configService.get<string>('LM_STUDIO_API_URL');
    this.lmStudioModel = this.configService.get<string>('LM_STUDIO_MODEL');
    
    // DeepSeek Configuration
    this.deepseekURL = this.configService.get<string>('DEEPSEEK_API_URL') || 'https://api.deepseek.com';
    this.deepseekModel = this.configService.get<string>('DEEPSEEK_MODEL') || 'deepseek-chat';
    this.deepseekApiKey = this.configService.get<string>('DEEPSEEK_API_KEY') || '';
    
    this.timeout = this.configService.get<number>('AI_TIMEOUT') || 1200000;

    // HTTP CLIENT SETUP: Configure axios instances for both LM Studio and DeepSeek
    this.lmStudioClient = axios.create({
      baseURL: this.lmStudioURL,
      timeout: this.timeout,
    });

    this.deepseekClient = axios.create({
      baseURL: this.deepseekURL,
      timeout: this.timeout,
      headers: {
        'Authorization': `Bearer ${this.deepseekApiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    this.logger.log(`AI clients initialized - LM Studio: ${this.lmStudioURL} | DeepSeek: ${this.deepseekURL}`);
  }

  /**
   * Generate weekly report using AI based on daily notes data
   */
  async GenerateReport(dailyNotes: DailyNote[]): Promise<WeeklyReportResponse | null> {
    console.log(`team member count: ${new Set(dailyNotes.map(n => n.memberName)).size}`);
    try {
      // Data Extraction and Preparation
      // Extract only relevant fields from daily notes to reduce token usage and focus AI analysis
      const inputArray = dailyNotes.map(note => ({
        projectName: note.projectName,
        memberName: note.memberName,
        today: note.today,
        date: note.date,
        block: note.block,
      }));

      // Data Chunking for Token Management
      // Split large datasets into smaller chunks (30 objects max) to stay within AI token limits
      // Each chunk will be processed separately to avoid context overflow
      const chunkSize = 30;
      const splitData: typeof inputArray[] = Array.from(
        { length: Math.ceil(inputArray.length / chunkSize) },
        (_, index) => inputArray.slice(index * chunkSize, (index + 1) * chunkSize)
      );

      // AI Processing of Individual Segments
      // Collect all responses for later merging
      const responses: string[] = [];

      for (const [index, segment] of splitData.entries()) {
        console.log(`Processing Segment ${index + 1}: ${encode(JSON.stringify(segment)).length} tokens`);
        try {
          // Generate AI response for this specific data segment using system/user roles
          const promptData = PROJECT_REPORT_SYSTEM_PROMPT(JSON.stringify(segment));
          const response = await this.callAI(JSON.stringify(segment), promptData);
          responses.push(response.data.choices[0].message.content);
        } catch (error) {
          this.logger.error(`Error processing segment ${index + 1}:`, error);
        }
      }

      // If multiple segments were processed, use AI to intelligently merge responses
      // If single segment, use the response directly without merging overhead
      const finalResponse = responses.length > 1
        ? (await this.callAI(responses.join('\n'), AI_MERGE_RESPONSE_PROMPT(responses))).data.choices[0].message.content
        : responses[0] || '';

      // Response Cleaning and JSON Extraction
      // Remove unwanted tokens and extract valid JSON structure from AI response
      let cleanResponse = finalResponse.replace(/<\|[^|]*\|>/g, '').trim(); // Remove AI-specific tokens
      
      // Find the first JSON object in the response
      const startIndex = cleanResponse.indexOf('{');
      if (startIndex !== -1) {
        cleanResponse = cleanResponse.substring(startIndex);
        
        let braceCount = 0;
        for (let i = 0; i < cleanResponse.length; i++) {
          if (cleanResponse[i] === '{') braceCount++;
          if (cleanResponse[i] === '}' && --braceCount === 0) {
            cleanResponse = cleanResponse.substring(0, i + 1);
            break;
          }
        }
      }
      
      // Final Parsing and Error Handling with validation
      try {
        const parsedResponse = JSON.parse(cleanResponse) as WeeklyReportResponse;
        
        // Validate and ensure required fields are present
        // const validatedResponse = this.validateAndNormalizeResponse(parsedResponse);
        
        return parsedResponse;
      } catch (parseError) {
        this.logger.error('JSON parsing failed:', parseError);
        return { raw_response: cleanResponse } as any;
      }
    } catch (error) {
      this.logger.error('Error generating weekly report', error);
      return null;
    }
  }

  /**
   * Unified AI API call method with LM Studio primary and DeepSeek fallback
   * @param input - Input data 
   * @param prompt - Either string prompt or object with system/user roles
   * @returns Promise with AI API response
   */
  async callAI(input: string, prompt: string | { system: string; user: string }) {
    const isMergeOperation = typeof prompt === 'string' && (prompt.includes('merge') || prompt.includes('consolidate'));
    
    // Build messages array based on prompt type
    const messages = typeof prompt === 'string' 
      ? [{ role: 'user', content: prompt }]
      : [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user }
        ];
    
    // AI parameters configuration
    const requestConfig = {
      messages,
      temperature: isMergeOperation ? 0.2 : 0.1,
      max_tokens: 2000,
      top_p: 0.9,
      frequency_penalty: 0.3,
      presence_penalty: 0.1,
    };

    // Try LM Studio first
    if (this.lmStudioURL && this.lmStudioModel) {
      try {
        this.logger.log('Attempting LM Studio API call...');
        const response = await this.lmStudioClient.post('/v1/chat/completions', {
          model: this.lmStudioModel,
          ...requestConfig,
        });
        this.logger.log('LM Studio API call successful');
        return response;
      } catch (error) {
        this.logger.warn('LM Studio failed, falling back to DeepSeek:', error.message);
      }
    }

    // Fallback to DeepSeek
    try {
      this.logger.log('Using DeepSeek API...');
      const response = await this.deepseekClient.post('/v1/chat/completions', {
        model: this.deepseekModel,
        ...requestConfig,
      });
      this.logger.log('DeepSeek API call successful');
      return response;
    } catch (error) {
      this.logger.error('Both AI services failed:', error);
      throw new Error(`AI services unavailable: ${error.message}`);
    }
  }
}
