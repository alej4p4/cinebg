# 🎬 CineBG

> **Plataforma de Streaming Multi-dispositivo de Alta Fidelidade (Web & Android TV/Mobile) com experiência nativa estilo YuCine, motor multi-áudio dublado (PT-BR) e escudo anti-redirecionamento.**

---

## 🚀 Visão Geral do Projeto

O **CineBG** é uma aplicação moderna desenvolvida com **React 18**, **TypeScript**, **Tailwind CSS**, **Framer Motion** e empacotada para ecossistemas mobile e Smart TV através do **Capacitor 6**. 

O projeto foi projetado com base na arquitetura e experiência de usuário de plataformas de ponta como o YuCine, eliminando fricções de seleção técnica de servidores e garantindo reprodução contínua e limpa.

### Principais Pilares:
* **Escudo Anti-Redirect & Anti-Popups**: O player é isolado via sandbox HTML5 (`allow-scripts allow-same-origin allow-forms allow-presentation allow-encrypted-media` sem permissões de navegação de topo ou popups), impedindo sequestros de tela, páginas da ParkLogic e anúncios intrusivos.
* **Motor Multi-Áudio com Foco em Dublagem (PT-BR)**: Suporte primário a conteúdos com áudio dublado e contingência limpa de alta velocidade para áudio original/legendado.
* **Cascata Silenciosa de Fallback (Estilo YuCine)**: O usuário não precisa testar ou escolher servidores. O sistema tenta a melhor rota e alterna automaticamente caso uma fonte sofra instabilidade.
* **Pronto para Android TV & Mobile**: Compatível com navegação espacial via D-pad/controle remoto (`@noriginmedia/norigin-spatial-navigation`) e empacotamento em APK via Capacitor.

---

## 🛠️ Tecnologias Utilizadas

* **Front-end**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Framer Motion.
* **Roteamento & Estado**: React Router DOM v6, Zustand com persistência local.
* **Integração de Mídia**: The Movie Database (TMDB API) + Motores de Stream Dedicados.
* **Mobile / TV**: Capacitor 6 (`@capacitor/android`, `@capacitor/core`).
* **Qualidade & Build**: Vite 5, PostCSS, Autoprefixer, TypeScript Compiler.

---

## 📋 Padrão Obrigatório de Governança e Deploys (GitHub Flow)

> **AVISO A TODOS OS DESENVOLVEDORES E AGENTES DE IA**:
> Para manter a estabilidade do sistema e gerenciar com precisão os deploys do CineBG, o padrão abaixo é **obrigatório** em qualquer ciclo de alteração.

### 1. Toda Tarefa Deve Ter uma Issue Aberta
Antes de qualquer alteração, abra uma Issue no GitHub categorizada como:
* `[Correção]` / `fix:` — Resolução de bugs, travamentos ou redirecionamentos indevidos.
* `[Melhoria]` / `improvement:` — Refinamento de performance, UX, fallback ou interface.
* `[Nova Função]` / `feat:` — Adição de novas telas, funcionalidades ou integração com novos dispositivos.

### 2. Fluxo de Branch e Desenvolvimento
* Crie sempre uma branch temática a partir da `main`:
  * `fix/issue-<ID>-<nome-curto>`
  * `improvement/issue-<ID>-<nome-curto>`
  * `feature/issue-<ID>-<nome-curto>`
* Nunca realize commits diretos na branch `main`.

### 3. Deploys Gerenciados Estritamente por Pull Requests (PRs)
* Todo deploy para produção é acionado e auditado através de um **Pull Request**.
* **Menção Obrigatória da Issue**: A descrição do PR deve conter explicitamente a instrução de fechamento da issue correspondente:
  * Exemplo: `Fixes #12` ou `Closes #15`.
* Nenhum PR deve ser mesclado sem validação prévia com `npm run build` e `npx tsc --noEmit`.

Consulte o arquivo [`CONTRIBUTING.md`](./CONTRIBUTING.md) para detalhes completos e modelos de templates.

---

## 📦 Scripts Disponíveis

```bash
# Instalação de dependências
npm install

# Iniciar servidor de desenvolvimento local
npm run dev

# Validar tipagem e gerar build de produção
npm run build

# Pré-visualizar build localmente
npm run preview

# Sincronizar projeto com a pasta Android do Capacitor
npm run cap:sync

# Abrir projeto Android no Android Studio
npm run cap:open

# Compilar e sincronizar build para geração do APK
npm run build:apk
```

---

## 🔒 Arquitetura de Segurança do Player

O componente [`StreamPlayer.tsx`](./src/components/player/StreamPlayer.tsx) opera com duas camadas complementares:
1. **Engine Sandbox**: O iframe não recebe permissão `allow-top-navigation` nem `allow-popups`. Isso garante no nível do motor do navegador que popups ou links externos não consigam abrir ou sequestrar o app.
2. **Anti-Redirect Shield**: Módulo utilitário [`src/utils/antiRedirect.ts`](./src/utils/antiRedirect.ts) que bloqueia invocações globais de `window.open` e captura eventos de descarregamento não autorizados acionados por terceiros.
