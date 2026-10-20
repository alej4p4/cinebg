# 🤖 Instruções para Agentes de IA — CineBG

Este documento é a instrução mandatória para **qualquer modelo ou agente de inteligência artificial** (Google DeepMind, Anthropic, OpenAI, Meta, etc.) atuando no repositório **CineBG**.

---

## 🚨 1. PROTOCOLO MANDATÓRIO DE FLUXO DE TRABALHO (ISSUES & PRs)

Antes de iniciar qualquer intervenção no código:

### 1.1 Criar ou Vincular a Issue no GitHub
Nenhuma linha de código deve ser alterada sem uma Issue de referência criada no GitHub:
* Se a solicitação do usuário for uma **Correção**, crie ou aponte uma Issue do tipo `fix: <descrição>`.
* Se a solicitação for uma **Melhoria**, crie ou aponte uma Issue do tipo `improvement: <descrição>`.
* Se a solicitação for uma **Nova Função**, crie ou aponte uma Issue do tipo `feat: <descrição>`.

### 1.2 Isolar em Branch de Trabalho
* Crie a branch específica no Git baseada no tipo e ID da issue:
  * Exemplo: `fix/issue-1-sandbox-player`
  * Exemplo: `feature/issue-2-multiaudio`

### 1.3 Gerenciar Deploys estritamente por Pull Requests (PRs)
* Todo merge para a branch `main` representa um potencial deploy.
* **MENCIONE A ISSUE NA DESCRIÇÃO DO PR**: O PR deve conter obrigatoriamente a sintaxe:
  * `Fixes #<ID_DA_ISSUE>`
  * `Closes #<ID_DA_ISSUE>`
  * `Resolves #<ID_DA_ISSUE>`

---

## ✨ 2. DESIGN & MOTION PRINCIPLES (KYLE ZANTOS)

Toda interface do sistema deve seguir rigorosamente os princípios de Motion Design (`github.com/kylezantos/design-principles`):
* **Skeletons em Todas as Telas**: Nenhum carregamento de página, carrossel, grade de canais (`LiveTV`), busca (`Search`) ou detalhes (`Details`) deve exibir telas vazias ou spinners isolados sem estrutura. Utilize sempre componentes de Skeleton com efeito shimmer suave (`SkeletonCard`, `SkeletonCarousel`, `SkeletonGrid`, `SkeletonDetailPage`, `SkeletonLiveTV`).
* **Lazy Loading Inteligente**: Todas as imagens, pôsteres, backdrops e rotas devem utilizar carregamento sob demanda (`LazyImage` com `IntersectionObserver`, placeholder shimmer antes do `onLoad` e transição suave de opacidade/escala).
* **Smooth Animations (Entrada, Saída, Carregamento e Progresso)**:
  * Curvas de aceleração baseadas em física real (`FLUID_EASE`, `SPRING_SNAPPY`, `SPRING_GENTLE` em `src/utils/motion.ts`).
  * Animações suaves de entrada (`initial` -> `animate`), saída (`exit` via `AnimatePresence`), estados de carregamento e barras de progresso (`ProgressBar`) em todos os fluxos de usuário e cards (`MovieCard`, `YuCineChannelCard`), preservando 60fps constantes em Smart TVs e TV Boxes.

---

## 🔭 3. OBSERVABILIDADE FULL-STACK

O sistema deve manter instrumentação contínua e unificada em `src/services/observability.ts` cobrindo os 4 provedores padrão da indústria:
* **Sentry**: Captura automática de exceções React (`ErrorBoundary`), `window.onerror` e `unhandledrejection`.
* **Datadog (RUM & Logs)**: Rastreamento de interações de usuário, rotas, métricas de sessão e logs estruturados.
* **New Relic**: Monitoramento de eventos customizados de reprodução (`stream_start`, `stream_Switch`, `stream_error`) e performance WebView/Android TV.
* **OpenTelemetry (OTLP)**: Rastreamento distribuído com geração de `traceId`/`spanId` (W3C Trace Context) para chamadas de API TMDB, resolução de streams e carregamento de canais ao vivo.

---

## 🛡️ 4. QUALIDADE E INTEGRIDADE DE CÓDIGO

Antes de cada Pull Request ou Release, o código deve respeitar todas as ferramentas de governança e integridade:
* **ArchUnit / Arch-Contract (`scripts/arch-contract.mjs`)**: Validação de fronteiras arquiteturais (ex.: `src/types` não importa camadas superiores; `src/components/ui` não importa `src/pages`; ausência de dependências circulares proibidas). Execute via `npm run test:arch`.
* **Biome (`biome.json`)**: Formatação padronizada, lint estático ultrarrápido e organização de imports.
* **Commitlint (`commitlint.config.js`)**: Padronização estrita de mensagens de commit no formato Conventional Commits (`feat:`, `fix:`, `improvement:`, `chore:`, `test:`, `docs:`).
* **Knip (`knip.json`)**: Detecção de código morto, exports não utilizados e dependências órfãs.
* **Stryker (`stryker.config.json`)**: Testes de mutação para assegurar a eficácia real da suíte de testes.

---

## 🧪 5. TESTES UNITÁRIOS, INTEGRAÇÃO E END-TO-END (E2E)

* **Testes Unitários e de Integração (`tests/unit/`)**: Validação de resolução de streams, detecção de dispositivos Smart TV vs. Mobile (`src/utils/tv.ts`), roteamento de atualizações OTA (`CineBG-Tv-release.apk` vs `CineBG-Mobile-release.apk`) e telemetria. Execute via `npm run test:unit`.
* **Testes End-to-End com Playwright (`playwright.config.ts` & `tests/e2e/`)**: Validação de fluxos críticos de navegação espacial D-Pad, busca, detalhes estilo YouCine, TV ao vivo e player.
* **Cobertura com Codecov (`codecov.yml` & `.github/workflows/ci-quality.yml`)**: Relatórios automatizados de cobertura de código em cada Pull Request.

---

## ✅ 6. CRITÉRIO DE ACEITE TÉCNICO

O agente **NUNCA** deve considerar uma tarefa finalizada ou abrir PR sem antes executar e validar com sucesso:
```bash
npm run test:arch
npm run test:unit
npm run build
```
O build deve terminar com código `0` sem erros de TypeScript (`tsc`) ou quebras de bundle da Vite.

---

## 🧠 7. GRAPHIFY (KNOWLEDGE GRAPH)

This project has a knowledge graph at `graphify-out/` with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- When `graphify-out/graph.json` exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than `GRAPH_REPORT.md` or raw grep output.
- Dirty `graphify-out/` files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If `graphify-out/wiki/index.md` exists, use it for broad navigation instead of raw source browsing.
- Read `graphify-out/GRAPH_REPORT.md` only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed `graphify-out/graph.json` is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
