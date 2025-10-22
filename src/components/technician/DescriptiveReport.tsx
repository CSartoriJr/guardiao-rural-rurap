'use client';

import React, { useMemo, useRef } from 'react';
import type { AgriRequest, User } from '@/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Clipboard, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DescriptiveReportProps {
  stats: {
    total: number;
    pending: number;
    responded: number;
    positive: number;
    negative: number;
    inconclusive: number;
    suspected: number;
    totalFarmers: number;
    confirmedFarmers: number;
    pendingFarmers: number;
  };
  users: User[];
  requests: AgriRequest[];
  selectedMunicipality: string | null;
}

const DescriptiveReport: React.FC<DescriptiveReportProps> = ({ stats, users, requests, selectedMunicipality }) => {
  const { toast } = useToast();
  const reportContentRef = useRef<HTMLDivElement>(null);

  const reportData = useMemo(() => {
    const totalRegisteredFarmers = users.filter(u => u.role === 'farmer').length;

    const requestsByMunicipality = requests.reduce((acc, req) => {
      if (req.municipality) {
        acc[req.municipality] = (acc[req.municipality] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const topRequestMunicipalities = Object.entries(requestsByMunicipality)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => `${name} (${count} solicitações)`)
      .join(', ');

    const farmersByMunicipality = users.filter(u => u.role === 'farmer').reduce((acc, user) => {
        if (user.municipality) {
            acc[user.municipality] = (acc[user.municipality] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const topFarmerMunicipalities = Object.entries(farmersByMunicipality)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => `${name} (${count} agricultores)`)
      .join(', ');

    const filterContext = selectedMunicipality
      ? `Filtrando dados para o município de: ${selectedMunicipality}`
      : 'Exibindo dados de todos os municípios.';

    return {
      filterContext,
      totalRegisteredFarmers,
      topRequestMunicipalities,
      topFarmerMunicipalities,
    };
  }, [stats, users, requests, selectedMunicipality]);

  const reportText = `
Relatório do Guardião Rural
Data de Geração: ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
Contexto do Filtro: ${reportData.filterContext}
--------------------------------------------------

**RESUMO DE AGRICULTORES**
- Quantidade Total de Agricultores Cadastrados no Sistema: ${reportData.totalRegisteredFarmers}
- Cadastros Validados (Status "Confirmado"): ${stats.confirmedFarmers}
- Cadastros Pendentes de Validação: ${stats.pendingFarmers}

**RESUMO DE SOLICITAÇÕES (Levantamentos)**
- Quantidade Total de Solicitações Enviadas: ${stats.total}
- Quantidade de Solicitações Pendentes de Atendimento: ${stats.pending}
- Quantidade de Agricultores Atendidos (Solicitações com Resposta): ${stats.responded}

**ANÁLISE DE DIAGNÓSTICOS**
- Casos com Diagnóstico Positivo: ${stats.positive}
- Casos com Suspeita de Infecção: ${stats.suspected}
- Casos com Diagnóstico Possivelmente Negativo: ${stats.negative}
- Casos com Diagnóstico Inconclusivo: ${stats.inconclusive}

**RANKING DE MUNICÍPIOS**
- Municípios com Mais Solicitações: ${reportData.topRequestMunicipalities || 'N/A'}
- Municípios com Mais Agricultores Cadastrados: ${reportData.topFarmerMunicipalities || 'N/A'}
  `;

  const handleCopy = () => {
    if (reportContentRef.current) {
      navigator.clipboard.writeText(reportContentRef.current.innerText);
      toast({
        title: 'Relatório Copiado!',
        description: 'O conteúdo do relatório foi copiado para a área de transferência.',
      });
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && reportContentRef.current) {
      printWindow.document.write('<html><head><title>Relatório Guardião Rural</title>');
      printWindow.document.write('<style>body { font-family: sans-serif; white-space: pre-wrap; } h2 { border-bottom: 1px solid #ccc; padding-bottom: 5px; } strong { font-weight: bold; }</style>');
      printWindow.document.write('</head><body>');
      
      const reportHtml = reportContentRef.current.innerHTML
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

      printWindow.document.write(reportHtml);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.print();
    }
  };


  return (
    <div>
      <ScrollArea className="h-96 w-full rounded-md border p-4 bg-muted/20">
        <div ref={reportContentRef} className="whitespace-pre-wrap text-sm">
            <h2 className="text-lg font-bold">Relatório do Guardião Rural</h2>
            <p className="text-xs text-muted-foreground">Data de Geração: {format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</p>
            <p className="text-xs text-muted-foreground mb-4">{reportData.filterContext}</p>
            
            <Separator className="my-3" />

            <h3 className="font-bold">RESUMO DE AGRICULTORES</h3>
            <p>- Quantidade Total de Agricultores Cadastrados no Sistema: {reportData.totalRegisteredFarmers}</p>
            <p>- Cadastros Validados (Status "Confirmado"): {stats.confirmedFarmers}</p>
            <p>- Cadastros Pendentes de Validação: {stats.pendingFarmers}</p>

            <Separator className="my-3" />

            <h3 className="font-bold">RESUMO DE SOLICITAÇÕES (Levantamentos)</h3>
            <p>- Quantidade Total de Solicitações Enviadas: {stats.total}</p>
            <p>- Quantidade de Solicitações Pendentes de Atendimento: {stats.pending}</p>
            <p>- Quantidade de Agricultores Atendidos (Solicitações com Resposta): {stats.responded}</p>

            <Separator className="my-3" />

            <h3 className="font-bold">ANÁLISE DE DIAGNÓSTICOS</h3>
            <p>- Casos com Diagnóstico Positivo: {stats.positive}</p>
            <p>- Casos com Suspeita de Infecção: {stats.suspected}</p>
            <p>- Casos com Diagnóstico Possivelmente Negativo: {stats.negative}</p>
            <p>- Casos com Diagnóstico Inconclusivo: {stats.inconclusive}</p>

            <Separator className="my-3" />

            <h3 className="font-bold">RANKING DE MUNICÍPIOS</h3>
            <p>- Municípios com Mais Solicitações: {reportData.topRequestMunicipalities || 'N/A'}</p>
            <p>- Municípios com Mais Agricultores Cadastrados: {reportData.topFarmerMunicipalities || 'N/A'}</p>
        </div>
      </ScrollArea>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={handleCopy}>
          <Clipboard className="mr-2 h-4 w-4" />
          Copiar Relatório
        </Button>
        <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
        </Button>
      </div>
    </div>
  );
};

export default DescriptiveReport;
