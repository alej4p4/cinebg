// =========================================================================
// DASHBOARD METRICS & VISUALIZATIONS (T-005)
// Definições para Datadog, New Relic, Grafana, Sentry
// =========================================================================

export interface DashboardPanel {
  id: string
  title: string
  type: 'timeseries' | 'toplist' | 'heatmap' | 'query_value' | 'toplist' | 'distribution' | 'table'
  query: string
  description?: string
  unit?: string
  conditionalFormats?: ConditionalFormat[]
}

export interface ConditionalFormat {
  palette: 'green' | 'red' | 'yellow' | 'blue' | 'gray'
  operator: '>' | '<' | '>=' | '<=' | '='
  value: number
  background?: string
  text?: string
}

export interface DashboardLayout {
  name: string
  description: string
  panels: DashboardPanel[]
  refreshInterval?: number
  timeRange?: string
}

// =========================================================================
// DASHBOARD 1: STREAM HEALTH & QoS
// =========================================================================

export const STREAM_HEALTH_DASHBOARD: DashboardLayout = {
  name: 'CineBG - Stream Health & QoS',
  description: 'Monitoramento em tempo real da saúde dos streams: start, switches, errors, latency',
  refreshInterval: 30,
  timeRange: '1h',
  panels: [
    {
      id: 'stream_start_rate',
      title: 'Taxa de Início de Stream (stream_start/min)',
      type: 'timeseries',
      query: 'sum(rate(cinebg_stream_start_total[5m])) by (mediaType, deviceType)',
      unit: 'req/min',
      description: 'Taxa de inícios de stream bem-sucedidos por minuto',
    },
    {
      id: 'stream_error_rate',
      title: 'Taxa de Erro de Stream (stream_error/min)',
      type: 'timeseries',
      query: 'sum(rate(cinebg_stream_error_total[5m])) by (errorType, sourceName, mediaType)',
      unit: 'errors/min',
      description: 'Taxa de erros de stream por tipo e fonte',
      conditionalFormats: [
        { palette: 'red', operator: '>', value: 10, background: '#fee2e2' },
        { palette: 'yellow', operator: '>', value: 5, background: '#fef3c7' },
      ],
    },
    {
      id: 'stream_switch_rate',
      title: 'Taxa de Troca de Fonte (stream_switch/min)',
      type: 'timeseries',
      query: 'sum(rate(cinebg_stream_switch_total[5m])) by (fromSource, toSource, reason)',
      unit: 'switches/min',
      description: 'Frequência de auto-fallback entre fontes',
    },
    {
      id: 'stream_latency_p50_p95',
      title: 'Latência de Início (P50 / P95 ms)',
      type: 'timeseries',
      query: 'histogram_quantile(0.50, rate(cinebg_stream_latency_bucket[5m])) AS p50, histogram_quantile(0.95, rate(cinebg_stream_latency_bucket[5m])) AS p95',
      unit: 'ms',
      description: 'Latência de conexão (do click ao play) - P50 e P95',
      conditionalFormats: [
        { palette: 'yellow', operator: '>', value: 3000, background: '#fef3c7' },
        { palette: 'red', operator: '>', value: 8000, background: '#fee2e2' },
      ],
    },
    {
      id: 'stream_error_breakdown',
      title: 'Top 10 Erros de Stream',
      type: 'toplist',
      query: 'topk(10, sum by (errorType, sourceName) (rate(cinebg_stream_error_total[5m])))',
      description: 'Erros mais frequentes por tipo e fonte',
    },
    {
      id: 'stream_source_health',
      title: 'Saúde por Fonte (Sucesso vs Falha)',
      type: 'table',
      query: `
        sum by (sourceName) (rate(cinebg_stream_start_total[5m])) AS starts
        / (sum by (sourceName) (rate(cinebg_stream_start_total[5m])) + sum by (sourceName) (rate(cinebg_stream_error_total[5m]))) * 100 AS success_rate
      `,
      description: 'Taxa de sucesso por fonte de stream',
      conditionalFormats: [
        { palette: 'green', operator: '>', value: 95 },
        { palette: 'yellow', operator: '<=', value: 95 },
        { palette: 'red', operator: '<=', value: 80 },
      ],
    },
    {
      id: 'stream_latency_by_source',
      title: 'Latência por Fonte (P50/P95)',
      type: 'table',
      query: `
        histogram_quantile(0.50, rate(cinebg_stream_latency_bucket{sourceName=~".*"}[5m])) BY (sourceName) AS p50,
        histogram_quantile(0.95, rate(cinebg_stream_latency_bucket[5m])) BY (sourceName) AS p95
      `,
      description: 'Latência P50/P95 por fonte de stream',
    },
  ],
}

