import { Module } from "@nestjs/common";
import { CommonModule } from "../common/common.module";
import { RealtimeModule } from "../realtime/realtime.module";
import { TicketsController } from "./tickets.controller";
import { TicketsService } from "./tickets.service";

@Module({
  imports: [CommonModule, RealtimeModule],
  controllers: [TicketsController],
  providers: [TicketsService],
})
export class TicketsModule {}
