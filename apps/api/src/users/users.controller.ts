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
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { UsersService, UserSummary, PaginatedUsersResponse } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@erp/shared-types';

@ApiTags('Usuários')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar novo usuário no sistema',
    description: 'Permite que administradores cadastrem novos usuários com e-mail, senha e atribuição de perfil RBAC.',
  })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso.' })
  @ApiBadRequestResponse({ description: 'Dados inválidos ou e-mail já cadastrado.' })
  @ApiForbiddenResponse({ description: 'Acesso negado (apenas perfil ADMIN).' })
  create(@Body() dto: CreateUserDto): Promise<UserSummary> {
    return this.usersService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar usuários com paginação',
    description: 'Retorna a lista paginada de usuários cadastrados no ERP.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20, description: 'Quantidade por página' })
  @ApiResponse({ status: 200, description: 'Lista paginada de usuários.' })
  @ApiForbiddenResponse({ description: 'Acesso negado (apenas perfil ADMIN).' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<PaginatedUsersResponse> {
    return this.usersService.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar detalhes de um usuário',
    description: 'Retorna os dados do usuário especificado pelo ID.',
  })
  @ApiParam({ name: 'id', description: 'ID único do usuário' })
  @ApiResponse({ status: 200, description: 'Usuário encontrado.' })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  @ApiForbiddenResponse({ description: 'Acesso negado (apenas perfil ADMIN).' })
  findOne(@Param('id') id: string): Promise<UserSummary> {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Atualizar dados de um usuário',
    description: 'Atualiza informações do usuário (nome, e-mail, perfil ou status ativo/inativo).',
  })
  @ApiParam({ name: 'id', description: 'ID único do usuário' })
  @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso.' })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  @ApiForbiddenResponse({ description: 'Acesso negado (apenas perfil ADMIN).' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto): Promise<UserSummary> {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Excluir usuário',
    description: 'Remove o usuário do sistema (com validação para evitar auto-exclusão do admin principal).',
  })
  @ApiParam({ name: 'id', description: 'ID único do usuário' })
  @ApiResponse({ status: 200, description: 'Usuário removido com sucesso.' })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  @ApiForbiddenResponse({ description: 'Acesso negado (apenas perfil ADMIN).' })
  remove(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    return this.usersService.remove(id);
  }
}
