# 🤖 Instruções para Agentes de IA — CineBG

Este documento é a instrução mandatória para **qualquer modelo ou agente de inteligência artificial** (Google DeepMind, Anthropic, OpenAI, Meta, etc.) atuando no repositório **CineBG**.

---

## 🚨 PROTOCOLO MANDATÓRIO DE TRABALHO

Antes de iniciar qualquer intervenção no código:

### 1. Criar ou Vincular a Issue
Nenhuma linha de código deve ser alterada sem uma Issue de referência.
* Se a solicitação do usuário for uma **Correção**, crie ou aponte uma Issue do tipo `fix: <descrição>`.
* Se a solicitação for uma **Melhoria**, crie ou aponte uma Issue do tipo `improvement: <descrição>`.
* Se a solicitação for uma **Nova Função**, crie ou aponte uma Issue do tipo `feat: <descrição>`.

### 2. Isolar em Branch de Trabalho
* Crie a branch específica no Git baseada no tipo e ID da issue:
  * Exemplo: `fix/issue-1-sandbox-player`
  * Exemplo: `feature/issue-2-multiaudio`

### 3. Gerenciar Deploys estritamente por Pull Requests (PRs)
* Todo merge para a branch `main` representa um potencial deploy.
* **MENCIONE A ISSUE NA DESCRIÇÃO DO PR**: O PR deve conter obrigatoriamente a sintaxe:
  * `Fixes #<ID_DA_ISSUE>`
  * `Closes #<ID_DA_ISSUE>`
  * `Resolves #<ID_DA_ISSUE>`

### 4. Critério de Aceite Técnico
O agente **NUNCA** deve considerar uma tarefa finalizada ou abrir PR sem antes executar e validar com sucesso:
```bash
npm run build
```
O build deve terminar com código `0` sem erros de TypeScript (`tsc`) ou quebras de bundle da Vite.
