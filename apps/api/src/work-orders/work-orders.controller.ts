import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { WorkOrder, StageExecutionLog } from '@erp/database';
import {
  WorkOrdersService,
  PaginatedWorkOrdersResponse,
  WorkOrderFullDetails,
} from './work-orders.service';
import { UpdateWorkOrderStatusDto } from './dto/update-status.dto';
import { StageActionDto } from './dto/stage-action.dto';
import { CreateDirectOrderDto } from './dto/create-direct-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WorkOrderStatus, Role } from '@erp/shared-types';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Get('work-orders')
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.FINANCIAL, Role.OPERATOR)
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: WorkOrderStatus,
    @Query('search') search?: string,
  ): Promise<PaginatedWorkOrdersResponse> {
    return this.workOrdersService.findAll(page, limit, status, search);
  }

  @Post('work-orders')
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.OPERATOR)
  createDirect(
    @Body() dto: CreateDirectOrderDto,
    @CurrentUser() user: { id: string },
  ): Promise<WorkOrder> {
    return this.workOrdersService.createDirect(dto, user.id);
  }

  @Get('work-orders/:id')
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.FINANCIAL, Role.OPERATOR)
  findOne(@Param('id') id: string): Promise<WorkOrderFullDetails> {
    return this.workOrdersService.findOne(id);
  }

  @Patch('work-orders/:id/status')
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.OPERATOR)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateWorkOrderStatusDto,
  ): Promise<WorkOrder> {
    return this.workOrdersService.updateStatus(id, dto.status);
  }

  @Delete('work-orders/:id')
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.OPERATOR)
  remove(@Param('id') id: string): Promise<WorkOrder> {
    return this.workOrdersService.remove(id);
  }

  @Post('stages/:stageId/action')
  @Roles(Role.ADMIN, Role.OPERATOR)
  executeStageAction(
    @Param('stageId') stageId: string,
    @Body() dto: StageActionDto,
  ): Promise<StageExecutionLog | { message: string }> {
    return this.workOrdersService.executeStageAction(stageId, dto);
  }
}

