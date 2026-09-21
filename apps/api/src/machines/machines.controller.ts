import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseBoolPipe,
} from '@nestjs/common';
import { Machine } from '@erp/database';
import { MachinesService } from './machines.service';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@erp/shared-types';

@Controller('machines')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateMachineDto): Promise<Machine> {
    return this.machinesService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.FINANCIAL, Role.OPERATOR)
  findAll(
    @Query('activeOnly', new ParseBoolPipe({ optional: true })) activeOnly?: boolean,
  ): Promise<Machine[]> {
    return this.machinesService.findAll(activeOnly);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.FINANCIAL, Role.OPERATOR)
  findOne(@Param('id') id: string): Promise<Machine> {
    return this.machinesService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateMachineDto): Promise<Machine> {
    return this.machinesService.update(id, dto);
  }
}
