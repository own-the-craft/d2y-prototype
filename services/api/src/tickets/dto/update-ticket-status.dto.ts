import { ApiProperty } from "@nestjs/swagger";
import { TicketStatus } from "@prisma/client";
import { IsEnum } from "class-validator";

export class UpdateTicketStatusDto {
  @ApiProperty({ enum: TicketStatus, example: "IN_PROGRESS" })
  @IsEnum(TicketStatus)
  status!: TicketStatus;
}
