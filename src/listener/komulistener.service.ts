import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ChannelMessage, Events } from 'mezon-sdk';
import { PrismaService } from '../prisma/prisma.service';

interface UserInfo {
    message_id: string;
    sender_id: string;
    member: string;
    channel_id: string;
    clan_id: string;
}

interface DailyNoteParsed {
    message_id: string;
    update_time: Date;
    project_name?: string;
    working_type?: string;
    is_daily_late?: boolean;
    date?: string;
    yesterday?: string;
    today?: string;
    block?: string;
    working_time?: number;
}


@Injectable()
export class KomuListenerService {
  constructor(private readonly prisma: PrismaService) {}

  async parseUserInfor(message: ChannelMessage): Promise<UserInfo | null> {
    if (message.references && message.references.length > 0) {
      const sender_id = message.references[0].message_sender_id || '';
      const member = message.references[0].message_sender_username || '';

      const result: UserInfo = { 
        message_id: message.message_id || '', 
        sender_id, 
        member, 
        channel_id: message.channel_id, 
        clan_id: message.clan_id || '' 
    };
      return result;
    }

    return null;
  }

  async parseDailyNote(message: ChannelMessage): Promise<DailyNoteParsed | null> {
    if (!message.content?.t) return null;

    const lines = message.content.t.split('\n').map(l => l.trim());
    const result: DailyNoteParsed = {
      message_id: message.message_id || '',
      update_time: new Date(message.update_time || new Date()),
      working_type: message.code === 0 ? 'testing' : 'coding',  
    };

    for (const line of lines) {
        if (line.startsWith('Date:')) result.date = line.replace('Date:', '').trim();
        if (line.startsWith('Yesterday:')) result.yesterday = line.replace('Yesterday:', '').trim();
        if (line.startsWith('Today:')) result.today = line.replace('Today:', '').trim();
        if (line.startsWith('Block:')) result.block = line.replace('Block:', '').trim();
        if (line.startsWith('Working time:')){
            const raw = line.replace('Working time:', '').trim();
            result.working_time = parseFloat(raw.replace('h', ''));
        }

    }

    return result;
  }

  async upsertDailyNote(message: ChannelMessage) {
    const userInfo = await this.parseUserInfor(message);
    const dailyNote = await this.parseDailyNote(message);
    if (userInfo) {
        return this.prisma.daily_notes.create({
            data: {
                message_id: userInfo.message_id,
                sender_id: userInfo.sender_id,
                member: userInfo.member,
                create_time: new Date(),
                channel_id: userInfo.channel_id,
                clan_id: userInfo.clan_id,
            },
        });
    }
    if (dailyNote) {
        return this.prisma.daily_notes.update({
            where: { message_id: dailyNote.message_id },
            data: {
                update_time: dailyNote.update_time,
                project_name: dailyNote.project_name,
                work_type: dailyNote.working_type,
                is_daily_late: dailyNote.is_daily_late,
                date: dailyNote.date ? new Date(dailyNote.date) : undefined,
                yesterday: dailyNote.yesterday,
                today: dailyNote.today,
                block: dailyNote.block,
                working_time: dailyNote.working_time,
            },
        });
    }
    console.log('insert or update to db done');
    return null;
  }
}
