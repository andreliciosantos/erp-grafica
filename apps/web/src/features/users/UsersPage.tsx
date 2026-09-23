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
import { ShieldCheck, Plus, UserCheck, Trash2, AlertTriangle, Edit2 } from 'lucide-react';
import { UserItem, PaginatedResult } from '../../types';

export const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('OPERATOR');
  const [isActive, setIsActive] = useState(true);

  const { data, isLoading } = useQuery<PaginatedResult<UserItem>>({
    queryKey: ['users-list'],
    queryFn: async () => {
      const res = await api.get('/users?limit=50');
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/users/${id}`);
      return res.data;
    },
    onSuccess: (data: { message?: string }) => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      setUserToDelete(null);
      if (data?.message) {
        alert(data.message);
      }
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Erro ao excluir/desativar usuário.');
    },
  });

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('OPERATOR');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: UserItem) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setPassword('');
    setRole(user.role);
    setIsActive(user.isActive);
    setIsModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingUser) {
        const payload: Record<string, any> = {
          name,
          email,
          role,
          isActive,
        };
        if (password) {
          payload.password = password;
        }
        const res = await api.put(`/users/${editingUser.id}`, payload);
        return res.data;
      } else {
        const payload = {
          name,
          email,
          password,
          role,
        };
        const res = await api.post('/users', payload);
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      setIsModalOpen(false);
      setEditingUser(null);
      setName('');
      setEmail('');
      setPassword('');
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string | string[] } } };
      const msg = error.response?.data?.message;
      alert(Array.isArray(msg) ? msg.join('\n') : (msg || 'Erro ao salvar usuário.'));
    },
  });

  const users = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Controle de Usuários & Acesso (RBAC)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gestão de operadores de fábrica, vendedores e administradores do ERP
          </p>
        </div>
        <Button size="sm" onClick={handleOpenCreateModal}>
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
            <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs">Carregando usuários...</div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">Nenhum usuário cadastrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                    <th className="pb-3 font-medium">Nome do Usuário</th>
                    <th className="pb-3 font-medium">E-mail de Login</th>
                    <th className="pb-3 font-medium">Perfil / Função</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Data de Cadastro</th>
                    <th className="pb-3 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        {user.name}
                      </td>
                      <td className="py-3.5 text-slate-700 dark:text-slate-300 font-mono">{user.email}</td>
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
                      <td className="py-3.5 text-slate-500 dark:text-slate-400">{formatDateTime(user.createdAt)}</td>
                      <td className="py-3.5 text-right space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEditModal(user)}
                          className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-slate-700"
                          title="Editar Usuário"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setUserToDelete(user)}
                          className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 border-rose-200 dark:border-rose-500/30"
                          title="Excluir ou Desativar Usuário"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Register/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
        }}
        title={editingUser ? "Editar Usuário" : "Cadastrar Novo Usuário"}
        maxWidth="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingUser(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => saveMutation.mutate()}
              isLoading={saveMutation.isPending}
            >
              {editingUser ? "Atualizar Usuário" : "Salvar Usuário"}
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
            label={editingUser ? "Nova Senha (opcional)" : "Senha Provisória"}
            type="password"
            required={!editingUser}
            placeholder={editingUser ? "Deixe em branco para manter a mesma" : "Mínimo 6 caracteres..."}
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

          {editingUser && (
            <Select
              label="Status da Conta"
              value={isActive ? 'true' : 'false'}
              onChange={(e) => setIsActive(e.target.value === 'true')}
              options={[
                { value: 'true', label: 'Ativo' },
                { value: 'false', label: 'Inativo' },
              ]}
            />
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(userToDelete)}
        onClose={() => setUserToDelete(null)}
        title="Confirmar Exclusão ou Desativação de Usuário"
        description="Esta ação excluirá ou desativará a conta do colaborador no ERP."
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="secondary" onClick={() => setUserToDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (userToDelete) deleteMutation.mutate(userToDelete.id);
              }}
              isLoading={deleteMutation.isPending}
            >
              Excluir / Desativar
            </Button>
          </div>
        }
      >
        <div className="flex items-start gap-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
          <div>
            <p className="font-semibold text-rose-200">
              Deseja remover o acesso de {userToDelete?.name}?
            </p>
            <p className="mt-1 text-slate-300">
              E-mail: <strong className="text-white">{userToDelete?.email}</strong>
              <br />
              Perfil: <strong className="text-white">{userToDelete?.role}</strong>
              <br />
              Se houver ordens de serviço ou apontamentos registrados pelo colaborador, o usuário será desativado preservando o histórico de auditoria.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
