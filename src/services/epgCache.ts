// =========================================================================
// EPG CACHE OFFLINE-FIRST (T-007)
// IndexedDB cache para EPG + background sync incremental
// =========================================================================

import { getLiveChannelEPG, getChannelDailySchedule, type EPGProgram, type DailyScheduleItem } from './epg'
import { type LiveChannel } from './liveChannels'

export interface CachedEPGProgram extends EPGProgram {
  channelId: string
  cachedAt: number
  expiresAt: number
}

export interface CachedDailySchedule {
  channelId: string
  schedule: DailyScheduleItem[]
  cachedAt: number
  expiresAt: number
}

export interface EPGCacheMeta {
  version: number
  lastFullSync: number
  lastIncrementalSync: number
  channelsCount: number
}

const DB_NAME = 'cinebg-epg-cache'
const DB_VERSION = 1
const STORE_PROGRAMS = 'epg-programs'
const STORE_SCHEDULES = 'epg-schedules'
const STORE_META = 'epg-meta'

// TTL: 6 horas para programa atual, 24h para grade diária
const PROGRAM_TTL_MS = 6 * 60 * 60 * 1000
const SCHEDULE_TTL_MS = 24 * 60 * 60 * 1000
const INCREMENTAL_SYNC_INTERVAL_MS = 30 * 60 * 1000 // 30 min
const FULL_SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000 // 6h

let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains(STORE_PROGRAMS)) {
        const programStore = db.createObjectStore(STORE_PROGRAMS, { keyPath: 'channelId' })
        programStore.createIndex('expiresAt', 'expiresAt', { unique: false })
      }

      if (!db.objectStoreNames.contains(STORE_SCHEDULES)) {
        const scheduleStore = db.createObjectStore(STORE_SCHEDULES, { keyPath: 'channelId' })
        scheduleStore.createIndex('expiresAt', 'expiresAt', { unique: false })
      }

      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' })
      }
    }
  })

  return dbPromise
}

// --- Cache Operations ---

export async function getCachedProgram(channelId: string): Promise<EPGProgram | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROGRAMS, 'readonly')
    const store = tx.objectStore(STORE_PROGRAMS)
    const request = store.get(channelId)

    request.onsuccess = () => {
      const data = request.result as CachedEPGProgram | undefined
      if (data && data.expiresAt > Date.now()) {
        resolve({
          title: data.title,
          description: data.description,
          start: data.start,
          end: data.end,
          startMinutes: data.startMinutes,
          endMinutes: data.endMinutes,
          category: data.category,
          progress: data.progress,
          nextTitle: data.nextTitle,
        })
      } else {
        resolve(null)
      }
    }
    request.onerror = () => reject(request.error)
  })
}

// Retorna o programa com metadados (para sync incremental)
async function getCachedProgramRaw(channelId: string): Promise<CachedEPGProgram | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROGRAMS, 'readonly')
    const store = tx.objectStore(STORE_PROGRAMS)
    const request = store.get(channelId)

    request.onsuccess = () => {
      const data = request.result as CachedEPGProgram | undefined
      if (data && data.expiresAt > Date.now()) {
        resolve(data)
      } else {
        resolve(null)
      }
    }
    request.onerror = () => reject(request.error)
  })
}

export async function setCachedProgram(channelId: string, program: EPGProgram): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROGRAMS, 'readwrite')
    const store = tx.objectStore(STORE_PROGRAMS)
    const now = Date.now()
    const data: CachedEPGProgram = {
      channelId,
      ...program,
      cachedAt: now,
      expiresAt: now + PROGRAM_TTL_MS,
    }
    const request = store.put(data)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function getCachedSchedule(channelId: string): Promise<DailyScheduleItem[] | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SCHEDULES, 'readonly')
    const store = tx.objectStore(STORE_SCHEDULES)
    const request = store.get(channelId)

    request.onsuccess = () => {
      const data = request.result as CachedDailySchedule | undefined
      if (data && data.expiresAt > Date.now()) {
        resolve(data.schedule)
      } else {
        resolve(null)
      }
    }
    request.onerror = () => reject(request.error)
  })
}

export async function setCachedSchedule(channelId: string, schedule: DailyScheduleItem[]): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SCHEDULES, 'readwrite')
    const store = tx.objectStore(STORE_SCHEDULES)
    const now = Date.now()
    const data: CachedDailySchedule = {
      channelId,
      schedule,
      cachedAt: now,
      expiresAt: now + SCHEDULE_TTL_MS,
    }
    const request = store.put(data)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// --- Meta Operations ---

export async function getCacheMeta(): Promise<EPGCacheMeta> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_META, 'readonly')
    const store = tx.objectStore(STORE_META)
    const request = store.get('meta')

    request.onsuccess = () => {
      const data = request.result as EPGCacheMeta | undefined
      resolve(data || {
        version: DB_VERSION,
        lastFullSync: 0,
        lastIncrementalSync: 0,
        channelsCount: 0,
      })
    }
    request.onerror = () => reject(request.error)
  })
}

async function setCacheMeta(meta: Partial<EPGCacheMeta>): Promise<void> {
  const db = await openDB()
  const current = await getCacheMeta()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_META, 'readwrite')
    const store = tx.objectStore(STORE_META)
    const updated = { ...current, ...meta, version: DB_VERSION }
    const request = store.put(updated)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// --- High-level API ---

