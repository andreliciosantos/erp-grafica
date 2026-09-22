import {
  IsString,
  IsOptional,
  IsEnum,
  IsEmail,
  IsNumber,
  Min,
} from 'class-validator';
import {
  EmployeeDepartment,
  EmployeeStatus,
  WorkShift,
} from '@erp/shared-types';

export class UpdateEmployeeDto {
  @IsString({ message: 'Nome deve ser um texto.' })
  @IsOptional()
  name?: string;

  @IsString({ message: 'CPF deve ser um texto.' })
  @IsOptional()
  document?: string;

  @IsString()
  @IsOptional()
  registration?: string;

  @IsString({ message: 'Cargo deve ser um texto.' })
  @IsOptional()
  role?: string;

  @IsEnum(EmployeeDepartment, { message: 'Departamento inválido.' })
  @IsOptional()
  department?: EmployeeDepartment;

  @IsEnum(WorkShift, { message: 'Turno de trabalho inválido.' })
  @IsOptional()
  shift?: WorkShift;

  @IsEnum(EmployeeStatus, { message: 'Status do colaborador inválido.' })
  @IsOptional()
  status?: EmployeeStatus;

  @IsEmail({}, { message: 'E-mail inválido.' })
  @IsOptional()
  email?: string;

  @IsString({ message: 'Telefone deve ser um texto.' })
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  hireDate?: string;

  @IsNumber({}, { message: 'Custo hora deve ser um número.' })
  @Min(0, { message: 'Custo hora não pode ser negativo.' })
  @IsOptional()
  hourlyRate?: number;

  @IsNumber({}, { message: 'Salário mensal deve ser um número.' })
  @Min(0, { message: 'Salário mensal não pode ser negativo.' })
  @IsOptional()
  monthlySalary?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
