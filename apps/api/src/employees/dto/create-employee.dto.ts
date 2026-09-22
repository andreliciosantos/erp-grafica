import {
  IsString,
  IsNotEmpty,
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

export class CreateEmployeeDto {
  @IsString({ message: 'Nome deve ser um texto.' })
  @IsNotEmpty({ message: 'Nome completo é obrigatório.' })
  name!: string;

  @IsString({ message: 'CPF deve ser um texto.' })
  @IsNotEmpty({ message: 'CPF é obrigatório.' })
  document!: string;

  @IsString()
  @IsOptional()
  registration?: string;

  @IsString({ message: 'Cargo é obrigatório.' })
  @IsNotEmpty({ message: 'Cargo é obrigatório.' })
  role!: string;

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

  @IsString({ message: 'Telefone é obrigatório.' })
  @IsNotEmpty({ message: 'Telefone é obrigatório.' })
  phone!: string;

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
