import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Employee, EmployeeDepartment, EmployeeStatus, WorkShift } from '@erp/database';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

export interface PaginatedEmployeesResponse {
  data: Employee[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface EmployeeStatsResponse {
  total: number;
  active: number;
  onLeave: number;
  inactive: number;
  avgHourlyRate: number;
}

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeDigits(val: string): string {
    return val.replace(/\D/g, '');
  }

  async create(dto: CreateEmployeeDto): Promise<Employee> {
    const cleanDoc = this.normalizeDigits(dto.document);
    const cleanPhone = this.normalizeDigits(dto.phone);

    const existingDoc = await this.prisma.employee.findUnique({
      where: { document: cleanDoc },
    });
    if (existingDoc) {
      throw new ConflictException('Já existe um colaborador com este CPF.');
    }

    if (dto.registration) {
      const existingReg = await this.prisma.employee.findUnique({
        where: { registration: dto.registration },
      });
      if (existingReg) {
        throw new ConflictException('Já existe um colaborador com esta matrícula.');
      }
    }

    return this.prisma.employee.create({
      data: {
        name: dto.name,
        document: cleanDoc,
        registration: dto.registration || undefined,
        role: dto.role,
        department: dto.department || EmployeeDepartment.PRINTING,
        shift: dto.shift || WorkShift.COMMERCIAL_HOURS,
        status: dto.status || EmployeeStatus.ACTIVE,
        email: dto.email || null,
        phone: cleanPhone,
        hireDate: dto.hireDate ? new Date(dto.hireDate) : new Date(),
        hourlyRate: dto.hourlyRate !== undefined ? dto.hourlyRate : null,
        monthlySalary: dto.monthlySalary !== undefined ? dto.monthlySalary : null,
        notes: dto.notes || null,
      },
    });
  }

  async findAll(
    page = 1,
    limit = 20,
    search?: string,
    department?: EmployeeDepartment,
    status?: EmployeeStatus,
  ): Promise<PaginatedEmployeesResponse> {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};

    if (department) {
      where['department'] = department;
    }

    if (status) {
      where['status'] = status;
    }

    if (search) {
      const cleanSearch = this.normalizeDigits(search);
      where['OR'] = [
        { name: { contains: search, mode: 'insensitive' } },
        { role: { contains: search, mode: 'insensitive' } },
        { registration: { contains: search, mode: 'insensitive' } },
        ...(cleanSearch
          ? [{ document: { contains: cleanSearch } }, { phone: { contains: cleanSearch } }]
          : []),
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.employee.count({ where }),
      this.prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ status: 'asc' }, { name: 'asc' }],
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Employee> {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
    });
    if (!employee) {
      throw new NotFoundException(`Colaborador com ID ${id} não encontrado.`);
    }
    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto): Promise<Employee> {
    await this.findOne(id);

    const dataToUpdate: Record<string, unknown> = {};
    if (dto.name) dataToUpdate['name'] = dto.name;
    if (dto.role) dataToUpdate['role'] = dto.role;
    if (dto.department) dataToUpdate['department'] = dto.department;
    if (dto.shift) dataToUpdate['shift'] = dto.shift;
    if (dto.status) dataToUpdate['status'] = dto.status;
    if (dto.email !== undefined) dataToUpdate['email'] = dto.email || null;
    if (dto.notes !== undefined) dataToUpdate['notes'] = dto.notes || null;
    if (dto.registration !== undefined) dataToUpdate['registration'] = dto.registration || null;
    if (dto.hireDate) dataToUpdate['hireDate'] = new Date(dto.hireDate);
    if (dto.hourlyRate !== undefined) dataToUpdate['hourlyRate'] = dto.hourlyRate;
    if (dto.monthlySalary !== undefined) dataToUpdate['monthlySalary'] = dto.monthlySalary;

    if (dto.document) {
      dataToUpdate['document'] = this.normalizeDigits(dto.document);
    }
    if (dto.phone) {
      dataToUpdate['phone'] = this.normalizeDigits(dto.phone);
    }

    return this.prisma.employee.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  async remove(id: string): Promise<Employee> {
    await this.findOne(id);
    return this.prisma.employee.delete({
      where: { id },
    });
  }

  async getStats(): Promise<EmployeeStatsResponse> {
    const [total, active, onLeave, inactive, rateAggregate] = await Promise.all([
      this.prisma.employee.count(),
      this.prisma.employee.count({ where: { status: EmployeeStatus.ACTIVE } }),
      this.prisma.employee.count({ where: { status: EmployeeStatus.ON_LEAVE } }),
      this.prisma.employee.count({ where: { status: EmployeeStatus.INACTIVE } }),
      this.prisma.employee.aggregate({
        _avg: {
          hourlyRate: true,
        },
        where: {
          status: EmployeeStatus.ACTIVE,
          hourlyRate: { not: null },
        },
      }),
    ]);

    return {
      total,
      active,
      onLeave,
      inactive,
      avgHourlyRate: Number(rateAggregate._avg.hourlyRate || 0),
    };
  }
}
