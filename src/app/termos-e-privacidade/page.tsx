
'use client';
import { CacaBruxaLogo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { APP_ROUTES } from '@/config/routes';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TermsAndPrivacyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center bg-background p-4 sm:p-6">
      <div className="absolute top-6 left-6">
        <Button variant="outline" onClick={() => router.back()} className="group">
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Voltar
        </Button>
      </div>
      <div className="mb-8 mt-16 sm:mt-8">
        <CacaBruxaLogo />
      </div>
      <Card className="w-full max-w-3xl shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline text-accent">Termos de Uso e Política de Privacidade</CardTitle>
          <CardDescription>Última atualização: [Data da Última Atualização]</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-sm text-foreground">
          <section>
            <h2 className="text-lg font-semibold mb-2 text-primary">1. Aceitação dos Termos</h2>
            <p>Ao se cadastrar e utilizar o aplicativo RURAP - Guardião Rural ("Aplicativo"), você concorda em cumprir estes Termos de Uso e nossa Política de Privacidade. Se você não concordar com algum destes termos, não deverá usar o Aplicativo.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2 text-primary">2. Coleta e Uso de Dados</h2>
            <p>Para fornecer os serviços do Aplicativo, coletamos as seguintes informações pessoais durante o seu cadastro e uso:</p>
            <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
              <li>Nome completo</li>
              <li>CPF</li>
              <li>Número de telefone</li>
              <li>Endereço de e-mail</li>
              <li>Endereço residencial/da propriedade rural</li>
              <li>Município</li>
              <li>Número de componentes familiares (para agricultores)</li>
              <li>Senha de acesso (armazenada de forma segura)</li>
              <li>Fotos das plantas de mandioca enviadas por você</li>
              <li>Dados de geolocalização (latitude e longitude) no momento do envio das fotos, se permitido</li>
              <li>Recomendações e diagnósticos gerados pelos técnicos e pela IA</li>
            </ul>
            <p className="mt-2">Esses dados são utilizados para:</p>
            <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
              <li>Identificar e autenticar usuários.</li>
              <li>Permitir que técnicos agrícolas forneçam diagnósticos e recomendações.</li>
              <li>Utilizar inteligência artificial para auxiliar no diagnóstico e fornecer sugestões.</li>
              <li>Gerar dados estatísticos anônimos sobre a incidência de pragas/doenças.</li>
              <li>Melhorar a funcionalidade e os serviços do Aplicativo.</li>
              <li>Comunicar-se com você sobre seu uso do Aplicativo.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2 text-primary">3. Compartilhamento de Dados</h2>
            <p>Seus dados pessoais poderão ser acessados por:</p>
            <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
              <li>Administradores do sistema RURAP para gerenciamento da plataforma.</li>
              <li>Técnicos agrícolas cadastrados no sistema para fins de diagnóstico e recomendação.</li>
              <li>Sistemas de Inteligência Artificial (como o Google Gemini) para processamento das imagens e geração de sugestões, conforme descrito. Os dados enviados para esses sistemas são tratados de acordo com as políticas de privacidade dos respectivos provedores.</li>
            </ul>
            <p className="mt-2">Não compartilharemos seus dados pessoais com terceiros para fins de marketing sem o seu consentimento explícito.</p>
          </section>
          
          <section>
            <h2 className="text-lg font-semibold mb-2 text-primary">4. Geolocalização</h2>
            <p>Ao enviar uma Solicitação de análise, o Aplicativo solicitará acesso à sua localização GPS. Se concedido, as coordenadas de latitude e longitude serão coletadas e associadas ao sua Solicitação. A IA também poderá tentar extrair informações de localização das fotos enviadas se o GPS do dispositivo não estiver disponível ou não for fornecido. Essas informações são usadas para determinar o município e podem auxiliar no diagnóstico e nas recomendações agronômicas.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2 text-primary">5. Segurança dos Dados</h2>
            <p>Empregamos medidas de segurança para proteger seus dados pessoais contra acesso não autorizado, alteração, divulgação ou destruição. No entanto, nenhum sistema é completamente seguro, e não podemos garantir segurança absoluta.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2 text-primary">6. Seus Direitos (LGPD)</h2>
            <p>Você tem o direito de acessar, corrigir, atualizar ou solicitar a exclusão de suas informações pessoais. Para exercer esses direitos, entre em contato conosco através dos canais de suporte do RURAP.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2 text-primary">7. Uso da Inteligência Artificial</h2>
            <p>O Aplicativo utiliza modelos de Inteligência Artificial (IA) para auxiliar na análise das imagens e fornecer sugestões de diagnóstico e recomendações. É importante notar que as sugestões da IA são um auxílio e não substituem a avaliação de um técnico agrícola qualificado. As decisões finais de manejo devem ser tomadas com base no julgamento profissional e nas condições específicas da sua propriedade.</p>
             <p className="mt-2">Ao usar o Aplicativo, você entende e concorda que as imagens e dados fornecidos podem ser processados por esses modelos de IA. As interações com a IA são regidas pelos termos de serviço e políticas de privacidade dos respectivos provedores de IA (ex: Google).</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2 text-primary">8. Alterações nos Termos</h2>
            <p>Podemos atualizar estes Termos de Uso e Política de Privacidade periodicamente. Notificaremos sobre quaisquer alterações significativas. O uso continuado do Aplicativo após tais alterações constitui sua aceitação dos novos termos.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2 text-primary">9. Contato</h2>
            <p>Se você tiver alguma dúvida sobre estes termos, entre em contato com o RURAP.</p>
          </section>

          <div className="pt-4 text-center">
             <Button onClick={() => router.back()} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                 <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
          </div>
        </CardContent>
      </Card>
       <p className="mt-8 text-center text-sm text-muted-foreground">
        Guardião Rural - RURAP
      </p>
    </div>
  );
}
