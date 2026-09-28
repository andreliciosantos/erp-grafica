import { PartialType } from '@nestjs/swagger';
import { CreatePaymentConditionDto } from './create-payment-condition.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePaymentConditionDto extends PartialType(CreatePaymentConditionDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
