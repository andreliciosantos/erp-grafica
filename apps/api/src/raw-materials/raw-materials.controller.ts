import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
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

@Controller('raw-materials')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RawMaterialsController {
  constructor(private readonly rawMaterialsService: RawMaterialsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.COMMERCIAL)
  create(@Body() dto: CreateRawMaterialDto): Promise<RawMaterial> {
    return this.rawMaterialsService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.FINANCIAL, Role.OPERATOR)
  findAll(
    @Query('category') category?: RawMaterialCategory,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
  ): Promise<PaginatedRawMaterialsResponse> {
    return this.rawMaterialsService.findAll(category, page, limit);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.FINANCIAL, Role.OPERATOR)
  findOne(@Param('id') id: string): Promise<RawMaterialWithMovements> {
    return this.rawMaterialsService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.COMMERCIAL)
  update(@Param('id') id: string, @Body() dto: UpdateRawMaterialDto): Promise<RawMaterial> {
    return this.rawMaterialsService.update(id, dto);
  }
}
