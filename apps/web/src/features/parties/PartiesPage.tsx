import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Users, Plus, Search, Phone, Mail, MapPin, Trash2, AlertTriangle } from 'lucide-react';
import { PartyItem, PaginatedResult } from '../../types';

export const PartiesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [partyToDelete, setPartyToDelete] = useState<PartyItem | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [document, setDocument] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState('COMPANY');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  const { data, isLoading } = useQuery<PaginatedResult<PartyItem>>({
    queryKey: ['parties-list', searchTerm],
    queryFn: async () => {
      const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
      const res = await api.get(`/parties?limit=50${searchParam}`);
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/parties/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties-list'] });
      setPartyToDelete(null);
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Erro ao excluir parceiro.');
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        type,
        name,
        tradeName: tradeName || undefined,
        document: document.replace(/\D/g, ''),
        email: email || undefined,
        phone: phone.replace(/\D/g, ''),
        address: address || undefined,
        city: city || undefined,
        state: state || undefined,
        isCustomer: true,
        isSupplier: false,
      };
      const res = await api.post('/parties', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties-list'] });
      setIsModalOpen(false);
      setName('');
      setTradeName('');
      setDocument('');
      setEmail('');
      setPhone('');
      setAddress('');
      setCity('');
      setState('');
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string | string[] } } };
      const msg = error.response?.data?.message;
      alert(Array.isArray(msg) ? msg.join('\n') : (msg || 'Erro ao cadastrar parceiro.'));
    },
  });

  const parties = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Clientes & Parceiros Comerciais
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gestão da carteira de clientes, dados cadastrais e canais de contato
          </p>
        </div>
        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Cadastrar Novo Cliente
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <Input
            placeholder="Buscar por nome, razão social, CPF ou CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Clientes Cadastrados ({parties.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Carregando clientes...</div>
          ) : parties.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">Nenhum cliente cadastrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-medium">
                    <th className="pb-3 font-medium">Nome / Razão Social</th>
                    <th className="pb-3 font-medium">CPF / CNPJ</th>
                    <th className="pb-3 font-medium">Tipo</th>
                    <th className="pb-3 font-medium">Telefone</th>
                    <th className="pb-3 font-medium">E-mail</th>
                    <th className="pb-3 font-medium">Localização</th>
                    <th className="pb-3 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {parties.map((party) => (
                    <tr key={party.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5">
                        <p className="font-semibold text-slate-200">{party.name}</p>
                        {party.tradeName && (
                          <p className="text-[11px] text-slate-400">{party.tradeName}</p>
                        )}
                      </td>
                      <td className="py-3.5 font-mono text-slate-300">{party.document}</td>
                      <td className="py-3.5">
                        <Badge variant={party.type === 'COMPANY' ? 'primary' : 'neutral'} size="sm">
                          {party.type === 'COMPANY' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                        </Badge>
                      </td>
                      <td className="py-3.5 text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          {party.phone}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-300">
                        {party.email ? (
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-500" />
                            {party.email}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-3.5 text-slate-400">
                        {party.city && party.state ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            {party.city}/{party.state}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-3.5 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPartyToDelete(party)}
                          className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border-rose-500/30"
                          title="Excluir Cliente"
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

      {/* Register Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Cadastrar Novo Cliente"
        maxWidth="lg"
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
              Salvar Cadastro
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Tipo de Pessoa"
              value={type}
              onChange={(e) => setType(e.target.value)}
              options={[
                { value: 'COMPANY', label: 'Pessoa Jurídica (CNPJ)' },
                { value: 'INDIVIDUAL', label: 'Pessoa Física (CPF)' },
              ]}
            />
            <Input
              label="Documento (CPF / CNPJ)"
              required
              placeholder="Apenas números..."
              value={document}
              onChange={(e) => setDocument(e.target.value)}
            />
          </div>

          <Input
            label="Razão Social / Nome Completo"
            required
            placeholder="Ex: Gráfica e Comunicação Visual Ltda"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="Nome Fantasia"
            placeholder="Ex: ArtGráfica"
            value={tradeName}
            onChange={(e) => setTradeName(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Telefone / WhatsApp"
              required
              placeholder="Ex: 11988887777"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Input
              label="E-mail"
              type="email"
              placeholder="contato@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Input
                label="Endereço"
                placeholder="Rua, número, bairro..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <Input
              label="Cidade / UF"
              placeholder="São Paulo/SP"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(partyToDelete)}
        onClose={() => setPartyToDelete(null)}
        title="Confirmar Exclusão de Cliente"
        description="Esta ação removerá o cliente e orçamentos pendentes."
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="secondary" onClick={() => setPartyToDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (partyToDelete) deleteMutation.mutate(partyToDelete.id);
              }}
              isLoading={deleteMutation.isPending}
            >
              Excluir Cliente
            </Button>
          </div>
        }
      >
        <div className="flex items-start gap-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
          <div>
            <p className="font-semibold text-rose-200">
              Tem certeza que deseja excluir o cliente {partyToDelete?.name}?
            </p>
            <p className="mt-1 text-slate-300">
              Documento: <strong className="text-white">{partyToDelete?.document}</strong>
              <br />
              Telefone: <strong className="text-white">{partyToDelete?.phone}</strong>
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
