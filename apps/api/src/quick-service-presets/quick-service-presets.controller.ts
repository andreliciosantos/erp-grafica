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
import { QuickServicePresetsService } from './quick-service-presets.service';
import { CreateQuickServicePresetDto } from './dto/create-quick-service-preset.dto';
import { UpdateQuickServicePresetDto } from './dto/update-quick-service-preset.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@erp/shared-types';

@ApiTags('Modelos Prontos de Serviços Rápidos')
@ApiBearerAuth('JWT-auth')
@Controller('quick-service-presets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuickServicePresetsController {
  constructor(private readonly service: QuickServicePresetsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.FINANCIAL, Role.OPERATOR)
  @ApiOperation({ summary: 'Listar modelos prontos de serviços rápidos' })
  @ApiResponse({ status: 200, description: 'Lista de modelos retornada com sucesso.' })
  findAll(@Query('all') all?: string) {
    const activeOnly = all !== 'true';
    return this.service.findAll(activeOnly);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.FINANCIAL, Role.OPERATOR)
  @ApiOperation({ summary: 'Consultar detalhe do modelo pronto de serviço rápido' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.COMMERCIAL)
  @ApiOperation({ summary: 'Cadastrar novo modelo pronto de serviço rápido' })
  create(@Body() dto: CreateQuickServicePresetDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.COMMERCIAL)
  @ApiOperation({ summary: 'Atualizar modelo pronto de serviço rápido' })
  update(@Param('id') id: string, @Body() dto: UpdateQuickServicePresetDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.COMMERCIAL)
  @ApiOperation({ summary: 'Excluir modelo pronto de serviço rápido' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
