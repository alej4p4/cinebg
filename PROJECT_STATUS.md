# CineBG - Project Status

> **Última atualização**: 2026-10-25  
> **Versão atual**: v1.2.87 (web) / versionCode 77 (Android)
> **Release publicado**: https://github.com/alej4p4/cinebg/releases/tag/v1.2.87

---

## ✅ Estado Atual

### Build & Qualidade
- **Lint**: ✅ Passando
- **Testes unitários**: ✅ Passando
- **Teste arquitetural**: ✅ Passando (0 violações)
- **Build web**: ✅ Sucesso (Vite + TypeScript)
- **Build Android**: ✅ APKs gerados (Mobile + TV)
- **CI/CD**: ✅ Funcionando (GitHub Actions - release.yml)

### Release v1.2.87
- **Tag**: `v1.2.87`
- **APKs**: `CineBG-Mobile-release.apk` + `CineBG-Tv-release.apk`
- **versionCode**: 77 (ambos)
- **URL**: https://github.com/alej4p4/cinebg/releases/tag/v1.2.87
- **update.json**: versão 1.2.85 apontando para v1.2.86

### Releases Recentes

| Versão | Data | Principais correções |
|--------|------|---------------------|
| v1.2.86 | 2026-10-23 | Release final - update.json v1.2.85 + correção definitiva tela preta |
| v1.2.85 | 2026-10-23 | update.json → v1.2.84 + package-lock.json sync |
| v1.2.84 | 2026-10-23 | Correção definitiva tela preta (androidScheme removido) |
| v1.2.83 | 2026-10-23 | update.json → v1.2.82 |
| v1.2.82 | 2026-10-23 | Fix tela preta ao abrir APK (remove androidScheme http do Capacitor) |
| v1.2.81 | 2026-10-23 | update.json → v1.2.80 |
| v1.2.80 | 2026-10-23 | Fix manifest merger usesCleartextTraffic (tools:replace) |
| v1.2.79 | 2026-10-23 | Workflow usa keystore do repositorio quando secret nao configurado |
| v1.2.78 | 2026-10-23 | Keystore de release + update.json para v1.2.77 |
| v1.2.77 | 2026-10-23 | Auditoria completa de seguranca e desempenho |
| v1.2.76 | 2026-10-23 | update.json -> v1.2.75 |
| v1.2.75 | 2026-10-23 | Fix tela preta ao abrir APK (remove androidScheme http do Capacitor) |
| v1.2.74 | 2026-10-22 | update.json -> v1.2.73 |
| v1.2.73 | 2026-10-22 | Fix `connection refused` (removido `server.url: http://localhost` do capacitor.config.ts) |
| v1.2.72 | 2026-10-22 | update.json → v1.2.71 |
| v1.2.71 | 2026-10-22 | Fix tela preta em redes móveis (server.url, error handler global, ErrorState com retry) |
| v1.2.70 | 2026-10-22 | update.json → v1.2.69 |
| v1.2.69 | 2026-10-22 | Fix tela preta + limpeza de cache WebView |
| v1.2.67 | 2026-10-21 | Release base (Mobile + TV APKs) |

---

## 🎯 Funcionalidades Implementadas

### Live TV
- [x] EPG (Guia de Programação)
- [x] Categorias de canais
- [x] Favoritos
- [x] Player Live com troca de canal
- [x] Múltiplos sinais por canal com auto-fallback

### Player Core
- [x] HLS.js (m3u8) + MP4 nativo + Iframe fallback
- [x] MediaSession (controles de mídia)
- [x] Cache de streams
- [x] Auto-fallback entre fontes (dub/orig + pt/en/off)
- [x] Seleção correta de faixa de áudio/legenda
- [x] Autoplay garantido com áudio
- [x] Fallback automático sem botão de retry (estilo YuCine)
- [x] Error handler global com recarregamento automático em erro de rede

### Home UI
- [x] Hero Banner com animações
- [x] Carrosséis horizontais
- [x] Grades de conteúdo
- [x] Skeletons em todas as telas (shimmer)

### Details
- [x] Sinopse estilo YouCine
- [x] Modais (elenco, episódios, configurações)
- [x] Navegação espacial D-Pad

### Tema YouCine
- [x] Cores, tipografia, drawables
- [x] Animações (FLUID_EASE, SPRING_SNAPPY, SPRING_GENTLE)

