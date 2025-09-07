import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BotModule } from './bot/bot.module';
import * as Joi from 'joi';
import { ConfigModule } from '@nestjs/config';
import { KomuListener } from './listener/komulistener';
import { PrismaModule } from './prisma/prisma.module';
import { KomuListenerService } from './listener/komulistener.service';
import { ReportsModule } from './report/reports.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    BotModule,
    AiModule,
    PrismaModule,
    ReportsModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MEZON_TOKEN: Joi.string().required(),
        DATABASE_URL: Joi.string().required(),
      }),
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    KomuListener, 
    KomuListenerService
  ],
})
export class AppModule {}
