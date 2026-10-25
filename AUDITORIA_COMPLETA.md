# �� AUDITORIA COMPLETA - CineBG
**Data:** 23/10/2026  
**Auditado por:** Arquiteto de Software Sênior, QA, Segurança, Banco de Dados e Performance  
**Versão auditada:** v1.2.76 (main)

---

## �� MAPEAMENTO COMPLETO DO SISTEMA

### 1.1 Estrutura de Módulos

| Setor | Caminho | Responsabilidade |
|-------|---------|------------------|
| Entry Point | `src/main.tsx` | Bootstrap React + handlers globais de erro |
| Raiz da App | `src/App.tsx` | Roteamento, estado de splash, error state, verificador de atualização |
| Rotas | `src/App.tsx` (AnimatedRoutes) | 13 rotas + redirecionamentos canônicos |
| Estado Global | `src/store/useAppStore.ts` | Zustand: perfis, favoritos, histórico, áudio, legenda, downloads, VIP, OTA |
| Licença/Trial | `src/hooks/useLicense.ts` | Trial de 3 dias, validação de licença, device binding |
| Observabilidade | `src/services/observability.ts` | Sentry, Datadog, New Relic, OTLP |
| Streams | `src/services/streams.ts` | Resolução de fontes MegaEmbed, filtros anti-ads/camrip |
| TMDB API | `src/services/tmdb.ts` | Catálogo, detalhes, busca, imagens otimizadas |
| Player Principal | `src/components/player/StreamPlayer.tsx` | HLS.js, MP4 nativo, Iframe fallback, fallback automático |
| Player Live TV | `src/components/player/LivePlayer.tsx` | Canais ao vivo, EPG, troca de sinal |
| Atualização OTA | `src/services/appUpdater.ts` | Download e instalação de APK via Capacitor |
| Modal Atualização | `src/components/UpdateModal.tsx` | UI de download/instalação com suporte D-Pad |
| Detecção Dispositivo | `src/utils/tv.ts` | Mobile vs TV, detecção de sabor do APK |
| Anti-Redirect | `src/utils/antiRedirect.ts` | Bloqueio de pop-ups e redirects de iframe |
| Buffer | `src/utils/buffer.ts` | Configurações de buffer HLS |
| Motion | `src/utils/motion.ts` | Tokens de animação (Kyle Zantos) |
| Anti-Redirect Shield | `src/utils/antiRedirect.ts` | Escudo contra pop-ups e redirects |
| Android Main | `android/app/src/main/java/.../MainActivity.java` | Entry point nativo, WebView config, OTA install |
| Android Installer | `android/app/src/main/java/.../AppInstallerPlugin.java` | Download e instalação de APK no Android |
| Android Manifest | `android/app/src/main/AndroidManifest.xml` | Permissões, features, config da activity |
| Android Build | `android/app/build.gradle` | Build variants mobile/tv, signing config |
| CI/CD | `.github/workflows/` | (não encontrado - ausente) |

### 1.2 Dependências Externas Críticas

| Dependência | Versão | Propósito | Risco |
|-------------|--------|-----------|-------|
| `mgeb.site` | Externo | Fontes de stream (MegaEmbed) | Alta - site externo pode sair do ar |
| `vidlink.pro` | Externo | Fontes de stream (VidLink) | Alta - site externo pode sair do ar |
| `api.themoviedb.org` | Externo | Metadados de filmes/séries | Média - depende de API key |
| `image.tmdb.org` | Externo | Pôsteres e backdrops | Média - CDN externo |
| `github.com/alej4p4/cinebg/releases` | Externo | Download de APKs OTA | Alta - release do GitHub |
| `@capacitor/*` | 6.1.0 | Bridge WebView nativo | Baixa - bem mantida |
| `hls.js` | 1.7.3 | Reprodução HLS | Baixa - bem mantida |
| `framer-motion` | 11.3.0 | Animações | Baixa - bem mantida |
| `zustand` | 4.5.0 | Estado global | Baixa - bem mantida |

