import { Injectable, Inject } from '@nestjs/common';
import {
  MezonClient,
  ChannelMessageContent,
  EMarkdownType,
  ApiMessageAttachment,
  ChannelMessageAck,
} from 'mezon-sdk';
import { MezonSendMessage, MezonUpdateMessage } from './type/mezon';

@Injectable()
export class BotService {
  constructor(@Inject('MEZON') private readonly mezonClient: MezonClient) {}

  getClient() {
    return this.mezonClient;
  }

  getBotId() {
    return this.mezonClient.clientId;
  }

  async sendChannelMessage(data: MezonSendMessage) {
    // verify message type
    let sendFunction: any;
    if (data.type === 'channel') {
      let root: any;
      if (data.clan_id) {
        const clan = await this.mezonClient.clans.fetch(data.clan_id);
        if (!clan?.id) {
          throw new Error(`Clan ${data.clan_id} not found`);
        }
        root = clan;
      } else {
        root = this.mezonClient;
      }

      // validate channel_id
      const channel = await root.channels.fetch(data.payload.channel_id);
      if (!channel?.id) {
        throw new Error(`Channel ${data.payload.channel_id} not found`);
      }

      sendFunction = channel.send.bind(channel);

      if (data.reply_to_message_id) {
        const message = await channel.messages.fetch(data.reply_to_message_id);
        if (!message?.id) {
          console.log(message);
          throw new Error(
            `Message ${data.reply_to_message_id} not found in channel ${data.payload.channel_id}`,
          );
        }
        sendFunction = message.reply.bind(message);
      }
    } else if (data.type === 'dm') {
      const clan = await this.mezonClient.clans.fetch(data.payload.clan_id);
      if (!clan?.id) {
        throw new Error(`Clan ${data.payload.clan_id} not found`);
      }

      const user = await clan.users.fetch(data.payload.user_id);
      if (!user?.id) {
        throw new Error(
          `User ${data.payload.user_id} not found in clan ${data.payload.clan_id}`,
        );
      }
      sendFunction = user.sendDM.bind(user);
    }
    let newMessage: ChannelMessageContent;

    if (data.payload.message.type === 'optional') {
      newMessage = data.payload.message.content;
    } else {
      newMessage = {
        t: data.payload.message.content,
        mk:
          data.payload.message.type === 'normal_text'
            ? []
            : [
                {
                  type: EMarkdownType.PRE,
                  s: 0,
                  e: data.payload.message.content.length,
                },
              ],
      };
    }

    const args: any[] = [newMessage];
    if (data.payload.images && Array.isArray(data.payload.images)) {
      const attachments: ApiMessageAttachment[] = [];
      for (const image of data.payload.images) {
        if (typeof image === 'string') {
          attachments.push({
            url: image,
            filename: 'image.png',
            width: 200,
            height: 200,
          });
        } else {
          attachments.push(image);
        }
      }
      args[2] = attachments;
    }

    switch (data.payload.message.type) {
      case 'normal_text':
        return (await sendFunction(...args)) as ChannelMessageAck;

      case 'optional':
        return (await sendFunction(newMessage)) as ChannelMessageAck;

      case 'system':
        return (await sendFunction({
          ...newMessage,
          mk: [
            {
              type: 'pre',
              s: 0,
              e: data.payload.message.content.length,
            },
          ],
          attachments: args[2] || [],
        })) as ChannelMessageAck;
    }
  }

  async updateMessage(data: MezonUpdateMessage) {
    let root: any;
    if (data.clan_id) {
      const clan = await this.mezonClient.clans.fetch(data.clan_id);
      root = clan;
    } else {
      root = this.mezonClient;
    }
    const channel = await root.channels.fetch(data.channel_id);
    const message = await channel.messages.fetch(data.message_id);
    if (data.content.type === 'normal_text') {
      return message.update({
        t: data.content.content,
      });
    } else if (data.content.type === 'system') {
      return message.update({
        t: data.content.content,
        mk: [
          {
            type: EMarkdownType.PRE,
            s: 0,
            e: data.content.content.length,
          },
        ],
      });
    } else if (data.content.type === 'optional') {
      return message.update(data.content.content);
    }
  }
}
