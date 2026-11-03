# Ecos de Ballynyr

Site narrativo privado para a seleção exclusiva de seis personagens de uma campanha de Ordem Paranormal: Playtest Beta.

## Iniciar

Requer Node.js 22 ou superior e PostgreSQL 17 (Neon).

```sh
npm ci
```

Copie `.env.example` para `.env.local` e configure as variáveis. A entrega local já possui um `.env.local` separado do ZIP, conectado à base de produção criada para este projeto. Consulte a chave administrativa nesse arquivo; ela não aparece no código público nem no relatório.

```sh
npm run db:migrate
npm run dev
```

Abra `http://localhost:3000/admin`, entre com `ADMIN_KEY` e crie um convite nominal para cada jogador. Copie o link no momento da criação. Para iniciar a versão de produção local:

```sh
npm run build
npm start
```

## Experiência do jogador

- As 12 perguntas e as descrições do protótipo foram preservadas. Cada resposta soma 3 pontos ao perfil principal e 1 ao secundário. Empates usam a ordem alfabética dos IDs.
- A conclusão atribui o personagem disponível de maior compatibilidade. Como a atribuição é imediata, a ordem de conclusão influencia a disponibilidade; não é uma otimização coletiva posterior.
- Nenhum perfil, peso ou ilustração é enviado ao jogador antes de concluir. As seis imagens originais estão em `assets/portraits`, fora da pasta pública. O endpoint de imagens exige sessão do mestre ou a sessão do próprio jogador com o resultado correspondente.
- O convite nominal funciona como um segredo de acesso: quem abrir primeiro e iniciar assume a jornada. O nome não verifica identidade. Envie cada link diretamente ao respectivo jogador.
- Convites novos expiram em 30 dias. Depois de iniciada, a jornada pode ser retomada no mesmo navegador enquanto o cookie de 30 dias existir. Respostas são salvas ao clicar em Continuar.
- A conclusão é permanente. Reenviar a solicitação devolve o mesmo resultado; nunca consome outro personagem. O convite não pode iniciar uma segunda jornada.
- Se o jogador perder o navegador ou seus cookies antes de concluir, o mestre pode usar Novo link. Isso invalida o acesso anterior e reinicia suas respostas. Resultados concluídos não podem ser liberados pelo painel.
- A revelação usa a ilustração original com transição de névoa, iluminação e composição responsiva. Não há espera artificial. Movimento reduzido é respeitado; não há áudio automático.

## Mestre e segurança

O painel usa cookie HttpOnly, Secure em produção, SameSite=Strict e validade de oito horas. A chave é validada no servidor com comparação de hashes em tempo constante; nunca é guardada no navegador. Mudar ADMIN_KEY invalida as sessões assinadas anteriores. Encerrar sessão remove o cookie deste navegador.

Há validação de JSON e limite de 8 KiB, verificação de origem nas operações de escrita, SQL parametrizado, limitação persistente de tentativas e cabeçalhos de segurança. Na Vercel, a limitação usa o IP fornecido pela plataforma, armazenado como hash. Em ambientes sem esse cabeçalho, o limite é compartilhado por escopo. Configure proteção adicional na plataforma se houver exposição a tráfego abusivo.

O banco armazena apenas hashes dos links e dos segredos de sessão. Links completos só aparecem na criação ou substituição. O registro administrativo mantém eventos, identificação do convite e horários; não registra chaves ou tokens. Os horários do painel são exibidos em America/Manaus.

`ecos_create`, `ecos_finish` e `ecos_manage` bloqueiam a mesma linha de controle antes de contar vagas ou atribuir personagens. As operações e o registro de auditoria são confirmados juntos. As restrições UNIQUE de personagem e convite permanecem como proteção adicional.

A CSP permite scripts inline necessários à hidratação padrão do Next.js. Não há scripts externos nem HTML arbitrário do jogador. Esta revisão não equivale a uma auditoria externa ou garantia absoluta de segurança.

## Banco criado

Organização: `dev.capivara1459@gmail.com`.
Projeto: `withered-surf-29871170`, região São Paulo (`aws-sa-east-1`), PostgreSQL 17.

- `production`: `br-empty-pond-b609td6s`. Esquema aplicado; sem jogadores de teste.
- `development-verification`: `br-dry-poetry-b6bntc4r`. Primeiro conjunto de testes.
- `verification-final`: `br-hidden-dust-b675gkxs`. Verificação final e evidências.

As branches de testes foram mantidas para consulta. Não use suas conexões para os jogadores reais. As credenciais não estão no ZIP. O endereço local de produção está no `.env.local` ignorado pelo Git.

## Migração de uma instalação anterior

Preserve um backup e teste em uma branch Neon antes de aplicar a um banco existente. `schema.sql` preserva as tabelas, personagens, convites, respostas e atribuições do protótipo; acrescenta campos, funções, limites e auditoria. Pode ser reaplicado. Convites legados com status started não possuem sessão recuperável: substitua o link no painel. Resultados legados ficam disponíveis ao mestre; não são expostos a alguém que só possua o link antigo.

O runner usa DATABASE_URL_UNPOOLED quando definida. Use conexão direta para a migração e conexão pooled para a aplicação. Não execute migrações automaticamente no build da Vercel: cada preview deve apontar para uma branch isolada. A migração foi testada em banco novo, por reaplicação e sobre o esquema original com convites e atribuições sintéticos. Os convites iniciados, resultados, respostas e atribuições foram preservados. Não havia dados reais anexados para testar uma atualização de produção existente.

## Preparar a Vercel

1. Suba o conteúdo deste diretório para um repositório privado. Inclua `package-lock.json`, `assets`, `schema.sql` e `next.config.ts`. Exclua `.env.local`, node_modules, .next e relatórios de testes.
2. Importe como projeto Next.js. Use Node.js 22.x ou 24.x. `vercel.json` já define o build.
3. Configure em Production: DATABASE_URL (conexão Neon pooled), ADMIN_KEY (valor aleatório de pelo menos 32 caracteres) e SITE_URL (origem HTTPS final, sem caminho).
4. Execute a migração com a conexão direta da branch de produção. O banco criado nesta entrega já está migrado.
5. Em Preview, use outra branch Neon e outra chave. SITE_URL deve corresponder exatamente à origem do preview. Não copie a conexão de produção para previews.
6. Faça o deploy e confira autenticação, criação de convite e jornada numa base de teste. As imagens privadas são incluídas pelo outputFileTracingIncludes.
7. Antes de convidar jogadores reais, confirme que a branch de produção tem seis personagens livres e nenhum convite de teste.

A publicação na Vercel não foi executada: o pedido foi preparar o deploy. Não há URL pública desta entrega.

## Verificação

```sh
npm run typecheck
npm test
npm run build
npm audit
```

Para o teste completo, use uma branch vazia isolada, aplique schema.sql e inicie a aplicação com sua conexão. Configure ADMIN_KEY no ambiente do processo de testes com o mesmo valor do servidor.

```sh
npx playwright install chromium
npm run test:e2e
```

TEST_BASE_URL permite testar uma origem diferente de localhost:3000. O teste cria convites, revoga um, substitui um link e conclui seis jornadas; ele deixa esses dados na branch de testes e exige uma base vazia para uma nova execução. Não rode contra a campanha real.

O relatório de entrega descreve as verificações e limitações. As capturas do questionário não revelam personagens; capturas administrativas e de revelação devem ser vistas somente pelo mestre.