### 1.3 Fluxos de Entrada/Saída de Dados

**Entrada:**
1. Usuário → Navegação (routes)
2. Usuário → Busca (TMDB API)
3. Usuário → Reprodução de stream (mgeb.site, vidlink.pro)
4. Usuário → Atualização OTA (GitHub Releases)
5. Sistema → Telemetria (Sentry, Datadog, New Relic, OTLP)

**Saída:**
1. Requisições HTTP para TMDB API
2. Requisições HTTP para mgeb.site/vidlink.pro (streams)
3. Requisições HTTP para GitHub Releases (download APK)
4. Requisições HTTP para endpoints de observabilidade (Sentry, Datadog, New Relic, OTLP)
5. Armazenamento local (localStorage, SharedPreferences Android)

---

## �� DETECÇÃO DE PROBLEMAS - SETOR POR SETOR

### 2.1 CRÍTICO - Segurança

| # | Local | Problema | Severidade | Causa Raiz |
|---|-------|----------|------------|------------|
| S-001 | `capacitor.config.ts` | `androidScheme: 'http'` fazia WebView tentar conectar a `http://localhost` no dispositivo (CORRIGIDO na v1.2.75) | CRÍTICO | Configuração incorreta do Capacitor |
| S-002 | `AndroidManifest.xml` | `android:usesCleartextTraffic="true"` permite tráfego HTTP não criptografado | ALTO | Configuração de manifesto Android |
| S-003 | `AndroidManifest.xml` | `android:exported="true"` na MainActivity expõe a activity para outros apps | MÉDIO | Configuração de manifesto Android |
| S-004 | `AndroidManifest.xml` | `android:allowBackup="true"` permite backup de dados sensíveis via adb | MÉDIO | Configuração de manifesto Android |
| S-005 | `android/app/build.gradle` | Fallback para `debug.keystore` quando keystore de produção não existe | ALTO | Assinatura inconsistente entre builds |
| S-006 | `src/services/tmdb.ts` | `VITE_TMDB_API_KEY` é throw se não definida, mas fica exposta no bundle | BAIXA | Variável de ambiente no client-side |
| S-007 | `src/services/observability.ts` | Envia telemetria para endpoints externos sem consentimento do usuário (LGPD/GDPR) | ALTO | Falta de consentimento/opt-in |
| S-008 | `src/services/trial.ts` | `logAuditEvent` escreve em localStorage sem criptografia | BAIXA | Dados sensíveis em texto plano |
| S-009 | `src/hooks/useLicense.ts` | Device ID gerado com `Math.random()` (não criptograficamente seguro) | BAIXA | Não usa crypto.getRandomValues |
| S-010 | `src/components/player/StreamPlayer.tsx` | `window.open = () => null` sobrescreve global sem restauração adequada em todos os caminhos | BAIXA | Escudo anti-popup incompleto |

### 2.2 CRÍTICO - Funcionalidade / Estabilidade

