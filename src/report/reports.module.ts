import { Module } from '@nestjs/common';
import { ReportServices } from './reports.command';
import { ReportService } from './reports.service';
import { BotModule } from '../bot/bot.module';

@Module({
  imports: [BotModule],
  providers: [ReportService, ReportServices],
  exports: [ReportServices],
})
export class ReportsModule {}
