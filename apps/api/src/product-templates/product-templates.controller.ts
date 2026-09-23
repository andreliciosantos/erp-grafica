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
import { ProductTemplatesService } from './product-templates.service';
import { CreateProductTemplateDto } from './dto/create-product-template.dto';
import { UpdateProductTemplateDto } from './dto/update-product-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('product-templates')
@UseGuards(JwtAuthGuard)
export class ProductTemplatesController {
  constructor(private readonly service: ProductTemplatesService) {}

  @Get()
  findAll(@Query('category') category?: string) {
    return this.service.findAll(category);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateProductTemplateDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductTemplateDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
