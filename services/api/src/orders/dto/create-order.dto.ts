import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

class CreateOrderItemDto {
  @ApiProperty()
  @IsString()
  productId!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  qty!: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: "bakery-one" })
  @IsString()
  merchantId!: string;

  @ApiProperty()
  @IsString()
  slotId!: string;

  @ApiProperty({ example: { line1: "Damrak 1", postalCode: "1012LG", city: "Amsterdam", country: "NL" } })
  @IsObject()
  address!: Record<string, any>;

  @ApiProperty({ required: false, example: "Bel even aan" })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
