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
import { Party } from '@erp/database';
import { PartiesService, PaginatedPartiesResponse } from './parties.service';
import { CreatePartyDto } from './dto/create-party.dto';
import { UpdatePartyDto } from './dto/update-party.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@erp/shared-types';

@Controller('parties')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PartiesController {
  constructor(private readonly partiesService: PartiesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.OPERATOR)
  create(@Body() dto: CreatePartyDto): Promise<Party> {
    return this.partiesService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.FINANCIAL, Role.OPERATOR)
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ): Promise<PaginatedPartiesResponse> {
    return this.partiesService.findAll(page, limit, search);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.FINANCIAL, Role.OPERATOR)
  findOne(@Param('id') id: string): Promise<Party> {
    return this.partiesService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.COMMERCIAL)
  update(@Param('id') id: string, @Body() dto: UpdatePartyDto): Promise<Party> {
    return this.partiesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.COMMERCIAL)
  remove(@Param('id') id: string): Promise<Party> {
    return this.partiesService.remove(id);
  }
}