### Correções Críticas (últimas releases - AUDITORIA COMPLETA)
- [x] Fix "App não instalado" - Detecção de pacote instalado (Java nativo)
- [x] Fix tela preta ao instalar/atualizar (watchdog SplashScreen + limpeza cache WebView)
- [x] Fix tela preta em redes móveis (error handler global, ErrorState retry, SplashScreen watchdog)
- [x] Fix `connection refused` localhost (removido `androidScheme: 'http'` do capacitor.config.ts)
- [x] Fix manifest merger usesCleartextTraffic (tools:replace no AndroidManifest.xml)
- [x] Segurança: `usesCleartextTraffic="false"` + `network_security_config.xml` para domínios confiáveis
- [x] Segurança: `allowBackup="false"` no AndroidManifest.xml
- [x] Segurança: Build falha se keystore de produção não estiver configurada (sem fallback para debug.keystore)
- [x] Qualidade: Removidos 37 scripts temporários `fix_*.py` e `check_braces*.py` do repositório
- [x] Qualidade: Versões hardcoded substituídas por `VITE_APP_VERSION` (App.tsx, SplashScreen.tsx)
- [x] Qualidade: `DEFAULT_*_APK_URL` atualizados para v1.2.76 (tv.ts)
- [x] Qualidade: `versionCode 70` → `76`, `versionName "1.2.67"` → `"1.2.76"` (build.gradle)
- [x] Performance: Cache LRU do TMDB aumentado de 80 para 200 entradas com limite de 50 MB
- [x] Performance: Cache de fontes resolvidas aumentado de 50 para 200 entradas
- [x] Performance: Limpeza de cache WebView a cada inicialização do app (MainActivity.java)
- [x] Auditoria: Timeout de 5s na requisição de licença remota (useLicense.ts)
- [x] Auditoria: Limpeza por tempo (30 dias) no log de auditoria do trial (trial.ts)
- [x] Auditoria: `update.json` atualizado para v1.2.85 (apontando para release v1.2.86)

---

## 📁 Arquivos Principais Modificados Recentemente

| Arquivo | Descrição |
|---------|-----------|
| `src/components/player/StreamPlayer.tsx` | Player principal - autoplay, seleção áudio/legenda, fallback automático |
| `src/components/player/LivePlayer.tsx` | Player Live TV - troca de sinal, EPG, OSD |
| `src/components/ui/ErrorState.tsx` | Componente de erro com retry |
| `src/App.tsx` | App raiz - watchdog SplashScreen, estado de erro |
| `src/main.tsx` | Entry point - error handler global (rede/ChunkLoadError) |
| `src/services/appUpdater.ts` | DownloadManager para OTA |
| `src/services/observability.ts` | Observabilidade (Sentry/Datadog/NewRelic/OTLP) |
| `src/hooks/useLicense.ts` | License/trial management |
| `src/utils/tv.ts` | Device detection utilities |
| `public/update.json` | OTA update manifest (v1.2.85) |
| `capacitor.config.ts` | Capacitor config (removido `server.url`) |
| `.github/workflows/release.yml` | Release workflow (CI/CD APK) |

---

## ⚠️ Problemas Conhecidos / Pendentes

1. **Testes E2E (Playwright)**: Não executados no CI atual - validar manualmente fluxos D-Pad
2. **Codecov**: Cobertura não verificada automaticamente no PR
3. **Stryker**: Testes de mutação não rodados recentemente
4. **Assinatura APK**: Usuários podem precisar desinstalar versão antiga antes de instalar nova (primeira atualização após mudança de keystore)

---

## 🔄 Próximos Passos Sugeridos

1. Configurar CI para rodar testes E2E + Codecov + Stryker
2. Melhorar logs de observabilidade (Sentry/Datadog/NewRelic/OTLP)
3. Testes de regressão em dispositivos reais (TV Box, Android TV)
4. Configurar secrets do CI (`KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`) para release automática completa

---

## 🔗 Links Úteis

- **GitHub Issues**: https://github.com/alej4p4/cinebg/issues
- **GitHub PRs**: https://github.com/alej4p4/cinebg/pulls
- **Release v1.2.86**: https://github.com/alej4p4/cinebg/releases/tag/v1.2.87
- **CI Pipeline**: https://github.com/alej4p4/cinebg/actions
- **APK Mobile**: https://github.com/alej4p4/cinebg/releases/download/v1.2.86/CineBG-Mobile-release.apk
- **APK TV**: https://github.com/alej4p4/cinebg/releases/download/v1.2.86/CineBG-Tv-release.apk