export async function getEPGProgramCached(channel: LiveChannel): Promise<EPGProgram> {
  // 1. Tenta cache primeiro (instantâneo)
  const cached = await getCachedProgram(channel.id)
  if (cached) return cached

  // 2. Computa em tempo real (fallback)
  const program = getLiveChannelEPG(channel.id, channel.category, channel.name)

  // 3. Salva no cache async (não bloqueia)
  setCachedProgram(channel.id, program).catch(console.warn)

  return program
}

export async function getDailyScheduleCached(channel: LiveChannel): Promise<DailyScheduleItem[]> {
  const cached = await getCachedSchedule(channel.id)
  if (cached) return cached

  const schedule = getChannelDailySchedule(channel.id, channel.category, channel.name)
  setCachedSchedule(channel.id, schedule).catch(console.warn)
  return schedule
}

// --- Background Sync ---

let syncInProgress = false

export async function syncEPGIncremental(channels: LiveChannel[]): Promise<void> {
  if (syncInProgress) return
  syncInProgress = true

  try {
    const meta = await getCacheMeta()
    const now = Date.now()

    // Verifica se já passou o intervalo de sync incremental
    if (now - meta.lastIncrementalSync < INCREMENTAL_SYNC_INTERVAL_MS) {
      return
    }

    // Atualiza apenas programas expirados (incremental)
    let updated = 0
    for (const channel of channels) {
      const cached = await getCachedProgramRaw(channel.id)
      if (!cached || cached.expiresAt <= Date.now()) {
        const program = getLiveChannelEPG(channel.id, channel.category, channel.name)
        await setCachedProgram(channel.id, program)
        updated++
      }
    }

    if (updated > 0) {
      await setCacheMeta({ lastIncrementalSync: now })
      console.log(`[EPG Cache] Incremental sync: ${updated} programas atualizados`)
    }
  } catch (error) {
    console.warn('[EPG Cache] Incremental sync failed:', error)
  } finally {
    syncInProgress = false
  }
}

export async function syncEPGFull(channels: LiveChannel[]): Promise<void> {
  if (syncInProgress) return
  syncInProgress = true

  try {
    const meta = await getCacheMeta()
    const now = Date.now()

    if (now - meta.lastFullSync < FULL_SYNC_INTERVAL_MS) {
      return
    }

    // Atualiza tudo (programas + grades diárias)
    let updated = 0
    for (const channel of channels) {
      const program = getLiveChannelEPG(channel.id, channel.category, channel.name)
      await setCachedProgram(channel.id, program)

      const schedule = getChannelDailySchedule(channel.id, channel.category, channel.name)
      await setCachedSchedule(channel.id, schedule)

      updated++
    }

    await setCacheMeta({
      lastFullSync: now,
      lastIncrementalSync: now,
      channelsCount: updated,
    })
    console.log(`[EPG Cache] Full sync: ${updated} canais atualizados`)
  } catch (error) {
    console.warn('[EPG Cache] Full sync failed:', error)
  } finally {
    syncInProgress = false
  }
}

// --- Lifecycle ---

export function startEPGBackgroundSync(channels: LiveChannel[]): () => void {
  // Sync inicial incremental (não bloqueia)
  syncEPGIncremental(channels).catch(console.warn)

  // Sync full inicial (se nunca fez) - assíncrono
  getCacheMeta().then((meta) => {
    if (meta.lastFullSync === 0) {
      syncEPGFull(channels).catch(console.warn)
    }
  }).catch(console.warn)

  // Intervalos periódicos
  const incrementalInterval = setInterval(() => {
    syncEPGIncremental(channels).catch(console.warn)
  }, INCREMENTAL_SYNC_INTERVAL_MS)

  const fullInterval = setInterval(() => {
    syncEPGFull(channels).catch(console.warn)
  }, FULL_SYNC_INTERVAL_MS)

  // Cleanup function
  return () => {
    clearInterval(incrementalInterval)
    clearInterval(fullInterval)
  }
}

// --- Utilitários ---

export async function clearEPGCache(): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_PROGRAMS, STORE_SCHEDULES, STORE_META], 'readwrite')
    tx.objectStore(STORE_PROGRAMS).clear()
    tx.objectStore(STORE_SCHEDULES).clear()
    tx.objectStore(STORE_META).clear()
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getCacheStats(): Promise<{
  programsCached: number
  schedulesCached: number
  expiredPrograms: number
  expiredSchedules: number
  meta: EPGCacheMeta
}> {
  const db = await openDB()
  const meta = await getCacheMeta()

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_PROGRAMS, STORE_SCHEDULES], 'readonly')
    const programStore = tx.objectStore(STORE_PROGRAMS)
    const scheduleStore = tx.objectStore(STORE_SCHEDULES)

    let programsCached = 0
    let expiredPrograms = 0
    let schedulesCached = 0
    let expiredSchedules = 0
    const now = Date.now()

    const programCursor = programStore.openCursor()
    programCursor.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result
      if (cursor) {
        programsCached++
        if (cursor.value.expiresAt <= now) expiredPrograms++
        cursor.continue()
      }
    }

    const scheduleCursor = scheduleStore.openCursor()
    scheduleCursor.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result
      if (cursor) {
        schedulesCached++
        if (cursor.value.expiresAt <= now) expiredSchedules++
        cursor.continue()
      }
    }

    tx.oncomplete = () => resolve({
      programsCached,
      schedulesCached,
      expiredPrograms,
      expiredSchedules,
      meta,
    })
    tx.onerror = () => reject(tx.error)
  })
}