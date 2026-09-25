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
import { Party } from '@erp/database';
import { PartiesService, PaginatedPartiesResponse } from './parties.service';
import { CreatePartyDto } from './dto/create-party.dto';
import { UpdatePartyDto } from './dto/update-party.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@erp/shared-types';

@ApiTags('Clientes e Fornecedores')
@ApiBearerAuth('JWT-auth')
@Controller('parties')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PartiesController {
  constructor(private readonly partiesService: PartiesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.OPERATOR)
  @ApiOperation({
    summary: 'Cadastrar novo cliente ou fornecedor',
    description: 'Cadastra um parceiro comercial (Pessoa Física ou Jurídica) com validação de CPF/CNPJ, contatos e endereço.',
  })
  @ApiResponse({ status: 201, description: 'Parceiro comercial cadastrado com sucesso.' })
  @ApiBadRequestResponse({ description: 'Dados inválidos ou documento duplicado.' })
  @ApiForbiddenResponse({ description: 'Acesso negado para o perfil do usuário.' })
  create(@Body() dto: CreatePartyDto): Promise<Party> {
    return this.partiesService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.FINANCIAL, Role.OPERATOR)
  @ApiOperation({
    summary: 'Listar clientes e fornecedores com busca e paginação',
    description: 'Retorna parceiros comerciais cadastrados com filtro opcional por nome, razão social ou documento.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20, description: 'Itens por página' })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'Gráfica', description: 'Termo de busca (nome, razão ou CPF/CNPJ)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de parceiros retornada com sucesso.' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ): Promise<PaginatedPartiesResponse> {
    return this.partiesService.findAll(page, limit, search);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.FINANCIAL, Role.OPERATOR)
  @ApiOperation({
    summary: 'Buscar detalhes de um cliente/fornecedor',
    description: 'Retorna a ficha completa do parceiro comercial especificado pelo ID.',
  })
  @ApiParam({ name: 'id', description: 'ID único do parceiro (CUID)' })
  @ApiResponse({ status: 200, description: 'Parceiro comercial encontrado.' })
  @ApiNotFoundResponse({ description: 'Parceiro não encontrado.' })
  findOne(@Param('id') id: string): Promise<Party> {
    return this.partiesService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.COMMERCIAL)
  @ApiOperation({
    summary: 'Atualizar dados de um cliente/fornecedor',
    description: 'Atualiza dados cadastrais, e-mail, telefone e endereço do parceiro.',
  })
  @ApiParam({ name: 'id', description: 'ID único do parceiro (CUID)' })
  @ApiResponse({ status: 200, description: 'Parceiro atualizado com sucesso.' })
  @ApiNotFoundResponse({ description: 'Parceiro não encontrado.' })
  @ApiForbiddenResponse({ description: 'Acesso negado para o perfil do usuário.' })
  update(@Param('id') id: string, @Body() dto: UpdatePartyDto): Promise<Party> {
    return this.partiesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.COMMERCIAL)
  @ApiOperation({
    summary: 'Excluir parceiro comercial',
    description: 'Remove o parceiro comercial caso não possua orçamentos ou ordens de serviço vinculadas.',
  })
  @ApiParam({ name: 'id', description: 'ID único do parceiro (CUID)' })
  @ApiResponse({ status: 200, description: 'Parceiro removido com sucesso.' })
  @ApiNotFoundResponse({ description: 'Parceiro não encontrado.' })
  @ApiBadRequestResponse({ description: 'Não é possível excluir parceiro com histórico de pedidos.' })
  remove(@Param('id') id: string): Promise<Party> {
    return this.partiesService.remove(id);
  }
}
