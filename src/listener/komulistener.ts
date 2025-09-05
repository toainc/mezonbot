import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ChannelMessage, Events } from 'mezon-sdk';
import { KomuListenerService } from './komulistener.service';

@Injectable()
export class KomuListener {
  constructor(private readonly komuService: KomuListenerService) {}

  @OnEvent(Events.ChannelMessage)
  async handleChannelMessage(message: ChannelMessage) {
    const content = message.content?.t || '';
    const mk = message.content?.mk || '';
    let embed =  '';
    if (message.content?.embed && message.content?.embed.length > 0) {
      embed = message.content.embed[0].title || '';
    }
    
    if ( (content.includes('Daily saved.') || embed.includes('Daily On')) && message.username === 'KOMU') { 
      console.log('Received channel message:', message);
      await this.komuService.upsertDailyNote(message);
    }

  }
}