'use client';
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, Users, ListChecks } from 'lucide-react';
import type { FarmerWithRequestCount } from '@/app/technician/farmers/page';
import type { RegistrationStatus } from '@/types';

interface FarmerListProps {
  farmers: FarmerWithRequestCount[];
  onSelect: (farmer: FarmerWithRequestCount) => void;
  statusFilterDisplayName: string;
  hasSearchTerm: boolean;
}

const RegistrationStatusBadge = ({ status }: { status?: RegistrationStatus }) => {
    if (!status) return <Badge variant="secondary">Pendente</Badge>;
    let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
    if (status === 'Confirmado') variant = 'default';
    if (status === 'Pendente') variant = 'secondary';
    if (status === 'Inapto' || status === 'Excluir') variant = 'destructive';

    return <Badge variant={variant}>{status}</Badge>;
}

const FarmerList: React.FC<FarmerListProps> = ({ farmers, onSelect, statusFilterDisplayName, hasSearchTerm }) => {
  if (!Array.isArray(farmers) || farmers.length === 0) {
    let message = `Não foram encontrados agricultores com o status "${statusFilterDisplayName}".`;
    if (statusFilterDisplayName === 'Todos os Status' && !hasSearchTerm) {
        message = `Não foram encontrados agricultores no sistema.`;
    } else if (hasSearchTerm) {
        message = "Nenhum agricultor corresponde à sua busca."
    }

    return (
      <div className="text-center py-10 bg-card rounded-lg shadow">
        <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold text-foreground">Nenhum Agricultor Encontrado</h2>
        <p className="text-muted-foreground mt-2">{message}</p>
      </div>
    );
  }

  return (
    <Card className="shadow-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>CPF</TableHead>
            <TableHead>Município</TableHead>
            <TableHead>Unidade Organizacional</TableHead>
            <TableHead className="text-center">Status do Cadastro</TableHead>
            <TableHead className="text-center">
              <div className="flex items-center justify-center gap-1">
                <ListChecks className="inline-block h-4 w-4" /> Solicitações
              </div>
            </TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {farmers.map((farmer) => (
            <TableRow key={farmer.id}>
              <TableCell className="font-medium">{farmer.name}</TableCell>
              <TableCell>{farmer.cpf}</TableCell>
              <TableCell>{farmer.municipality || 'N/A'}</TableCell>
              <TableCell>{farmer.organizationalUnit || 'N/A'}</TableCell>
              <TableCell className="text-center">
                <RegistrationStatusBadge status={farmer.registrationStatus} />
              </TableCell>
              <TableCell className="text-center">
                {farmer.requestCount !== undefined ? farmer.requestCount : '-'}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" onClick={() => onSelect(farmer)}>
                  <Eye className="mr-2 h-4 w-4" /> Detalhes
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};

export default FarmerList;
