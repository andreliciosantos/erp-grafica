import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { WorkOrder } from '@erp/database';
import {
  QuotesService,
  QuoteWithDetails,
  PaginatedQuotesResponse,
} from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { QuoteStatus, Role } from '@erp/shared-types';

@Controller('quotes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.COMMERCIAL)
  create(
    @Body() dto: CreateQuoteDto,
    @CurrentUser() user: { id: string },
  ): Promise<QuoteWithDetails> {
    return this.quotesService.create(dto, user.id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.FINANCIAL)
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: QuoteStatus,
  ): Promise<PaginatedQuotesResponse> {
    return this.quotesService.findAll(page, limit, status);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.FINANCIAL, Role.OPERATOR)
  findOne(@Param('id') id: string): Promise<QuoteWithDetails> {
    return this.quotesService.findOne(id);
  }

  @Post(':id/approve')
  @Roles(Role.ADMIN, Role.COMMERCIAL)
  approve(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ): Promise<WorkOrder> {
    return this.quotesService.approve(id, user.id);
  }
}
