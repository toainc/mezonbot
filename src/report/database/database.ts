import { Injectable } from '@nestjs/common';
import { ChannelMessage } from 'mezon-sdk';
import { PrismaService } from '../../prisma/prisma.service';


@Injectable()
export class DatabaseService {
  constructor(
    private readonly prismaService: PrismaService,
  ) {}

  
}
