import { Module } from '@nestjs/common';
import { ReportsCommand } from './reports.command';
import { ReportService } from './reports.service';
import { BotModule } from '../bot/bot.module';

@Module({
  imports: [BotModule],
  providers: [ReportService, ReportsCommand],
  exports: [ReportsCommand],
})
export class ReportsModule {}
