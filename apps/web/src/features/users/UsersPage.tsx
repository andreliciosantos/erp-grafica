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
import { ShieldCheck, Plus, UserCheck, Trash2, AlertTriangle, Edit2, KeyRound, CheckCircle2, Lock } from 'lucide-react';
import { UserItem, PaginatedResult } from '../../types';

export const isUserRoot = (user?: UserItem | null) => Boolean(user?.isRoot || user?.email === 'admin@erpgrafica.com');

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
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role,
          isActive,
        };
        if (password.trim()) {
          payload.password = password.trim();
        }
        const res = await api.put(`/users/${editingUser.id}`, payload);
        return res.data;
      } else {
        if (!password || password.trim().length < 6) {
          throw new Error('A senha temporária é obrigatória e deve ter pelo menos 6 caracteres.');
        }
        const payload = {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
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
      alert(
        editingUser
          ? 'Usuário atualizado com sucesso!'
          : 'Usuário cadastrado com sucesso! Informe a senha temporária ao colaborador para o primeiro acesso.'
      );
    },
    onError: (err: unknown) => {
      const error = err as { message?: string; response?: { data?: { message?: string | string[] } } };
      const msg = error.response?.data?.message || error.message;
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
                    <th className="pb-3 font-medium">Acesso / Senha</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Data de Cadastro</th>
                    <th className="pb-3 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60">
                  {users.map((user) => {
                    const isRoot = isUserRoot(user);
                    return (
                      <tr key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          {isRoot ? (
                            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          ) : (
                            <UserCheck className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                          )}
                          <span>{user.name}</span>
                          {isRoot && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              Root
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 text-slate-700 dark:text-slate-300 font-mono">{user.email}</td>
                        <td className="py-3.5">
                          <Badge
                            variant={
                              isRoot || user.role === 'ADMIN'
                                ? 'primary'
                                : user.role === 'COMMERCIAL'
                                ? 'success'
                                : user.role === 'FINANCIAL'
                                ? 'cyan'
                                : 'warning'
                            }
                            size="sm"
                          >
                            {isRoot ? 'ADMIN ROOT' : user.role}
                          </Badge>
                        </td>
                        <td className="py-3.5">
                          {isRoot ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" title="Conta Root de Segurança Permanente">
                              <ShieldCheck className="w-3 h-3 text-emerald-500" />
                              Root Permanente
                            </span>
                          ) : user.mustChangePassword ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" title="Aguardando primeiro login para definir senha definitiva">
                              <KeyRound className="w-3 h-3 text-amber-500" />
                              Senha Temporária (1º Login)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" title="Senha definitiva cadastrada">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              Senha Definitiva Ativa
                            </span>
                          )}
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
                          {isRoot ? (
                            <span
                              className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700/60 cursor-not-allowed"
                              title="Conta Root Protegida (impossível excluir ou desativar)"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setUserToDelete(user)}
                              className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 border-rose-200 dark:border-rose-500/30"
                              title="Excluir ou Desativar Usuário"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
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

      {/* Register/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
        }}
        title={editingUser ? "Editar Usuário" : "Cadastrar Novo Usuário"}
        description={
          editingUser
            ? "Atualize as informações de perfil e permissões do colaborador."
            : "Cadastre um novo colaborador informando a senha temporária para o primeiro acesso."
        }
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
              {editingUser ? "Atualizar Usuário" : "Cadastrar Usuário"}
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

          {!editingUser ? (
            <div className="space-y-2">
              <Input
                label="Senha Temporária de Acesso"
                type="password"
                required
                placeholder="Mínimo 6 caracteres (ex: Temp@2026)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<KeyRound className="w-4 h-4" />}
                helperText="No primeiro login, o colaborador será obrigado a definir sua senha definitiva."
              />
            </div>
          ) : (
            <Input
              label="Redefinir Senha Temporária (opcional)"
              type="password"
              placeholder="Deixe em branco para manter a mesma"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<KeyRound className="w-4 h-4" />}
              helperText="Se alterada, o usuário deverá criar uma nova senha definitiva no próximo acesso."
            />
          )}

          {isUserRoot(editingUser) && (
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-200">
                  Administrador Principal (Root de Segurança)
                </p>
                <p className="mt-0.5 text-slate-300">
                  Esta conta possui imunidade do sistema: o perfil de acesso é fixado como Administrador, o status é permanentemente Ativo e é impossível excluí-la.
                </p>
              </div>
            </div>
          )}

          <Select
            label="Perfil de Permissão (Role)"
            value={role}
            disabled={isUserRoot(editingUser)}
            onChange={(e) => setRole(e.target.value)}
            options={[
              { value: 'OPERATOR', label: 'Operador de Chão de Fábrica' },
              { value: 'COMMERCIAL', label: 'Comercial / Atendimento' },
              { value: 'FINANCIAL', label: 'Financeiro' },
              { value: 'ADMIN', label: isUserRoot(editingUser) ? 'Administrador do Sistema (Root)' : 'Administrador do Sistema' },
            ]}
          />

          {editingUser && !isUserRoot(editingUser) && (
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