| # | Local | Problema | Severidade | Causa Raiz |
|---|-------|----------|------------|------------|
| F-001 | `capacitor.config.ts` | `launchShowDuration: 0` com `launchAutoHide: true` pode esconder splash antes do WebView carregar (CORRIGIDO na v1.2.75) | CRÍTICO | Configuração de splash premature |
| F-002 | `capacitor.config.ts` | `androidScheme: 'http'` causa `connection refused` no Android (CORRIGIDO na v1.2.75) | CRÍTICO | Configuração incorreta |
| F-003 | `src/services/streams.ts` | Cache em memória (`resolvedSourcesCache`) não persiste entre reinicializações do app | ALTO | Cache apenas em memória RAM |
| F-004 | `src/services/streams.ts` | `resolveMegaEmbed` timeout de 10s sem retry para sources que falham | MÉDIO | Sem retry em fontes de stream |
| F-005 | `src/components/player/StreamPlayer.tsx` | `autoFallbackTimerRef` de 8s pode ser muito agressivo para conexões 3G/4G lentas | MÉDIO | Timeout muito curto para redes móveis |
| F-006 | `src/components/UpdateModal.tsx` | `effectiveDownloadUrl` chama `getDeviceUpdateUrl()` mas não lida com caso de URL inválida | MÉDIO | Validação insuficiente de URL |
| F-007 | `android/app/src/main/java/.../AppInstallerPlugin.java` | Download de APK em thread Java nativa sem limpeza de arquivo temporário em caso de falha | MÉDIO | Vazamento de arquivo temporário |
| F-008 | `src/services/appUpdater.ts` | `downloadId` usa a URL como identificador, mas não há limpeza de downloads cancelados | BAIXA | Gerenciamento incompleto de downloads |
| F-009 | `src/App.tsx` | `useEpisodeNotifications()` chama `checkForNewEpisodes()` sem verificar se está em plataforma nativa | BAIXA | Chamada desnecessária em web |
| F-010 | `src/hooks/useLicense.ts` | `fetch('/licenses.json')` sem timeout - pode travar indefinidamente | MÉDIO | Sem timeout na requisição de licença |

### 2.3 CRÍTICO - Performance

| # | Local | Problema | Severidade | Causa Raiz |
|---|-------|----------|------------|------------|
| P-001 | `src/services/tmdb.ts` | `requestCache` limitado a 80 entradas - insuficiente para catálogo grande | MÉDIO | Cache muito pequeno |
| P-002 | `src/services/tmdb.ts` | `flushStorageQueue` processa apenas 2 itens por vez - lento para grandes volumes | MÉDIO | Throughput baixo na fila de storage |
| P-003 | `src/services/tmdb.ts` | `hashString` implementação customizada em vez de usar SubtleCrypto | BAIXA | Hash customizado ineficiente |
| P-004 | `src/components/player/StreamPlayer.tsx` | Muitos `useEffect` com dependências extensas podem causar re-renders desnecessários | MÉDIO | React hooks não otimizados |
| P-005 | `src/store/useAppStore.ts` | `dataByProfile` cresce indefinidamente com perfis e dados | BAIXA | Sem limite de tamanho do estado |
| P-006 | `android/app/build.gradle` | `minifyEnabled false` - sem ofuscação de código | BAIXA | Código legível no APK |

### 2.4 CRÍTICO - Qualidade / Código Morto

| # | Local | Problema | Severidade | Causa Raiz |
|---|-------|----------|------------|------------|
| Q-001 | `scripts/` | 37 arquivos `fix_*.py` e `check_braces*.py` - scripts temporários de correção não deveriam estar no repositório | ALTO | Scripts de correção temporários commitedos |
| Q-002 | `scripts/` | `fix_encoding_*.py` (12 arquivos) - scripts de correção de encoding duplicados | ALTO | Duplicação de scripts |
| Q-003 | `src/App.tsx` | Versão hardcoded `'1.2.64'` em `getNativeAppVersion('1.2.64')` - não atualizada automaticamente | BAIXA | Versão hardcoded |
| Q-004 | `src/utils/tv.ts` | `DEFAULT_TV_APK_URL` e `DEFAULT_MOBILE_APK_URL` apontam para `v1.0.18` - versão desatualizada | BAIXA | URLs default desatualizadas |
| Q-005 | `src/components/ui/SplashScreen.tsx` | Versão hardcoded `'1.2.62'` - não atualizada automaticamente | BAIXA | Versão hardcoded |
| Q-006 | `android/app/build.gradle` | `versionName "1.2.67"` e `versionCode 70` - não atualizados para v1.2.76 | ALTO | Versão do APK desatualizada |

### 2.5 CRÍTICO - Escalabilidade / Banco de Dados

