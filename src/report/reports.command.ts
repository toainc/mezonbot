import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ChannelMessage, ChannelMessageContent, Events } from 'mezon-sdk';
import { ReportService } from './reports.service';
import { BotService } from 'src/bot/bot.service';

@Injectable()
export class ReportServices {
  constructor(
    private readonly reportService: ReportService,
    private readonly botService: BotService,
  ) {}

  @OnEvent(Events.ChannelMessage)
  async handleCommand(
    message: ChannelMessage,
  ): Promise<ChannelMessageContent | null> {
    if (message.sender_id === this.botService.getBotId()) {
      return null;
    }

    const parsed = this.extractAndParseCommand(message);
    if (!parsed) {
      return null;
    }

    let finalResult: ChannelMessageContent | null = null;

    const replyMessage = await this.botService.sendChannelMessage({
      type: 'channel',
      payload: {
        channel_id: message.channel_id,
        message: {
          type: 'system',
          content: 'Processing your weekly report request...',
        },
      },
      reply_to_message_id: message.id,
    });
    if(parsed.commandName.startsWith('*weeklyreport')) {
      switch (parsed.commandName) {
        case '*weeklyreport':
        //   replyMessage;
          finalResult = await this.reportService.handleWeeklyReport(parsed.time);
          break;
        default:
          return null;
      }
    }
    else return null;

    // if (finalResult) {
    //   await this.botService.updateMessage({
    //     channel_id: message.channel_id,
    //     message_id: replyMessage.message_id,
    //     content: {
    //       type: 'system',
    //       content: finalResult.t || 'Weekly report generated successfully!',
    //     },
    //   });
    // } else {
    //   await this.botService.updateMessage({
    //     channel_id: message.channel_id,
    //     message_id: replyMessage.message_id,
    //     content: {
    //       type: 'system',
    //       content: 'Failed to generate the weekly report.',
    //     },
    //   });
    // }

    return finalResult;
  }

  //extract and valid command
  private extractAndParseCommand(message: ChannelMessage): {
    commandName: string;
    time: Date;
  } | null {
    const text = message?.content?.t;
    if (!text || typeof text !== 'string') {
      return null;
    }
    try {
      return this.reportService.parseCommand(text);
    } catch (e) {
      return null;
    }
  }
}
