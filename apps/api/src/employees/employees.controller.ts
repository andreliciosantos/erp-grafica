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
  ParseIntPipe,
  DefaultValuePipe,
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
import { Employee, EmployeeDepartment, EmployeeStatus } from '@erp/database';
import {
  EmployeesService,
  PaginatedEmployeesResponse,
  EmployeeStatsResponse,
} from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@erp/shared-types';

@ApiTags('Colaboradores e RH')
@ApiBearerAuth('JWT-auth')
@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Cadastrar novo colaborador / funcionário',
    description: 'Cadastra um membro da equipe gráfica com cargo, departamento fabril, turno de trabalho, salário mensal e valor da hora/homem para apropriação de custos.',
  })
  @ApiResponse({ status: 201, description: 'Colaborador cadastrado com sucesso.' })
  @ApiBadRequestResponse({ description: 'Dados cadastrais inválidos ou CPF duplicado.' })
  @ApiForbiddenResponse({ description: 'Acesso restrito ao perfil ADMIN.' })
  create(@Body() dto: CreateEmployeeDto): Promise<Employee> {
    return this.employeesService.create(dto);
  }

  @Get('stats')
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.FINANCIAL, Role.OPERATOR)
  @ApiOperation({
    summary: 'Consultar estatísticas e indicadores de RH',
    description: 'Retorna total de funcionários ativos, custo mensal total de folha de pagamento e distribuição da equipe por departamento fabril.',
  })
  @ApiResponse({ status: 200, description: 'Estatísticas consolidadas de RH.' })
  getStats(): Promise<EmployeeStatsResponse> {
    return this.employeesService.getStats();
  }

  @Get()
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.FINANCIAL, Role.OPERATOR)
  @ApiOperation({
    summary: 'Listar colaboradores com busca e filtros',
    description: 'Permite buscar por nome, cargo ou CPF e filtrar por departamento (PRE_PRESS, PRINTING, FINISHING, QUALITY, etc.) ou status (ACTIVE, ON_LEAVE, INACTIVE).',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20, description: 'Itens por página' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Busca por nome, documento ou cargo' })
  @ApiQuery({ name: 'department', required: false, enum: EmployeeDepartment, description: 'Departamento fabril ou administrativo' })
  @ApiQuery({ name: 'status', required: false, enum: EmployeeStatus, description: 'Status funcional' })
  @ApiResponse({ status: 200, description: 'Lista paginada de colaboradores.' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('department') department?: EmployeeDepartment,
    @Query('status') status?: EmployeeStatus,
  ): Promise<PaginatedEmployeesResponse> {
    return this.employeesService.findAll(page, limit, search, department, status);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.FINANCIAL, Role.OPERATOR)
  @ApiOperation({
    summary: 'Buscar detalhes de um colaborador',
    description: 'Retorna a ficha cadastral do colaborador, remuneração, turno e histórico.',
  })
  @ApiParam({ name: 'id', description: 'ID único do colaborador (CUID)' })
  @ApiResponse({ status: 200, description: 'Colaborador encontrado.' })
  @ApiNotFoundResponse({ description: 'Colaborador não encontrado.' })
  findOne(@Param('id') id: string): Promise<Employee> {
    return this.employeesService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Atualizar cadastro de colaborador',
    description: 'Permite atualizar cargo, turno, salário, valor/hora ou status funcional do empregado.',
  })
  @ApiParam({ name: 'id', description: 'ID único do colaborador (CUID)' })
  @ApiResponse({ status: 200, description: 'Colaborador atualizado com sucesso.' })
  @ApiNotFoundResponse({ description: 'Colaborador não encontrado.' })
  @ApiForbiddenResponse({ description: 'Acesso restrito ao perfil ADMIN.' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
  ): Promise<Employee> {
    return this.employeesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Excluir colaborador',
    description: 'Remove o cadastro caso o funcionário não tenha histórico de apontamentos em etapas de produção.',
  })
  @ApiParam({ name: 'id', description: 'ID único do colaborador (CUID)' })
  @ApiResponse({ status: 200, description: 'Colaborador removido com sucesso.' })
  @ApiNotFoundResponse({ description: 'Colaborador não encontrado.' })
  @ApiForbiddenResponse({ description: 'Acesso restrito ao perfil ADMIN.' })
  remove(@Param('id') id: string): Promise<Employee> {
    return this.employeesService.remove(id);
  }
}
