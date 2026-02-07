import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class CreateTicketDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiProperty({ example: "Problem with my order" })
  @IsString()
  subject!: string;

  @ApiProperty({ example: "Something went wrong..." })
  @IsString()
  message!: string;
}
