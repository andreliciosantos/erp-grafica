import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { FinancialService } from './financial.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('financial')
@UseGuards(JwtAuthGuard)
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Get('dre')
  getDre(
    @Query('month') month?: string,
    @Query('taxRate') taxRate?: number,
  ) {
    return this.financialService.getDre(
      month,
      taxRate ? Number(taxRate) : undefined,
    );
  }

  @Get('cash-flow')
  getCashFlow(@Query('month') month?: string) {
    return this.financialService.getCashFlow(month);
  }
}
