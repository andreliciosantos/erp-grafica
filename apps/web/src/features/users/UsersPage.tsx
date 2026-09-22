import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { formatDateTime } from '../../lib/utils';
import { ShieldCheck, Plus, UserCheck } from 'lucide-react';
import { UserItem, PaginatedResult } from '../../types';

export const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('OPERATOR');

  const { data, isLoading } = useQuery<PaginatedResult<UserItem>>({
    queryKey: ['users-list'],
    queryFn: async () => {
      const res = await api.get('/users?limit=50');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        email,
        password,
        role,
      };
      const res = await api.post('/users', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      setIsModalOpen(false);
      setName('');
      setEmail('');
      setPassword('');
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string | string[] } } };
      const msg = error.response?.data?.message;
      alert(Array.isArray(msg) ? msg.join('\n') : (msg || 'Erro ao cadastrar usuário.'));
    },
  });

  const users = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Controle de Usuários & Acesso (RBAC)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gestão de operadores de fábrica, vendedores e administradores do ERP
          </p>
        </div>
        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Cadastrar Usuário
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários do Sistema ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Carregando usuários...</div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">Nenhum usuário cadastrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-medium">
                    <th className="pb-3 font-medium">Nome do Usuário</th>
                    <th className="pb-3 font-medium">E-mail de Login</th>
                    <th className="pb-3 font-medium">Perfil / Função</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Data de Cadastro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 font-semibold text-slate-200 flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-slate-500" />
                        {user.name}
                      </td>
                      <td className="py-3.5 text-slate-300 font-mono">{user.email}</td>
                      <td className="py-3.5">
                        <Badge
                          variant={
                            user.role === 'ADMIN'
                              ? 'primary'
                              : user.role === 'COMMERCIAL'
                              ? 'success'
                              : user.role === 'FINANCIAL'
                              ? 'cyan'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {user.role}
                        </Badge>
                      </td>
                      <td className="py-3.5">
                        <Badge variant={user.isActive ? 'success' : 'danger'} size="sm">
                          {user.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="py-3.5 text-slate-400">{formatDateTime(user.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Register Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Cadastrar Novo Usuário"
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => createMutation.mutate()}
              isLoading={createMutation.isPending}
            >
              Salvar Usuário
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nome Completo"
            required
            placeholder="Ex: Carlos Silva"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="E-mail de Acesso"
            type="email"
            required
            placeholder="carlos@erpgrafica.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Senha Provisória"
            type="password"
            required
            placeholder="Mínimo 6 caracteres..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Select
            label="Perfil de Permissão (Role)"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={[
              { value: 'OPERATOR', label: 'Operador de Chão de Fábrica' },
              { value: 'COMMERCIAL', label: 'Comercial / Atendimento' },
              { value: 'FINANCIAL', label: 'Financeiro' },
              { value: 'ADMIN', label: 'Administrador do Sistema' },
            ]}
          />
        </div>
      </Modal>
    </div>
  );
};
