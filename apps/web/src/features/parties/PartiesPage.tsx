import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Users, Plus, Search, Phone, Mail, MapPin } from 'lucide-react';
import { PartyItem, PaginatedResult } from '../../types';

export const PartiesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    </div>
  );
};
