import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class RefundDto {
  @ApiProperty({ required: false, example: 3250 })
  @IsOptional()
  @IsInt()
  @Min(1)
  amountCents?: number;

  @ApiProperty({ required: false, example: "Customer request" })
  @IsOptional()
  @IsString()
  reason?: string;
}
