import { FileText } from 'lucide-react'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-8 sm:py-12">
          <div className="flex items-center gap-3">
            <FileText className="h-7 w-7 text-blue-600 flex-shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Política de Privacidade
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-6 py-8 sm:py-12">
        <div className="space-y-10">
          {/* Introdução */}
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-gray-600">
              A Rock Serviços de Tecnologia LTDA valoriza a privacidade dos
              usuários e busca tratar seus dados pessoais de forma transparente,
              segura e de acordo com a legislação aplicável, especialmente a Lei
              nº 13.709/2018 — Lei Geral de Proteção de Dados Pessoais (LGPD).
            </p>
            <p className="text-sm leading-relaxed text-gray-600">
              A utilização do aplicativo implica o tratamento de determinados
              dados pessoais necessários para disponibilizar suas
              funcionalidades.
            </p>
          </div>

          {/* Dados pessoais coletados */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Dados pessoais coletados
            </h2>
            <p className="text-sm leading-relaxed text-gray-600">
              Dependendo das funcionalidades utilizadas, o aplicativo poderá
              coletar e tratar:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-sm leading-relaxed text-gray-600">
              <li>nome completo;</li>
              <li>endereço de e-mail;</li>
              <li>número de telefone celular;</li>
              <li>data de nascimento;</li>
              <li>informações relacionadas à conta do usuário;</li>
              <li>informações necessárias para autenticação e segurança da conta;</li>
              <li>
                imagem de perfil, quando fornecida voluntariamente pelo usuário;
              </li>
              <li>
                informações técnicas necessárias ao funcionamento, segurança e
                manutenção do aplicativo.
              </li>
            </ul>
            <p className="text-sm leading-relaxed text-gray-600">
              A empresa buscará limitar a coleta de informações ao que for
              necessário para as finalidades informadas ao usuário.
            </p>
          </section>

          {/* Imagem de perfil */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Imagem de perfil
            </h2>
            <p className="text-sm leading-relaxed text-gray-600">
              O aplicativo poderá permitir que o usuário adicione uma imagem de
              perfil de forma opcional.
            </p>
            <p className="text-sm leading-relaxed text-gray-600">
              Para essa finalidade, o aplicativo poderá solicitar acesso à:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-sm leading-relaxed text-gray-600">
              <li>
                câmera do dispositivo, permitindo que o usuário tire uma nova
                fotografia; ou
              </li>
              <li>
                galeria/fotos do dispositivo, permitindo que o usuário selecione
                uma imagem já existente.
              </li>
            </ul>
            <p className="text-sm leading-relaxed text-gray-600">
              O acesso à câmera ou à galeria somente será solicitado quando
              necessário para a funcionalidade correspondente e estará sujeito
              às permissões disponibilizadas pelo sistema operacional do
              dispositivo.
            </p>
            <p className="text-sm leading-relaxed text-gray-600">
              A imagem escolhida pelo usuário poderá ser armazenada e associada
              à sua conta para utilização como imagem de perfil dentro do
              aplicativo.
            </p>
            <p className="text-sm leading-relaxed text-gray-600">
              O usuário poderá optar por não fornecer uma imagem de perfil,
              salvo quando alguma funcionalidade específica, devidamente
              informada, exigir essa informação.
            </p>
          </section>

          {/* Finalidades do tratamento */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Finalidades do tratamento
            </h2>
            <p className="text-sm leading-relaxed text-gray-600">
              Os dados pessoais poderão ser utilizados para as seguintes
              finalidades:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-sm leading-relaxed text-gray-600">
              <li>criação e gerenciamento da conta do usuário;</li>
              <li>identificação e autenticação do usuário;</li>
              <li>disponibilização das funcionalidades do aplicativo;</li>
              <li>comunicação com o usuário;</li>
              <li>envio de informações relacionadas à conta e aos serviços utilizados;</li>
              <li>recuperação e segurança da conta;</li>
              <li>prevenção e detecção de fraudes e usos indevidos;</li>
              <li>cumprimento de obrigações legais ou regulatórias;</li>
              <li>melhoria da segurança, estabilidade e funcionamento do aplicativo;</li>
              <li>atendimento de solicitações realizadas pelo usuário;</li>
              <li>exercício regular de direitos da empresa, quando aplicável.</li>
            </ul>
            <p className="text-sm leading-relaxed text-gray-600">
              A empresa não utilizará os dados pessoais para finalidades
              incompatíveis com aquelas informadas ao usuário ou com as bases
              legais aplicáveis.
            </p>
          </section>

          {/* Base legal */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Base legal</h2>
            <p className="text-sm leading-relaxed text-gray-600">
              O tratamento dos dados pessoais será realizado de acordo com uma
              ou mais bases legais previstas na legislação aplicável, incluindo,
              quando apropriado:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-sm leading-relaxed text-gray-600">
              <li>
                execução de contrato ou de procedimentos preliminares
                relacionados ao contrato;
              </li>
              <li>cumprimento de obrigação legal ou regulatória;</li>
              <li>exercício regular de direitos;</li>
              <li>
                legítimo interesse, quando aplicável e respeitados os direitos e
                liberdades do titular;
              </li>
              <li>consentimento do usuário, quando exigido pela legislação.</li>
            </ul>
            <p className="text-sm leading-relaxed text-gray-600">
              Quando o tratamento depender de consentimento, o usuário poderá
              revogá-lo nos termos da legislação aplicável, observando-se que a
              revogação poderá afetar determinadas funcionalidades que dependam
              daquele tratamento.
            </p>
          </section>

          {/* Compartilhamento de dados */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Compartilhamento de dados
            </h2>
            <p className="text-sm leading-relaxed text-gray-600">
              Os dados pessoais poderão ser compartilhados quando necessário
              para o funcionamento do aplicativo e para as finalidades descritas
              nestes Termos e na Política de Privacidade.
            </p>
            <p className="text-sm leading-relaxed text-gray-600">
              Isso poderá incluir, quando aplicável:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-sm leading-relaxed text-gray-600">
              <li>fornecedores de serviços de tecnologia;</li>
              <li>serviços de hospedagem e armazenamento;</li>
              <li>serviços de autenticação;</li>
              <li>serviços de envio de e-mails, SMS ou notificações;</li>
              <li>prestadores responsáveis por suporte e manutenção;</li>
              <li>
                autoridades públicas, quando houver obrigação legal ou
                determinação válida;
              </li>
              <li>
                terceiros necessários para prevenção de fraudes, segurança ou
                cumprimento de obrigações legais.
              </li>
            </ul>
            <p className="text-sm leading-relaxed text-gray-600">
              A empresa buscará exigir de seus fornecedores e parceiros medidas
              adequadas de proteção e segurança dos dados pessoais.
            </p>
          </section>

          {/* Armazenamento e segurança */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Armazenamento e segurança
            </h2>
            <p className="text-sm leading-relaxed text-gray-600">
              A empresa adotará medidas técnicas e administrativas razoáveis para
              proteger os dados pessoais contra acessos não autorizados, perda,
              alteração, divulgação ou destruição indevida.
            </p>
            <p className="text-sm leading-relaxed text-gray-600">
              Apesar das medidas de segurança adotadas, nenhum sistema
              eletrônico pode ser considerado completamente imune a riscos.
            </p>
            <p className="text-sm leading-relaxed text-gray-600">
              Os dados poderão ser armazenados pelo período necessário para
              cumprir as finalidades para as quais foram coletados, atender
              obrigações legais e regulatórias, solucionar disputas e exercer ou
              defender direitos.
            </p>
            <p className="text-sm leading-relaxed text-gray-600">
              Após o término da necessidade de retenção, os dados poderão ser
              excluídos, anonimizados ou mantidos quando houver fundamento legal
              para sua conservação.
            </p>
          </section>

          {/* Direitos do usuário */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Direitos do usuário
            </h2>
            <p className="text-sm leading-relaxed text-gray-600">
              Nos termos da legislação aplicável, especialmente da LGPD, o
              usuário poderá exercer direitos relacionados aos seus dados
              pessoais, incluindo, quando aplicável:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-sm leading-relaxed text-gray-600">
              <li>confirmação da existência de tratamento;</li>
              <li>acesso aos dados pessoais;</li>
              <li>correção de dados incompletos, inexatos ou desatualizados;</li>
              <li>
                solicitação de anonimização, bloqueio ou eliminação de dados
                desnecessários ou tratados em desconformidade;
              </li>
              <li>portabilidade, quando aplicável;</li>
              <li>informações sobre compartilhamento de dados;</li>
              <li>
                revogação do consentimento, quando o tratamento estiver baseado
                em consentimento;
              </li>
              <li>
                solicitação de eliminação dos dados tratados com base em
                consentimento, observadas as exceções legais;
              </li>
              <li>oposição ao tratamento realizado nas hipóteses previstas em lei.</li>
            </ul>
            <p className="text-sm leading-relaxed text-gray-600">
              As solicitações poderão ser realizadas por meio do canal de
              contato disponibilizado neste documento.
            </p>
            <p className="text-sm leading-relaxed text-gray-600">
              Alguns pedidos poderão estar sujeitos às limitações e exceções
              previstas na legislação aplicável.
            </p>
          </section>

          {/* Exclusão da conta e dos dados */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Exclusão da conta e dos dados
            </h2>
            <p className="text-sm leading-relaxed text-gray-600">
              O usuário poderá solicitar a exclusão de sua conta e dos dados
              pessoais associados a ela, observadas as obrigações legais e
              regulatórias que possam exigir a manutenção de determinadas
              informações.
            </p>
            <p className="text-sm leading-relaxed text-gray-600">
              A exclusão da conta poderá resultar na perda de acesso às
              funcionalidades, informações e serviços vinculados à conta.
            </p>
            <p className="text-sm leading-relaxed text-gray-600">
              Quando determinados dados precisarem ser mantidos por obrigação
              legal, exercício regular de direitos ou outra hipótese prevista em
              lei, eles poderão permanecer armazenados pelo período necessário.
            </p>
          </section>

          {/* Permissões do dispositivo */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Permissões do dispositivo
            </h2>
            <p className="text-sm leading-relaxed text-gray-600">
              O aplicativo poderá solicitar determinadas permissões do
              dispositivo exclusivamente quando necessárias para disponibilizar
              funcionalidades específicas.
            </p>
            <p className="text-sm leading-relaxed text-gray-600">
              Entre elas, poderão estar:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-sm leading-relaxed text-gray-600">
              <li>
                <strong className="font-semibold text-gray-800">Câmera:</strong>{' '}
                utilizada para permitir que o usuário capture uma imagem para
                utilização como foto de perfil;
              </li>
              <li>
                <strong className="font-semibold text-gray-800">
                  Fotos/Galeria:
                </strong>{' '}
                utilizada para permitir que o usuário selecione uma imagem
                existente para utilização como foto de perfil;
              </li>
              <li>
                <strong className="font-semibold text-gray-800">
                  Notificações:
                </strong>{' '}
                utilizadas para enviar comunicações relacionadas ao aplicativo,
                quando autorizadas pelo usuário e aplicável ao funcionamento do
                serviço.
              </li>
            </ul>
            <p className="text-sm leading-relaxed text-gray-600">
              O usuário poderá gerenciar essas permissões por meio das
              configurações do próprio dispositivo, observando que a revogação
              de determinadas permissões poderá impedir o funcionamento de
              funcionalidades que dependam delas.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
