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
import { RawMaterial } from '@erp/database';
import {
  RawMaterialsService,
  PaginatedRawMaterialsResponse,
  RawMaterialWithMovements,
} from './raw-materials.service';
import { CreateRawMaterialDto } from './dto/create-raw-material.dto';
import { UpdateRawMaterialDto } from './dto/update-raw-material.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RawMaterialCategory, Role } from '@erp/shared-types';

@ApiTags('Matéria-Prima e Insumos')
@ApiBearerAuth('JWT-auth')
@Controller('raw-materials')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RawMaterialsController {
  constructor(private readonly rawMaterialsService: RawMaterialsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.COMMERCIAL)
  @ApiOperation({
    summary: 'Cadastrar novo insumo gráfico / matéria-prima',
    description: 'Cadastra papéis, chapas, tintas ou insumos de acabamento com especificações de formato (L x A mm), gramatura, custo unitário e estoque mínimo.',
  })
  @ApiResponse({ status: 201, description: 'Matéria-prima cadastrada com sucesso.' })
  @ApiBadRequestResponse({ description: 'Dados inválidos ou código de material já existente.' })
  @ApiForbiddenResponse({ description: 'Acesso negado para o perfil do usuário.' })
  create(@Body() dto: CreateRawMaterialDto): Promise<RawMaterial> {
    return this.rawMaterialsService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.FINANCIAL, Role.OPERATOR)
  @ApiOperation({
    summary: 'Listar matérias-primas e insumos com filtro por categoria',
    description: 'Retorna a listagem de insumos em estoque, permitindo filtrar por PAPER, VINYL, INK, PLATE, FINISHING, CONSUMABLE.',
  })
  @ApiQuery({ name: 'category', required: false, enum: RawMaterialCategory, description: 'Filtrar por categoria gráfica' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50, description: 'Itens por página' })
  @ApiResponse({ status: 200, description: 'Lista de insumos retornada com sucesso.' })
  findAll(
    @Query('category') category?: RawMaterialCategory,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
  ): Promise<PaginatedRawMaterialsResponse> {
    return this.rawMaterialsService.findAll(category, page, limit);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.FINANCIAL, Role.OPERATOR)
  @ApiOperation({
    summary: 'Buscar insumo com histórico de movimentações',
    description: 'Retorna os detalhes do insumo acompanhado de suas movimentações de estoque (entradas e baixas por OS).',
  })
  @ApiParam({ name: 'id', description: 'ID único do insumo (CUID)' })
  @ApiResponse({ status: 200, description: 'Insumo encontrado com movimentações.' })
  @ApiNotFoundResponse({ description: 'Insumo não encontrado.' })
  findOne(@Param('id') id: string): Promise<RawMaterialWithMovements> {
    return this.rawMaterialsService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.COMMERCIAL)
  @ApiOperation({
    summary: 'Atualizar dados de um insumo ou custo unitário',
    description: 'Permite atualizar dimensões, gramatura, estoque mínimo ou valor de custo de reposição da matéria-prima.',
  })
  @ApiParam({ name: 'id', description: 'ID único do insumo (CUID)' })
  @ApiResponse({ status: 200, description: 'Insumo atualizado com sucesso.' })
  @ApiNotFoundResponse({ description: 'Insumo não encontrado.' })
  update(@Param('id') id: string, @Body() dto: UpdateRawMaterialDto): Promise<RawMaterial> {
    return this.rawMaterialsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Excluir insumo do catálogo',
    description: 'Remove o insumo caso não haja movimentações ou itens de ordem de serviço vinculados.',
  })
  @ApiParam({ name: 'id', description: 'ID único do insumo (CUID)' })
  @ApiResponse({ status: 200, description: 'Insumo removido com sucesso.' })
  @ApiNotFoundResponse({ description: 'Insumo não encontrado.' })
  @ApiForbiddenResponse({ description: 'Acesso negado (apenas ADMIN).' })
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.rawMaterialsService.remove(id);
  }
}
