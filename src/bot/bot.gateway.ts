import { Injectable, Logger, Inject } from '@nestjs/common';

import {
  MezonClient,
  Events,
  ChannelMessage,
} from 'mezon-sdk';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class BotGateway {
  private readonly logger = new Logger(BotGateway.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    @Inject('MEZON') private readonly client: MezonClient,
  ) {}

  async initEvent() {
    this.logger.log('Initializing Mezon bot events...');
    
    // Register event listeners using official mezon-sdk methods
    await this.client.onChannelMessage(this.handlechannelmessage);
    
    this.logger.log('Mezon bot events initialized successfully');
  }
  /* cspell:words handlechannelmessage */
  handlechannelmessage = async (msg: ChannelMessage) => {
    // Keep events minimal; downstream listeners will filter further
    ['attachments', 'mentions', 'references'].forEach((key) => {
      if (!Array.isArray(msg[key])) msg[key] = [];
    });
    this.eventEmitter.emit(Events.ChannelMessage, msg);
  };
}