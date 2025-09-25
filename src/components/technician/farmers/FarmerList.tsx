'use client';
import React from 'react';
import type { User } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, MapPin, Phone, Mail, Users } from 'lucide-react';

interface FarmerListProps {
  farmers: User[];
  assignedMunicipalities: string[];
  onSelect: (farmer: User) => void;
  statusFilterDisplayName: string;
  hasSearchTerm: boolean;
}

const FarmerList: React.FC<FarmerListProps> = ({ farmers, assignedMunicipalities, onSelect, statusFilterDisplayName, hasSearchTerm }) => {
  if (farmers.length === 0) {
    let message = `Não foram encontrados agricultores com o status "${statusFilterDisplayName}".`;
    if (statusFilterDisplayName === 'Todos os Status') {
        message = hasSearchTerm 
            ? "Nenhum agricultor corresponde à sua busca."
            : `Não foram encontrados agricultores ${assignedMunicipalities.length > 0 ? `para os seus municípios atribuídos.` : 'no sistema.'}`;
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {farmers.map(farmer => (
          <Card key={farmer.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{farmer.name}</CardTitle>
              <CardDescription>CPF: {farmer.cpf}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-start"><Home className="h-4 w-4 mr-2 mt-0.5 text-primary" /> {farmer.address}</p>
                <p className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-primary" /> {farmer.municipality}</p>
                <p className="flex items-center"><Phone className="h-4 w-4 mr-2 text-primary" /> {farmer.phone}</p>
                <p className="flex items-center"><Mail className="h-4 w-4 mr-2 text-primary" /> {farmer.email}</p>
              </div>
            </CardContent>
            <div className="p-4 pt-0">
              <Button onClick={() => onSelect(farmer)} className="w-full">Ver Detalhes</Button>
            </div>
          </Card>
        ))}
      </div>
  );
};

export default FarmerList;
