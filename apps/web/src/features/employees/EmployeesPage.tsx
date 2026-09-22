import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { formatCurrency } from '../../lib/utils';
import {
  Users,
  UserCheck,
  Plus,
  Search,
  Phone,
  Mail,
  Edit2,
  Trash2,
  AlertTriangle,
  Clock,
  BadgeDollarSign,
  Calendar,
} from 'lucide-react';
import {
  EmployeeItem,
  EmployeeDepartment,
  EmployeeStatus,
  WorkShift,
  CreateEmployeeDto,
  UpdateEmployeeDto,
} from '../../types';

interface EmployeeStats {
  total: number;
  active: number;
  onLeave: number;
  inactive: number;
  avgHourlyRate: number;
}

const DEPARTMENT_LABELS: Record<EmployeeDepartment, { label: string; variant: 'primary' | 'cyan' | 'purple' | 'info' | 'warning' | 'success' | 'neutral' }> = {
  [EmployeeDepartment.PRE_PRESS]: { label: 'Pré-Impressão (CTP)', variant: 'cyan' },
  [EmployeeDepartment.PRINTING]: { label: 'Impressão (Offset/Digital)', variant: 'primary' },
  [EmployeeDepartment.FINISHING]: { label: 'Acabamento Gráfico', variant: 'purple' },
  [EmployeeDepartment.QUALITY]: { label: 'Controle de Qualidade', variant: 'info' },
  [EmployeeDepartment.EXPEDITION]: { label: 'Expedição & Logística', variant: 'warning' },
  [EmployeeDepartment.COMMERCIAL]: { label: 'Comercial & Vendas', variant: 'success' },
  [EmployeeDepartment.ADMINISTRATIVE]: { label: 'Administrativo & RH', variant: 'neutral' },
  [EmployeeDepartment.MAINTENANCE]: { label: 'Manutenção Mecânica', variant: 'warning' },
};

const SHIFT_LABELS: Record<WorkShift, string> = {
  [WorkShift.MORNING]: '1º Turno (06:00 - 14:00)',
  [WorkShift.AFTERNOON]: '2º Turno (14:00 - 22:00)',
  [WorkShift.NIGHT]: '3º Turno (22:00 - 06:00)',
  [WorkShift.COMMERCIAL_HOURS]: 'Comercial (08:00 - 18:00)',
};

const STATUS_CONFIG: Record<EmployeeStatus, { label: string; variant: 'success' | 'warning' | 'neutral' }> = {
  [EmployeeStatus.ACTIVE]: { label: 'Ativo', variant: 'success' },
  [EmployeeStatus.ON_LEAVE]: { label: 'Em Férias / Afastado', variant: 'warning' },
  [EmployeeStatus.INACTIVE]: { label: 'Inativo', variant: 'neutral' },
};

