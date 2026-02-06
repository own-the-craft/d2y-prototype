import { ApiProperty } from "@nestjs/swagger";
import { SlotType } from "@prisma/client";
import { IsEnum, Matches } from "class-validator";

export class GetSlotsDto {
  @ApiProperty({ example: "2026-02-06" })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string;

  @ApiProperty({ enum: SlotType, example: "DELIVERY" })
  @IsEnum(SlotType)
  type!: SlotType;
}
