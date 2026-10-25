# CineBG - Task Backlog & Roadmap

> **Versão**: v1.2.87  
> **Última atualização**: 2026-10-25  
> **Metodologia**: Kanban simples (Backlog → Doing → Done)

---

## 🎯 Sprint Atual (v1.2.87 - IN PROGRESS)

### ✅ Done
- [x] Fix definitivo tela preta ao abrir o APK no Android (Issue #250)
- [x] Fix connection refused (removido androidScheme: 'http' do capacitor.config.ts) - Issue #249
- [x] Fix tela preta em redes móveis (error handler global, ErrorState retry, SplashScreen watchdog) - Issue #246
- [x] Fix tela preta ao instalar/atualizar APK (watchdog SplashScreen + limpeza cache WebView) - Issue #244
- [x] Fix erro "App não instalado" - Detecção de pacote instalado nativa - Issue #242
- [x] Player funciona como YuCine - fallback automático sem botão de retry - Issue #240
- [x] CI/CD para build e publicação automática da APK release - Issue #23
- [x] Release v1.2.86 publicado (Mobile + TV APKs)
- [x] update.json atualizado para v1.2.85 (apontando para v1.2.86)
- [x] 54/54 testes passando
- [x] Arch contract: 67 módulos, 0 violações
- [x] Build web + Android sucesso

---

## 📋 Backlog Priorizado

### 🔴 Crítico (Blockers para próxima release)

| ID | Task | Descrição | Esforço | Owner | Status |
|----|------|-----------|---------|-------|--------|
| T-001 | **CI: Testes E2E (Playwright)** | Configurar `npm run test:e2e` no CI com Chrome/Firefox headless + device emulation TV | M | DevOps | 🔄 PENDENTE |
| T-002 | **CI: Codecov Integration** | Upload coverage reports no PR + gate mínimo 80% | S | DevOps | 🔄 PENDENTE |
| T-003 | **CI: Stryker Mutation Testing** | Rodar `npm run test:mutation` no CI (pode ser nightly) | M | DevOps | 🔄 PENDENTE |
| T-004 | **Configurar secrets CI para release automática** | KEYSTORE_BASE64, KEYSTORE_PASSWORD, KEY_ALIAS, KEY_PASSWORD no GitHub | S | DevOps | 🔄 PENDENTE |

### 🟡 Importante (Próximas 2-3 sprints)

| ID | Task | Descrição | Esforço | Owner | Status |
|----|------|-----------|---------|-------|--------|
| T-005 | **Observabilidade: Dashboards** | Dashboards Datadog/NewRelic/Grafana: stream, trial, OTA, player, system | M | DevOps | ✅ DONE (`src/services/dashboard.ts`) |
| T-006 | **Player: Buffer Strategy** | Implementar `maxBufferLength` adaptativo baseado em connection type (wifi/cellular) | M | Player Team | ✅ DONE |
| T-007 | **Live TV: EPG Cache Offline-First** | Cache EPG local (IndexedDB/SQLite) + sync background | M | Live Team | ✅ DONE |
| T-008 | **Download Manager: Pause/Resume** | Suporte a pause/resume/cancel downloads OTA + progress notification | M | Mobile Team | ✅ DONE |
| T-009 | **Search: Debounce + Cache** | Debounce 300ms + cache resultados recentes (5 min TTL) | S | Frontend | 🔄 PENDENTE |
| T-010 | **Settings: Sync Cross-Device** | Sincronizar preferências (audio, subtitle, speed) via cloud se logged in | L | Backend | 🔄 PENDENTE |

### 🟢 Desejável (Backlog longo)

| ID | Task | Descrição | Esforço | Owner |
|----|------|-----------|---------|-------|
| T-011 | **Player: Picture-in-Picture** | PiP nativo Android + Web PiP API | M | Player Team |
| T-012 | **Cast: Chromecast/AirPlay** | Integração CastManager completo | L | Mobile Team |
| T-013 | **Profiles: Multi-user** | Troca de perfil com prefs isoladas + kids mode | M | Frontend |
| T-014 | **Analytics: Funnel** | Funil: open → search → play → complete → retain | M | Data |
| T-015 | **A11y: TalkBack/VoiceOver** | Labels, roles, live regions para screen readers | M | Frontend |
| T-016 | **Offline Mode** | Service Worker + IndexedDB para assets críticos | L | PWA Team |
| T-017 | **Themes: Dark/Light/Auto** | Toggle tema + `prefers-color-scheme` | S | Frontend |

---

## 🐛 Bugs Conhecidos (Non-blocking)

| ID | Bug | Severidade | Status | Fix |
|----|-----|------------|--------|-----|
| B-001 | **Seek bar lag em HLS longos** (>2h) | Low | 🔄 Pendente | Usar `fragLoadingTimeOut` maior |
| B-002 | **Subtitle sync drift** em lives | Medium | ✅ FIXED | `resetSubtitleSync()` + periodic check + OSD button |
| B-003 | **D-Pad focus trap** em modal aninhado | Low | 🔄 Pendente | `SpatialNav.reinit()` no close |
| B-004 | **Memory leak** hls.js em navegação rápida | Medium | ✅ FIXED | `hlsInstanceRef` + try/catch destroy + null ref |
| B-005 | **OTA false positive** versionCode same | Low | 🔄 Pendente | Verificar `versionCode` no update.json |
| B-006 | **connection refused** localhost no Android | Critical | ✅ FIXED | Removido `server.url` do capacitor.config.ts |
| B-007 | **Tela preta** ao abrir o APK no Android | Critical | ✅ FIXED | Remoção loop reload em main.tsx, cleartext=true, cache safe, Skeletons (#250) |

---

## 📦 Technical Debt (Ponytail Comments)

> Extraído via `ponytail-debt` — atalhos deliberados com teto conhecido

| Arquivo | Linha | Comentário | Teto / Upgrade Path |
|---------|-------|------------|---------------------|
| `StreamPlayer.tsx` | ~933 | `ponytail: global lock, per-account locks if throughput matters` | Auto-fallback mutex global; trocar por por-fonte se concorrência > 10 |
| `appUpdater.ts` | ~45 | `ponytail: naive retry 3x, exponential backoff if flaky CDN` | Retry fixo 3x; implementar backoff exponencial + jitter |
| `trial.ts` | ~120 | `ponytail: NTP single request, pool + median if clock skew > 1s` | Single NTP call; usar pool NTP + mediana se skew detectado |
| `LiveService.kt` | ~80 | `ponytail: EPG full reload daily, incremental diff if bandwidth` | Full reload diário; implementar diff incremental (ETag/Last-Modified) |
| `useLicense.ts` | ~200 | `ponytail: localStorage only, encrypted storage if root detected` | localStorage plain; migrar para EncryptedSharedPreferences se root |

---

## 🚀 Release Roadmap

### v1.2.86 (Atual - Publicada)
- ✅ Fix connection refused (androidScheme removido)
- ✅ Fix tela preta em redes móveis
- ✅ update.json atualizado para v1.2.85

### v1.2.87 (Próxima - ~2 semanas)
- [ ] T-001: CI E2E + Codecov
- [ ] T-004: Configurar secrets CI para release automática
- [ ] Dependency updates (security patches)

### v1.3.0 (Major - ~6 semanas)
- [x] T-005: Observabilidade dashboards
- [x] T-006: Buffer strategy adaptativo
- [x] T-007: EPG cache offline-first
- [x] T-008: Download pause/resume
- [ ] T-009: Search: Debounce + Cache
- [ ] T-010: Settings sync cross-device
- [ ] T-011: Picture-in-Picture
- [ ] Refactor: Migrar `StreamPlayer.tsx` para hooks menores (`useHls`, `useAutoPlay`, `useAudioTrack`)

### v1.4.0 (Major - ~10 semanas)
- [ ] T-012: Cast Chromecast/AirPlay
- [ ] T-013: Multi-profile + kids mode
- [ ] T-016: PWA Offline Mode
- [ ] T-017: Themes Dark/Light/Auto

---

## 📝 Convenções de Task

### Naming
- `T-XXX` = Task/Feature
- `B-XXX` = Bug
- `D-XXX` = Tech Debt (ponytail)
- `R-XXX` = Refactor

### Labels
- `critical` = Blockers release
- `important` = Next sprint
- `nice-to-have` = Backlog
- `bug` = Defeito
- `debt` = Technical debt
- `docs` = Documentação

### Definition of Done
- [ ] Código implementado + revisado
- [ ] Testes unitários + E2E (se aplicável)
- [ ] Lint + TypeScript + Arch contract passam
- [ ] Build web + Android sucesso
- [ ] Documentação atualizada (README, ARCHITECTURE, DECISIONS se arquitetural)
- [ ] Deploy staging validado
- [ ] Release notes escritas

---

## 🔗 Links Úteis

- **GitHub Issues**: https://github.com/alej4p4/cinebg/issues
- **GitHub PRs**: https://github.com/alej4p4/cinebg/pulls
- **Release v1.2.86**: https://github.com/alej4p4/cinebg/releases/tag/v1.2.86
- **CI Pipeline**: https://github.com/alej4p4/cinebg/actions
- **APK Mobile**: https://github.com/alej4p4/cinebg/releases/download/v1.2.86/CineBG-Mobile-release.apk
- **APK TV**: https://github.com/alej4p4/cinebg/releases/download/v1.2.86/CineBG-Tv-release.apk
