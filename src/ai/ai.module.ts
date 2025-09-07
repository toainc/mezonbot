import { AiService } from "./ai.service";
import { Module } from "@nestjs/common";

@Module({
  providers: [AiService],
  exports: [AiService]
})
export class AiModule {}