// =========================================================================
// DASHBOARD 2: TRIAL & LICENSE CONVERSION
// =========================================================================

export const TRIAL_CONVERSION_DASHBOARD: DashboardLayout = {
  name: 'CineBG - Trial & License Conversion',
  description: 'Funil de conversão: trial → licença, expiração, renovação',
  refreshInterval: 60,
  timeRange: '7d',
  panels: [
    {
      id: 'trial_active_total',
      title: 'Trials Ativos (Total)',
      type: 'query_value',
      query: 'cinebg_trial_active_total',
      unit: 'users',
      description: 'Total de usuários em trial ativo',
    },
    {
      id: 'trial_started_rate',
      title: 'Trials Iniciados/dia',
      type: 'timeseries',
      query: 'rate(cinebg_trial_started_total[1h])',
      unit: 'trials/hour',
      description: 'Taxa de novos trials por hora',
    },
    {
      id: 'trial_conversion_rate',
      title: 'Taxa de Conversão Trial → Licença',
      type: 'timeseries',
      query: 'rate(cinebg_license_activated_total[1h]) / rate(cinebg_trial_started_total[1h]) * 100',
      unit: '%',
      description: 'Taxa de conversão trial → licença paga',
      conditionalFormats: [
        { palette: 'green', operator: '>', value: 20 },
        { palette: 'yellow', operator: '<=', value: 20 },
        { palette: 'red', operator: '<=', value: 10 },
      ],
    },
    {
      id: 'trial_expired_total',
      title: 'Trials Expirados (sem conversão)',
      type: 'timeseries',
      query: 'rate(cinebg_trial_expired_total[1h])',
      unit: 'expirations/hour',
      description: 'Trials que expiraram sem conversão',
    },
    {
      id: 'license_activations_by_plan',
      title: 'Ativações por Plano',
      type: 'toplist',
      query: 'sum by (planType) (rate(cinebg_license_activated_total[1h]))',
      description: 'Ativações por tipo de plano (30d, 90d, 365d, lifetime)',
    },
    {
      id: 'license_renewal_rate',
      title: 'Taxa de Renovação',
      type: 'timeseries',
      query: 'rate(cinebg_license_renewed_total[1h]) / rate(cinebg_license_expiring_total[1h]) * 100',
      unit: '%',
      description: 'Taxa de renovação de licenças próximas ao vencimento',
    },
    {
      id: 'activation_code_usage',
      title: 'Uso de Códigos de Ativação',
      type: 'table',
      query: `
        topk(10, sum by (planDays, deviceType) (rate(cinebg_activation_code_used_total[1h])))
      `,
      description: 'Códigos usados por plano e dispositivo',
    },
    {
      id: 'trial_funnel',
      title: 'Funil Trial → Licença (7 dias)',
      type: 'table',
      query: `
        sum(cinebg_trial_started_total[7d]) AS trials_started,
        sum(cinebg_license_activated_total[7d]) AS licenses_activated,
        sum(cinebg_trial_expired_total[7d]) AS trials_expired,
        (sum(cinebg_license_activated_total[7d]) / sum(cinebg_trial_started_total[7d]) * 100) AS conversion_rate
      `,
      description: 'Funil completo dos últimos 7 dias',
    },
  ],
}

// =========================================================================
// DASHBOARD 3: OTA UPDATE HEALTH
// =========================================================================

