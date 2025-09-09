import { Module } from '@nestjs/common';
import { ReportsCommand } from './reports.command';
import { ReportService } from './reports.service';
import { ReportsRepository } from './reports.repository';
import { BotModule } from '../bot/bot.module';
import { AiModule } from '../ai/ai.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [BotModule, AiModule, PrismaModule],
  providers: [ReportService, ReportsCommand, ReportsRepository],
  exports: [ReportsCommand],
})
export class ReportsModule {}
