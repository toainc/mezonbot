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
  private readonly BaseURL: string | undefined;
  private readonly model: string | undefined;
  private readonly timeout: number;
  private readonly client: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    this.BaseURL = this.configService.get<string>('LM_STUDIO_API_URL');
    this.model = this.configService.get<string>('LM_STUDIO_MODEL');
    this.timeout = this.configService.get<number>('AI_TIMEOUT') || 1200000;

    // HTTP CLIENT SETUP: Configure axios instance for AI API calls
    this.client = axios.create({
      baseURL: this.BaseURL,
      timeout: this.timeout,
    });
    
    this.logger.log(`LM Studio client initialized (URL=${this.BaseURL}, model=${this.model})`);
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
   * Unified AI API call method with system/user role support
   * @param input - Input data 
   * @param prompt - Either string prompt or object with system/user roles
   * @returns Promise with AI API response
   */
  callAI(input: string, prompt: string | { system: string; user: string }) {
    const isMergeOperation = typeof prompt === 'string' && (prompt.includes('merge') || prompt.includes('consolidate'));
    
    // Build messages array based on prompt type
    const messages = typeof prompt === 'string' 
      ? [{ role: 'user', content: prompt }]
      : [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user }
        ];
    
    // DYNAMIC PARAMETER CONFIGURATION: Optimize AI parameters for consistency
    return this.client.post('/v1/chat/completions', {
      model: this.model,
      messages,
      temperature: isMergeOperation ? 0.2 : 0.1, // Very low temperature for maximum consistency
      max_tokens: 2000,
      top_p: 0.9, // Add top_p for more focused responses
      frequency_penalty: 0.3, // Reduce repetition
      presence_penalty: 0.1, // Encourage diverse vocabulary
    });
  }

  /**
   * Validate and normalize AI response to ensure consistency
   * @param response - Parsed AI response
   * @returns Normalized WeeklyReportResponse
   */
  // private validateAndNormalizeResponse(response: any): WeeklyReportResponse {
  //   // Define required fields that must always be present
  //   const requiredFields = ['progress', 'human_resource', 'testing', 'week_goal'];
    
  //   // Initialize with default values and handle human_resource array format
  //   const normalizedResponse: Partial<WeeklyReportResponse> = {
  //     project_name: response.project_name || 'Project Analysis',
  //     member: response.member || '0',
  //     progress: response.progress || 'No progress data available',
  //     customer_communication: response.customer_communication || '',
  //     human_resource: this.normalizeHumanResource(response.human_resource),
  //     profession: response.profession || '',
  //     technical_solution: response.technical_solution || '',
  //     testing: response.testing || 'No testing data available',
  //     milestone: response.milestone || '',
  //     week_goal: response.week_goal || 'No weekly goals identified',
  //     issue: response.issue || '',
  //     risks: response.risks || ''
  //   };

  //   // Validate required fields are not empty (skip human_resource as it's handled above)
  //   requiredFields.forEach(field => {
  //     if (field === 'human_resource') return; // Skip as it's already normalized
      
  //     const fieldValue = response[field];
  //     // Check if field exists, is a string, and is not empty after trimming
  //     if (!fieldValue || typeof fieldValue !== 'string' || fieldValue.trim() === '') {
  //       this.logger.warn(`Required field '${field}' is missing, not a string, or empty - using default value`);
  //       switch (field) {
  //         case 'customer_communication':
  //           normalizedResponse.customer_communication = 'No customer communication data available';
  //           break;
  //         case 'progress':
  //           normalizedResponse.progress = 'Progress analysis not available from provided data';
  //           break;
  //         case 'testing':
  //           normalizedResponse.testing = 'Testing information not found in daily notes';
  //           break;
  //         case 'week_goal':
  //           normalizedResponse.week_goal = 'Weekly goals not identified from available data';
  //           break;
  //       }
  //     }
  //   });

  //   return normalizedResponse as WeeklyReportResponse;
  // }

  // /**
  //  * Normalize human resource data from array or string to string format
  //  */
  // private normalizeHumanResource(humanResourceData: any): string {
  //   if (!humanResourceData) {
  //     return 'No team member data available';
  //   }

  //   // If it's already a string, return as is
  //   if (typeof humanResourceData === 'string') {
  //     return humanResourceData.trim() || 'No team member data available';
  //   }

  //   // If it's an array, format it properly
  //   if (Array.isArray(humanResourceData)) {
  //     return humanResourceData.map(member => {
  //       if (typeof member === 'object' && member.name && member.tasks) {
  //         const tasks = Array.isArray(member.tasks) 
  //           ? member.tasks.join(', ') 
  //           : String(member.tasks);
  //         return `${member.name}: ${tasks}`;
  //       }
  //       return String(member);
  //     }).join(' | ');
  //   }

  //   // Fallback for other types
  //   return String(humanResourceData) || 'No team member data available';
  // }
}
