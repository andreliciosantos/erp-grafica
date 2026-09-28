import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { PaymentConditionsService } from './payment-conditions.service';
import { CreatePaymentConditionDto } from './dto/create-payment-condition.dto';
import { UpdatePaymentConditionDto } from './dto/update-payment-condition.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@erp/shared-types';

@ApiTags('Condições de Pagamento / Parcelamento')
@ApiBearerAuth('JWT-auth')
@Controller('payment-conditions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentConditionsController {
  constructor(private readonly service: PaymentConditionsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.FINANCIAL, Role.OPERATOR)
  @ApiOperation({ summary: 'Listar condições de pagamento / parcelamento padrão' })
  @ApiResponse({ status: 200, description: 'Lista de condições retornada com sucesso.' })
  findAll(@Query('all') all?: string) {
    const activeOnly = all !== 'true';
    return this.service.findAll(activeOnly);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.FINANCIAL, Role.OPERATOR)
  @ApiOperation({ summary: 'Consultar detalhe da condição de pagamento' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.FINANCIAL)
  @ApiOperation({ summary: 'Cadastrar nova condição de pagamento ou parcelamento padrão' })
  create(@Body() dto: CreatePaymentConditionDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.FINANCIAL)
  @ApiOperation({ summary: 'Atualizar condição de pagamento' })
  update(@Param('id') id: string, @Body() dto: UpdatePaymentConditionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.FINANCIAL)
  @ApiOperation({ summary: 'Excluir condição de pagamento' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
