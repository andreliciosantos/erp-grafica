import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReceivablesService } from './receivables.service';
import { CreateReceivableDto } from './dto/create-receivable.dto';
import { UpdateReceivableDto } from './dto/update-receivable.dto';
import { PayReceivableDto } from './dto/pay-receivable.dto';
import { GenerateOrderInstallmentsDto } from './dto/generate-order-installments.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentStatus } from '@erp/shared-types';

@Controller('receivables')
@UseGuards(JwtAuthGuard)
export class ReceivablesController {
  constructor(private readonly receivablesService: ReceivablesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateReceivableDto) {
    return this.receivablesService.create(dto);
  }

  @Post('generate-for-order')
  @HttpCode(HttpStatus.CREATED)
  generateForOrder(@Body() dto: GenerateOrderInstallmentsDto) {
    return this.receivablesService.generateForOrder(dto);
  }

  @Get('summary')
  getSummary(@Query('month') month?: string) {
    return this.receivablesService.getSummary(month);
  }

  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: PaymentStatus,
    @Query('partyId') partyId?: string,
    @Query('workOrderId') workOrderId?: string,
    @Query('month') month?: string,
    @Query('search') search?: string,
  ) {
    return this.receivablesService.findAll({
      page,
      limit,
      status,
      partyId,
      workOrderId,
      month,
      search,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.receivablesService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateReceivableDto) {
    return this.receivablesService.update(id, dto);
  }

  @Patch(':id/pay')
  pay(@Param('id') id: string, @Body() dto: PayReceivableDto) {
    return this.receivablesService.pay(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.receivablesService.remove(id);
  }
}
