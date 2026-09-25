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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ProductTemplatesService } from './product-templates.service';
import { CreateProductTemplateDto } from './dto/create-product-template.dto';
import { UpdateProductTemplateDto } from './dto/update-product-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Modelos de Produtos')
@ApiBearerAuth('JWT-auth')
@Controller('product-templates')
@UseGuards(JwtAuthGuard)
export class ProductTemplatesController {
  constructor(private readonly service: ProductTemplatesService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar modelos de produtos gráficos pré-cadastrados',
    description: 'Retorna templates de produtos (ex: Cartão de Visita 9x5, Folder A4 4x4, Banner Lona 440g) para criação ágil de orçamentos.',
  })
  @ApiQuery({ name: 'category', required: false, type: String, example: 'EDITORIAL', description: 'Filtrar por categoria' })
  @ApiResponse({ status: 200, description: 'Lista de templates de produtos gráficos.' })
  findAll(@Query('category') category?: string) {
    return this.service.findAll(category);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar detalhes de um modelo de produto',
    description: 'Retorna medidas, opções padrão de acabamento e matéria-prima recomendada para o template.',
  })
  @ApiParam({ name: 'id', description: 'ID único do modelo de produto (CUID)' })
  @ApiResponse({ status: 200, description: 'Modelo de produto encontrado.' })
  @ApiNotFoundResponse({ description: 'Modelo não encontrado.' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Cadastrar novo gabarito / modelo de produto gráfico',
    description: 'Salva uma especificação padrão de produto com dimensões pré-fixadas e insumos padrões associados.',
  })
  @ApiResponse({ status: 201, description: 'Modelo de produto criado com sucesso.' })
  @ApiBadRequestResponse({ description: 'Parâmetros do modelo inválidos.' })
  create(@Body() dto: CreateProductTemplateDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Atualizar modelo de produto',
    description: 'Atualiza medidas, opções ou acabamentos vinculados ao gabarito.',
  })
  @ApiParam({ name: 'id', description: 'ID único do modelo de produto (CUID)' })
  @ApiResponse({ status: 200, description: 'Modelo atualizado com sucesso.' })
  @ApiNotFoundResponse({ description: 'Modelo não encontrado.' })
  update(@Param('id') id: string, @Body() dto: UpdateProductTemplateDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Excluir modelo de produto',
    description: 'Remove o gabarito do catálogo de produtos rápidos.',
  })
  @ApiParam({ name: 'id', description: 'ID único do modelo de produto (CUID)' })
  @ApiResponse({ status: 200, description: 'Modelo removido com sucesso.' })
  @ApiNotFoundResponse({ description: 'Modelo não encontrado.' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