export const EmployeesPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeItem | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<EmployeeItem | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [registration, setRegistration] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState<EmployeeDepartment>(EmployeeDepartment.PRINTING);
  const [shift, setShift] = useState<WorkShift>(WorkShift.MORNING);
  const [status, setStatus] = useState<EmployeeStatus>(EmployeeStatus.ACTIVE);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [hireDate, setHireDate] = useState(new Date().toISOString().split('T')[0]);
  const [hourlyRate, setHourlyRate] = useState<number | ''>('');
  const [monthlySalary, setMonthlySalary] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  // Fetch employees list
  const { data: listResponse, isLoading } = useQuery<{ data: EmployeeItem[]; meta: any }>({
    queryKey: ['employees-list', searchTerm, selectedDept, selectedStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('limit', '50');
      if (searchTerm) params.append('search', searchTerm);
      if (selectedDept) params.append('department', selectedDept);
      if (selectedStatus) params.append('status', selectedStatus);

      const res = await api.get(`/employees?${params.toString()}`);
      return res.data;
    },
  });

  // Fetch HR stats
  const { data: stats } = useQuery<EmployeeStats>({
    queryKey: ['employees-stats'],
    queryFn: async () => {
      const res = await api.get('/employees/stats');
      return res.data;
    },
  });

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingEmployee(null);
    setName('');
    setDocument('');
    setRegistration('');
    setRole('');
    setDepartment(EmployeeDepartment.PRINTING);
    setShift(WorkShift.MORNING);
    setStatus(EmployeeStatus.ACTIVE);
    setEmail('');
    setPhone('');
    setHireDate(new Date().toISOString().split('T')[0]);
    setHourlyRate(25);
    setMonthlySalary(3500);
    setNotes('');
    setIsFormModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (emp: EmployeeItem) => {
    setEditingEmployee(emp);
    setName(emp.name);
    setDocument(emp.document);
    setRegistration(emp.registration || '');
    setRole(emp.role);
    setDepartment(emp.department);
    setShift(emp.shift);
    setStatus(emp.status);
    setEmail(emp.email || '');
    setPhone(emp.phone);
    setHireDate(emp.hireDate ? emp.hireDate.split('T')[0] : '');
    setHourlyRate(emp.hourlyRate !== null && emp.hourlyRate !== undefined ? emp.hourlyRate : '');
    setMonthlySalary(emp.monthlySalary !== null && emp.monthlySalary !== undefined ? emp.monthlySalary : '');
    setNotes(emp.notes || '');
    setIsFormModalOpen(true);
  };

  // Save (Create or Update)
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: CreateEmployeeDto | UpdateEmployeeDto = {
        name,
        document: document.replace(/\D/g, ''),
        registration: registration || undefined,
        role,
        department,
        shift,
        status,
        email: email || undefined,
        phone: phone.replace(/\D/g, ''),
        hireDate: hireDate ? new Date(hireDate).toISOString() : undefined,
        hourlyRate: hourlyRate !== '' ? Number(hourlyRate) : undefined,
        monthlySalary: monthlySalary !== '' ? Number(monthlySalary) : undefined,
        notes: notes || undefined,
      };

      if (editingEmployee) {
        const res = await api.put(`/employees/${editingEmployee.id}`, payload);
        return res.data;
      } else {
        const res = await api.post('/employees', payload);
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees-list'] });
      queryClient.invalidateQueries({ queryKey: ['employees-stats'] });
      setIsFormModalOpen(false);
      setEditingEmployee(null);
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string | string[] } } };
      const msg = error.response?.data?.message;
      alert(Array.isArray(msg) ? msg.join('\n') : (msg || 'Erro ao salvar colaborador.'));
    },
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/employees/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees-list'] });
      queryClient.invalidateQueries({ queryKey: ['employees-stats'] });
      setEmployeeToDelete(null);
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Erro ao excluir colaborador.');
    },
  });

  const employees = listResponse?.data || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Equipe & Gestão de Colaboradores (RH / Chão de Fábrica)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cadastro de operadores gráficos, apontamento por turnos, departamentos e taxas horárias de produção
          </p>
        </div>
        <Button size="sm" onClick={handleOpenCreateModal} className="flex items-center gap-1.5 shadow-sm">
          <Plus className="w-4 h-4" />
          <span>Novo Colaborador</span>
        </Button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Colaboradores"
          value={stats?.total ?? employees.length}
          subtitle="Quadro geral da gráfica"
          icon={<Users className="w-5 h-5 text-indigo-400" />}
        />
        <StatCard
          title="Ativos na Fábrica"
          value={stats?.active ?? 0}
          subtitle="Em operação e disponíveis"
          icon={<UserCheck className="w-5 h-5 text-emerald-400" />}
        />
        <StatCard
          title="Em Férias / Afastados"
          value={stats?.onLeave ?? 0}
          subtitle="Licenças e afastamentos"
          icon={<Calendar className="w-5 h-5 text-amber-400" />}
        />
        <StatCard
          title="Custo Médio Hora"
          value={formatCurrency(stats?.avgHourlyRate ?? 0)}
          subtitle="Base para cálculo de OS"
          icon={<BadgeDollarSign className="w-5 h-5 text-teal-400" />}
        />
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Colaboradores Cadastrados ({employees.length})</CardTitle>
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search input */}
              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Buscar nome, CPF, cargo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 py-1.5 text-xs h-9"
                />
              </div>

              {/* Department filter */}
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                aria-label="Filtrar por Departamento"
                className="h-9 rounded-lg bg-slate-900 border border-slate-700/80 px-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">Todos os Departamentos</option>
                {Object.values(EmployeeDepartment).map((dept) => (
                  <option key={dept} value={dept}>
                    {DEPARTMENT_LABELS[dept]?.label || dept}
                  </option>
                ))}
              </select>

              {/* Status filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                aria-label="Filtrar por Status"
                className="h-9 rounded-lg bg-slate-900 border border-slate-700/80 px-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">Todos os Status</option>
                {Object.values(EmployeeStatus).map((st) => (
                  <option key={st} value={st}>
                    {STATUS_CONFIG[st]?.label || st}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Carregando colaboradores...</div>
          ) : employees.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Nenhum colaborador encontrado com os filtros selecionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-medium">
                    <th className="pb-3 font-medium">Colaborador</th>
                    <th className="pb-3 font-medium">Cargo & Departamento</th>
                    <th className="pb-3 font-medium">Turno de Trabalho</th>
                    <th className="pb-3 font-medium">Contato</th>
                    <th className="pb-3 font-medium">Custo / Salário</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {employees.map((emp) => {
                    const deptInfo = DEPARTMENT_LABELS[emp.department] || {
                      label: emp.department,
                      variant: 'neutral' as const,
                    };
                    const statusInfo = STATUS_CONFIG[emp.status] || {
                      label: emp.status,
                      variant: 'neutral' as const,
                    };

                    return (
                      <tr key={emp.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5">
                          <div className="font-semibold text-slate-100">{emp.name}</div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                            {emp.registration && (
                              <span className="font-mono bg-slate-800/80 px-1.5 py-0.5 rounded text-emerald-400">
                                Matrícula: {emp.registration}
                              </span>
                            )}
                            <span className="font-mono">CPF: {emp.document}</span>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <div className="font-medium text-slate-200">{emp.role}</div>
                          <div className="mt-1">
                            <Badge variant={deptInfo.variant} size="sm">
                              {deptInfo.label}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-slate-300 font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {SHIFT_LABELS[emp.shift] || emp.shift}
                          </span>
                        </td>
                        <td className="py-3.5 space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{emp.phone}</span>
                          </div>
                          {emp.email && (
                            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                              <Mail className="w-3 h-3 text-slate-500" />
                              <span>{emp.email}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5">
                          {emp.hourlyRate ? (
                            <div className="font-mono font-medium text-emerald-400">
                              {formatCurrency(emp.hourlyRate)}/h
                            </div>
                          ) : null}
                          {emp.monthlySalary ? (
                            <div className="text-[11px] text-slate-400">
                              {formatCurrency(emp.monthlySalary)}/mês
                            </div>
                          ) : (
                            !emp.hourlyRate && <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="py-3.5">
                          <Badge variant={statusInfo.variant} size="sm">
                            {statusInfo.label}
                          </Badge>
                        </td>
                        <td className="py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditModal(emp)}
                              className="text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 p-1.5 h-7 w-7"
                              title="Editar Colaborador"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEmployeeToDelete(emp)}
                              className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 h-7 w-7"
                              title="Excluir Colaborador"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingEmployee ? 'Editar Colaborador' : 'Novo Colaborador / Operador'}
        maxWidth="2xl"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nome Completo"
              required
              placeholder="Ex: Carlos Eduardo Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Input
              label="CPF"
              required
              placeholder="000.000.000-00"
              value={document}
              onChange={(e) => setDocument(e.target.value)}
            />

            <Input
              label="Matrícula / Registro Interno"
              placeholder="Ex: OP-042"
              value={registration}
              onChange={(e) => setRegistration(e.target.value)}
            />

            <Input
              label="Cargo / Função"
              required
              placeholder="Ex: Operador Offset Heidelberg SM-74"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />

            <Select
              label="Departamento"
              required
              value={department}
              onChange={(e) => setDepartment(e.target.value as EmployeeDepartment)}
              options={Object.values(EmployeeDepartment).map((d) => ({
                value: d,
                label: DEPARTMENT_LABELS[d]?.label || d,
              }))}
            />

            <Select
              label="Turno de Trabalho"
              required
              value={shift}
              onChange={(e) => setShift(e.target.value as WorkShift)}
              options={Object.values(WorkShift).map((s) => ({
                value: s,
                label: SHIFT_LABELS[s] || s,
              }))}
            />

            <Select
              label="Status Atual"
              required
              value={status}
              onChange={(e) => setStatus(e.target.value as EmployeeStatus)}
              options={Object.values(EmployeeStatus).map((st) => ({
                value: st,
                label: STATUS_CONFIG[st]?.label || st,
              }))}
            />

            <Input
              label="Telefone / WhatsApp"
              required
              placeholder="(11) 98765-4321"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <Input
              label="E-mail Corporativo / Pessoal"
              type="email"
              placeholder="colaborador@grafica.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Data de Admissão"
              type="date"
              value={hireDate}
              onChange={(e) => setHireDate(e.target.value)}
            />

            <Input
              label="Custo Hora (R$/h)"
              type="number"
              step="0.01"
              placeholder="Ex: 25.50"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value === '' ? '' : Number(e.target.value))}
            />

            <Input
              label="Salário Base Mensal (R$)"
              type="number"
              step="0.01"
              placeholder="Ex: 3500.00"
              value={monthlySalary}
              onChange={(e) => setMonthlySalary(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Observações & Habilidades Técnicas
            </label>
            <textarea
              rows={2}
              className="w-full rounded-lg bg-slate-900 border border-slate-700/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              placeholder="Ex: Certificação Heidelberg Printmaster, especialista em verniz UV reserva e corte e vinco automático..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsFormModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={saveMutation.isPending}
            >
              {editingEmployee ? 'Atualizar Colaborador' : 'Cadastrar Colaborador'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!employeeToDelete}
        onClose={() => setEmployeeToDelete(null)}
        title="Confirmar Exclusão de Colaborador"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-200">Atenção: Ação Irreversível</p>
              <p className="mt-1">
                Deseja realmente excluir o colaborador{' '}
                <strong className="text-white font-mono">{employeeToDelete?.name}</strong> (Cargo: {employeeToDelete?.role})?
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEmployeeToDelete(null)}
              disabled={deleteMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={deleteMutation.isPending}
              onClick={() => employeeToDelete && deleteMutation.mutate(employeeToDelete.id)}
            >
              Excluir Colaborador
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