export const OTA_HEALTH_DASHBOARD: DashboardLayout = {
  name: 'CineBG - OTA Update Health',
  description: 'Saúde do sistema OTA: checks, downloads, instalações, rollbacks',
  refreshInterval: 60,
  timeRange: '24h',
  panels: [
    {
      id: 'ota_check_rate',
      title: 'Checks de Atualização/hora',
      type: 'timeseries',
      query: 'rate(cinebg_ota_check_total[5m])',
      unit: 'checks/min',
      description: 'Frequência de verificações de atualização',
    },
    {
      id: 'ota_download_rate',
      title: 'Downloads de APK/hora',
      type: 'timeseries',
      query: 'rate(cinebg_ota_download_started_total[5m]) by (deviceFlavor)',
      unit: 'downloads/min',
      description: 'Downloads iniciados por tipo de dispositivo',
    },
    {
      id: 'ota_download_success_rate',
      title: 'Taxa de Sucesso Download',
      type: 'timeseries',
      query: 'rate(cinebg_ota_download_completed_total[5m]) / rate(cinebg_ota_download_started_total[5m]) * 100',
      unit: '%',
      description: 'Taxa de conclusão de downloads',
      conditionalFormats: [
        { palette: 'green', operator: '>', value: 95 },
        { palette: 'yellow', operator: '<=', value: 95 },
        { palette: 'red', operator: '<=', value: 85 },
      ],
    },
    {
      id: 'ota_install_rate',
      title: 'Instalações Concluídas/hora',
      type: 'timeseries',
      query: 'rate(cinebg_ota_install_completed_total[5m]) by (deviceFlavor)',
      unit: 'installs/min',
      description: 'Instalações APK concluídas com sucesso',
    },
    {
      id: 'ota_failure_breakdown',
      title: 'Falhas OTA por Tipo',
      type: 'toplist',
      query: 'topk(10, sum by (failureReason, deviceFlavor) (rate(cinebg_ota_failure_total[5m])))',
      description: 'Principais razões de falha OTA',
    },
    {
      id: 'ota_version_distribution',
      title: 'Distribuição de Versões Ativas',
      type: 'toplist',
      query: 'topk(20, sum by (appVersion, deviceFlavor) (cinebg_active_install_total))',
      description: 'Versões do app em uso ativo',
    },
    {
      id: 'ota_rollback_rate',
      title: 'Rollbacks (Downgrade Detectado)',
      type: 'timeseries',
      query: 'rate(cinebg_ota_rollback_detected_total[5m])',
      unit: 'rollbacks/min',
      description: 'Detecção de downgrade (versão mais antiga instalada)',
    },
    {
      id: 'ota_download_duration',
      title: 'Duração Download APK (P50/P95)',
      type: 'timeseries',
      query: 'histogram_quantile(0.50, rate(cinebg_ota_download_duration_bucket[5m])) AS p50, histogram_quantile(0.95, rate(cinebg_ota_download_duration_bucket[5m])) AS p95',
      unit: 'seconds',
      description: 'Tempo de download do APK (P50/P95)',
    },
  ],
}

// =========================================================================
// DASHBOARD 4: PLAYER QoS & ENGAGEMENT
// =========================================================================

