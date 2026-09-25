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
  ParseBoolPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { Machine } from '@erp/database';
import { MachinesService } from './machines.service';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@erp/shared-types';

@ApiTags('Máquinas e Equipamentos')
@ApiBearerAuth('JWT-auth')
@Controller('machines')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Cadastrar nova máquina ou equipamento gráfico',
    description: 'Cadastra impressoras (Offset, Digital), guilhotinas, dobradeiras ou plotters com custo/hora, tempo de setup e velocidade por hora.',
  })
  @ApiResponse({ status: 201, description: 'Máquina cadastrada com sucesso.' })
  @ApiBadRequestResponse({ description: 'Dados cadastrais da máquina inválidos.' })
  @ApiForbiddenResponse({ description: 'Acesso restrito ao perfil ADMIN.' })
  create(@Body() dto: CreateMachineDto): Promise<Machine> {
    return this.machinesService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.FINANCIAL, Role.OPERATOR)
  @ApiOperation({
    summary: 'Listar equipamentos do parque fabril',
    description: 'Retorna a lista de máquinas cadastradas, permitindo filtrar apenas equipamentos ativos em operação.',
  })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean, example: true, description: 'Filtrar apenas máquinas ativas' })
  @ApiResponse({ status: 200, description: 'Lista de máquinas retornada com sucesso.' })
  findAll(
    @Query('activeOnly', new ParseBoolPipe({ optional: true })) activeOnly?: boolean,
  ): Promise<Machine[]> {
    return this.machinesService.findAll(activeOnly);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.FINANCIAL, Role.OPERATOR)
  @ApiOperation({
    summary: 'Consultar ficha de uma máquina',
    description: 'Retorna os parâmetros de operação, custo hora e velocidade do equipamento especificado.',
  })
  @ApiParam({ name: 'id', description: 'ID único da máquina (CUID)' })
  @ApiResponse({ status: 200, description: 'Máquina encontrada.' })
  @ApiNotFoundResponse({ description: 'Máquina não encontrada.' })
  findOne(@Param('id') id: string): Promise<Machine> {
    return this.machinesService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Atualizar parâmetros operacionais ou custos da máquina',
    description: 'Atualiza custo/hora, tempo de acerto (setup), velocidade nominal ou status ativo/inativo.',
  })
  @ApiParam({ name: 'id', description: 'ID único da máquina (CUID)' })
  @ApiResponse({ status: 200, description: 'Máquina atualizada com sucesso.' })
  @ApiNotFoundResponse({ description: 'Máquina não encontrada.' })
  @ApiForbiddenResponse({ description: 'Acesso restrito ao perfil ADMIN.' })
  update(@Param('id') id: string, @Body() dto: UpdateMachineDto): Promise<Machine> {
    return this.machinesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Desativar ou excluir máquina',
    description: 'Remove o registro da máquina caso não tenha sido utilizada em apontamentos de etapas de produção.',
  })
  @ApiParam({ name: 'id', description: 'ID único da máquina (CUID)' })
  @ApiResponse({ status: 200, description: 'Máquina removida com sucesso.' })
  @ApiNotFoundResponse({ description: 'Máquina não encontrada.' })
  @ApiForbiddenResponse({ description: 'Acesso restrito ao perfil ADMIN.' })
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.machinesService.remove(id);
  }
}
