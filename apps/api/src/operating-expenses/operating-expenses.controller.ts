import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  OperatingExpensesService,
  PaginatedExpensesResponse,
} from './operating-expenses.service';
import { CreateOperatingExpenseDto } from './dto/create-operating-expense.dto';
import { UpdateOperatingExpenseDto } from './dto/update-operating-expense.dto';
import { PayExpenseDto } from './dto/pay-expense.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  Role,
  ExpenseCategory,
  ExpenseType,
  PaymentStatus,
  OperatingExpenseItem,
  OperatingExpensesSummaryDto,
} from '@erp/shared-types';

@Controller('operating-expenses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OperatingExpensesController {
  constructor(
    private readonly operatingExpensesService: OperatingExpensesService,
  ) {}

  @Post()
  @Roles(Role.ADMIN, Role.FINANCIAL)
  create(@Body() dto: CreateOperatingExpenseDto): Promise<OperatingExpenseItem> {
    return this.operatingExpensesService.create(dto);
  }

  @Get('summary')
  @Roles(Role.ADMIN, Role.FINANCIAL, Role.COMMERCIAL)
  getSummary(
    @Query('competenceMonth') competenceMonth?: string,
  ): Promise<OperatingExpensesSummaryDto> {
    return this.operatingExpensesService.getSummary(competenceMonth);
  }

  @Get()
  @Roles(Role.ADMIN, Role.FINANCIAL, Role.COMMERCIAL)
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('competenceMonth') competenceMonth?: string,
    @Query('category') category?: ExpenseCategory,
    @Query('expenseType') expenseType?: ExpenseType,
    @Query('status') status?: PaymentStatus,
    @Query('search') search?: string,
  ): Promise<PaginatedExpensesResponse> {
    return this.operatingExpensesService.findAll(
      page,
      limit,
      competenceMonth,
      category,
      expenseType,
      status,
      search,
    );
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.FINANCIAL, Role.COMMERCIAL)
  findOne(@Param('id') id: string): Promise<OperatingExpenseItem> {
    return this.operatingExpensesService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.FINANCIAL)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOperatingExpenseDto,
  ): Promise<OperatingExpenseItem> {
    return this.operatingExpensesService.update(id, dto);
  }

  @Patch(':id/pay')
  @Roles(Role.ADMIN, Role.FINANCIAL)
  pay(
    @Param('id') id: string,
    @Body() dto: PayExpenseDto,
  ): Promise<OperatingExpenseItem> {
    return this.operatingExpensesService.pay(id, dto);
  }

  @Post(':id/duplicate')
  @Roles(Role.ADMIN, Role.FINANCIAL)
  duplicateNextMonth(@Param('id') id: string): Promise<OperatingExpenseItem> {
    return this.operatingExpensesService.duplicateNextMonth(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.FINANCIAL)
  remove(@Param('id') id: string): Promise<OperatingExpenseItem> {
    return this.operatingExpensesService.remove(id);
  }
}