export const PLAYER_QOS_DASHBOARD: DashboardLayout = {
  name: 'CineBG - Player QoS & Engagement',
  description: 'Qualidade de experiência: buffer, seek, completion, abandono',
  refreshInterval: 30,
  timeRange: '1h',
  panels: [
    {
      id: 'player_buffer_ratio',
      title: 'Buffer Ratio (buffered / duration)',
      type: 'timeseries',
      query: 'histogram_quantile(0.50, rate(cinebg_player_buffer_ratio_bucket[5m])) AS p50, histogram_quantile(0.95, rate(cinebg_player_buffer_ratio_bucket[5m])) AS p95',
      unit: 'ratio',
      description: 'Proporção de vídeo bufferizado (0-1)',
    },
    {
      id: 'player_buffer_underruns',
      title: 'Buffer Underruns / sessão',
      type: 'timeseries',
      query: 'rate(cinebg_player_buffer_underrun_total[5m])',
      unit: 'underruns/min',
      description: 'Frequência de buffer underruns (stalls)',
      conditionalFormats: [
        { palette: 'yellow', operator: '>', value: 2 },
        { palette: 'red', operator: '>', value: 5 },
      ],
    },
    {
      id: 'player_seek_frequency',
      title: 'Seeks por Sessão',
      type: 'timeseries',
      query: 'rate(cinebg_player_seek_total[5m])',
      unit: 'seeks/min',
      description: 'Frequência de seeks (forward/backward)',
    },
    {
      id: 'player_completion_rate',
      title: 'Taxa de Completion (assistiu até o fim)',
      type: 'timeseries',
      query: 'rate(cinebg_player_completed_total[5m]) / rate(cinebg_stream_start_total[5m]) * 100',
      unit: '%',
      description: 'Porcentagem de streams assistidos até o fim',
      conditionalFormats: [
        { palette: 'green', operator: '>', value: 70 },
        { palette: 'yellow', operator: '<=', value: 70 },
        { palette: 'red', operator: '<=', value: 40 },
      ],
    },
    {
      id: 'player_abandonment_rate',
      title: 'Taxa de Abandono (parou antes de 50%)',
      type: 'timeseries',
      query: 'rate(cinebg_player_abandoned_early_total[5m]) / rate(cinebg_stream_start_total[5m]) * 100',
      unit: '%',
      description: 'Usuários que pararam antes da metade do conteúdo',
      conditionalFormats: [
        { palette: 'red', operator: '>', value: 30 },
        { palette: 'yellow', operator: '>', value: 15 },
      ],
    },
    {
      id: 'player_quality_switches',
      title: 'Troca de Qualidade (manual/auto)',
      type: 'timeseries',
      query: 'rate(cinebg_player_quality_switch_total[5m]) by (direction)',
      unit: 'switches/min',
      description: 'Trocas de qualidade (up/down/auto)',
    },
    {
      id: 'player_audio_track_switches',
      title: 'Trocas de Áudio/Legenda',
      type: 'timeseries',
      query: 'rate(cinebg_player_audio_track_switch_total[5m]) by (fromTrack, toTrack)',
      unit: 'switches/min',
      description: 'Frequência de troca de faixa de áudio/legenda',
    },
    {
      id: 'session_duration',
      title: 'Duração da Sessão (P50/P95)',
      type: 'timeseries',
      query: 'histogram_quantile(0.50, rate(cinebg_session_duration_bucket[5m])) AS p50, histogram_quantile(0.95, rate(cinebg_session_duration_bucket[5m])) AS p95',
      unit: 'minutes',
      description: 'Duração média das sessões de visualização',
    },
  ],
}

// =========================================================================
// DASHBOARD 5: SYSTEM HEALTH & ERRORS
// =========================================================================