| # | Local | Problema | Severidade | Causa Raiz |
|---|-------|----------|------------|------------|
| B-001 | `src/services/tmdb.ts` | `localStorage` usado como cache persistente - sem limitação de tamanho total | MÉDIO | Pode encher o storage do dispositivo |
| B-002 | `src/store/useAppStore.ts` | `persist` middleware do Zustand armazena todo o estado em localStorage | MÉDIO | localStorage tem limite de ~5-10MB |
| B-003 | `src/services/trial.ts` | `AUDIT_LOG_KEY` cresce até 200 entradas, depois remove as mais antigas | BAIXA | Sem rotacionamento baseado em tempo |

### 2.6 CRÍTICO - CI/CD / Deploy

| # | Local | Problema | Severidade | Causa Raiz |
|---|-------|----------|------------|------------|
| D-001 | `.github/workflows/` | Diretório não encontrado - não há workflows de CI/CD | CRÍTICO | Ausência de automação de build/deploy |
| D-002 | `android/app/build.gradle` | `versionCode 70` e `versionName "1.2.67"` não refletem a versão real v1.2.76 | ALTO | Versionamento inconsistente |
| D-003 | `android/app/build.gradle` | Keystore de produção não configurada (fallback para debug.keystore) | ALTO | Assinatura inconsistente impede atualizações OTA |

---

## �� CORREÇÕES DEFINITIVAS

Abaixo estão as correções que devo aplicar. Vou listar cada uma com o arquivo, o problema e a solução.

### Correção S-005: Keystore de Produção (ANDROID BUILD)
**Arquivo:** `android/app/build.gradle`  
**Problema:** Fallback para `debug.keystore` quando keystore de produção não existe. Isso causa assinatura inconsistente e impede atualizações OTA.  
**Solução:** Falhar o build se keystore de produção não estiver configurada, em vez de usar debug.keystore silenciosamente.

### Correção S-002: Cleartext Traffic (ANDROID MANIFEST)
**Arquivo:** `android/app/src/main/AndroidManifest.xml`  
**Problema:** `android:usesCleartextTraffic="true"` permite tráfego HTTP não criptografado.  
**Solução:** Definir como `false` e configurar `network_security_config.xml` para domínios específicos que precisam de HTTP.

### Correção S-004: Allow Backup (ANDROID MANIFEST)
**Arquivo:** `android/app/src/main/AndroidManifest.xml`  
**Problema:** `android:allowBackup="true"` permite backup de dados sensíveis via adb.  
**Solução:** Definir como `false`.

### Correção Q-002: Scripts Temporários (SCRIPTS/)
**Arquivo:** `scripts/fix_*.py`, `scripts/check_braces*.py`  
**Problema:** 37 scripts temporários de correção no repositório.  
**Solução:** Remover todos os scripts `fix_*.py` e `check_braces*.py` do repositório. Eles são de uso único e não deveriam ser versionados.

### Correção Q-006: Versionamento do APK (ANDROID BUILD)
**Arquivo:** `android/app/build.gradle`  
**Problema:** `versionCode 70` e `versionName "1.2.67"` não refletem v1.2.76.  
**Solução:** Atualizar para `versionCode 76` e `versionName "1.2.76"`.

### Correção Q-003/Q-005: Versões Hardcoded (APP + SPLASH)
**Arquivo:** `src/App.tsx`, `src/components/ui/SplashScreen.tsx`  
**Problema:** Versões hardcoded `'1.2.64'` e `'1.2.62'`.  
**Solução:** Usar `import.meta.env.VITE_APP_VERSION` ou importar do package.json.

### Correção B-001: Limite de Storage (TMDB)
**Arquivo:** `src/services/tmdb.ts`  
**Problema:** Cache em localStorage sem limite de tamanho total.  
**Solução:** Implementar limpeza baseada em tamanho total do storage, não apenas contagem de entradas.

### Correção P-001: Cache LRU (TMDB)
**Arquivo:** `src/services/tmdb.ts`  
**Problema:** `MAX_RESOLVED_CACHE = 50` muito pequeno.  
**Solução:** Aumentar para 200 entradas.

---

Vou agora aplicar as correções definitivas, começando pelas mais críticas.