export const SYSTEM_HEALTH_DASHBOARD: DashboardLayout = {
  name: 'CineBG - System Health & Errors',
  description: 'Saúde geral: crashes, ANRs, erros de rede, performance',
  refreshInterval: 60,
  timeRange: '6h',
  panels: [
    {
      id: 'app_crash_rate',
      title: 'Taxa de Crashes',
      type: 'timeseries',
      query: 'rate(cinebg_app_crash_total[5m]) by (platform, version)',
      unit: 'crashes/min',
      description: 'Crashes de app por versão/plataforma',
      conditionalFormats: [
        { palette: 'red', operator: '>', value: 1 },
        { palette: 'yellow', operator: '>', value: 0.1 },
      ],
    },
    {
      id: 'anr_rate',
      title: 'ANR Rate (Android)',
      type: 'timeseries',
      query: 'rate(cinebg_anr_total[5m])',
      unit: 'anrs/min',
      description: 'Application Not Responding rate',
      conditionalFormats: [
        { palette: 'red', operator: '>', value: 0.5 },
        { palette: 'yellow', operator: '>', value: 0.1 },
      ],
    },
    {
      id: 'network_error_rate',
      title: 'Erros de Rede',
      type: 'timeseries',
      query: 'rate(cinebg_network_error_total[5m]) by (endpoint, errorType)',
      unit: 'errors/min',
      description: 'Erros de API/stream/download',
    },
    {
      id: 'js_error_breakdown',
      title: 'Top 20 Erros JS',
      type: 'toplist',
      query: 'topk(20, sum by (errorName, errorMessage) (rate(cinebg_js_error_total[5m])))',
      description: 'Erros JavaScript mais frequentes',
    },
    {
      id: 'api_latency_p95',
      title: 'API Latency P95',
      type: 'timeseries',
      query: 'histogram_quantile(0.95, rate(cinebg_api_latency_bucket[5m])) by (endpoint)',
      unit: 'ms',
      description: 'Latência P95 das chamadas de API',
      conditionalFormats: [
        { palette: 'yellow', operator: '>', value: 2000 },
        { palette: 'red', operator: '>', value: 5000 },
      ],
    },
    {
      id: 'memory_usage',
      title: 'Memory Usage (MB)',
      type: 'timeseries',
      query: 'cinebg_memory_usage_mb',
      unit: 'MB',
      description: 'Uso de memória do app',
      conditionalFormats: [
        { palette: 'yellow', operator: '>', value: 150 },
        { palette: 'red', operator: '>', value: 300 },
      ],
    },
    {
      id: 'fps_drops',
      title: 'FPS Drops (< 55fps)',
      type: 'timeseries',
      query: 'rate(cinebg_fps_drop_total[5m])',
      unit: 'drops/min',
      description: 'Quedas de frame rate abaixo de 55fps',
    },
  ],
}

// =========================================================================
// EXPORT ALL DASHBOARDS
// =========================================================================

export const ALL_DASHBOARDS: DashboardLayout[] = [
  STREAM_HEALTH_DASHBOARD,
  TRIAL_CONVERSION_DASHBOARD,
  OTA_HEALTH_DASHBOARD,
  PLAYER_QOS_DASHBOARD,
  SYSTEM_HEALTH_DASHBOARD,
]

export function getDashboardByName(name: string): DashboardLayout | undefined {
  return ALL_DASHBOARDS.find(d => d.name === name)
}

export function getAllDashboardNames(): string[] {
  return ALL_DASHBOARDS.map(d => d.name)
}

// =========================================================================
// DATADOG / NEW RELIC / GRAFANA EXPORT HELPERS
// =========================================================================

export function exportDashboardForDatadog(dashboard: DashboardLayout): object {
  return {
    title: dashboard.name,
    description: dashboard.description,
    widgets: dashboard.panels.map(p => {
      const def: Record<string, unknown> = {
        type: p.type,
        title: p.title,
        requests: [{ q: p.query }],
      }
      if (p.conditionalFormats) {
        def.conditional_formats = p.conditionalFormats
      }
      return { definition: def }
    }),
  }
}

export function exportDashboardForNewRelic(dashboard: DashboardLayout): object {
  return {
    name: dashboard.name,
    pages: [{
      name: 'Overview',
      widgets: dashboard.panels.map(p => ({
        visualization: { id: 'viz.line' },
        title: p.title,
        nrql: p.query,
      })),
    }],
  }
}

export function exportDashboardForGrafana(dashboard: DashboardLayout): object {
  return {
    dashboard: {
      title: dashboard.name,
      description: dashboard.description,
      panels: dashboard.panels.map((p, i) => {
        let panelType: string
        if (p.type === 'timeseries') panelType = 'graph'
        else if (p.type === 'toplist') panelType = 'table'
        else panelType = 'stat'

        return {
          id: i + 1,
          title: p.title,
          type: panelType,
          targets: [{ expr: p.query, legendFormat: '{{sourceName}}' }],
          gridPos: { x: (i % 2) * 12, y: Math.floor(i / 2) * 8, w: 12, h: 8 },
        }
      }),
      time: { from: 'now-1h', to: 'now' },
      refresh: dashboard.refreshInterval ? `${dashboard.refreshInterval}s` : '30s',
    },
  }
}