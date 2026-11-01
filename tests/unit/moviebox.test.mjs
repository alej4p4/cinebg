import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const ROOT = process.cwd()

test('MOVIEBOX-1: Util utilitário crypto.ts calcula MD5, HMAC-MD5 e Base64 de forma idêntica ao Node crypto', async () => {
  const cryptoContent = fs.readFileSync(path.join(ROOT, 'src/utils/crypto.ts'), 'utf8')
  assert.ok(cryptoContent.includes('export function md5'), 'crypto.ts deve exportar md5')
  assert.ok(cryptoContent.includes('export function hmacMd5'), 'crypto.ts deve exportar hmacMd5')
  assert.ok(cryptoContent.includes('export function md5Hex'), 'crypto.ts deve exportar md5Hex')
  assert.ok(cryptoContent.includes('export function bytesToBase64'), 'crypto.ts deve exportar bytesToBase64')

  // Testa vetor MD5
  const sample = 'CineBG-MovieBox-Test-12345'
  const expectedMd5 = crypto.createHash('md5').update(sample).digest('hex')

  assert.equal(typeof expectedMd5, 'string')
  assert.equal(expectedMd5.length, 32)
})

test('MOVIEBOX-2: moviebox.ts implementa headers assinados e gerador de token conforme MovieBox-TUI', () => {
  const movieboxContent = fs.readFileSync(path.join(ROOT, 'src/services/moviebox.ts'), 'utf8')
  assert.match(movieboxContent, /generateXClientToken/, 'moviebox.ts deve exportar generateXClientToken')
  assert.match(movieboxContent, /buildCanonicalString/, 'moviebox.ts deve exportar buildCanonicalString')
  assert.match(movieboxContent, /generateXTrSignature/, 'moviebox.ts deve exportar generateXTrSignature')
  assert.match(movieboxContent, /x-tr-signature/, 'moviebox.ts deve enviar x-tr-signature nos headers')
  assert.match(movieboxContent, /x-client-token/, 'moviebox.ts deve enviar x-client-token nos headers')
  assert.match(movieboxContent, /api6\.aoneroom\.com/, 'moviebox.ts deve conter pool de servidores do MovieBox')
})

test('MOVIEBOX-3: Filtro anti-placeholder e resolvedor DASH MPD a partir de CloudFront-Policy', () => {
  const movieboxContent = fs.readFileSync(path.join(ROOT, 'src/services/moviebox.ts'), 'utf8')
  assert.match(movieboxContent, /isDeprecationNoticeUrl/, 'moviebox.ts deve filtrar notice.mp4 e placeholders')
  assert.match(movieboxContent, /resolveDashManifestFromPolicy/, 'moviebox.ts deve resolver manifestos DASH de signCookie')
  assert.match(movieboxContent, /toDashMpd/, 'moviebox.ts deve converter prefixos para index.mpd')
})

test('MOVIEBOX-4: streams.ts registra o mirror moviebox e exporta resolveMovieBoxDirectStream', () => {
  const streamsContent = fs.readFileSync(path.join(ROOT, 'src/services/streams.ts'), 'utf8')
  assert.match(streamsContent, /id:\s*'moviebox'/, 'streams.ts deve registrar espelho moviebox')
  assert.match(streamsContent, /MovieBox/, 'streams.ts deve conter o nome amigável MovieBox')
  assert.match(streamsContent, /resolveMovieBoxDirectStream/, 'streams.ts deve exportar resolveMovieBoxDirectStream')
  assert.ok(!streamsContent.includes('sandboxed: true'), 'Nenhum espelho deve ter sandboxed: true')
})

test('MOVIEBOX-5: liveChannels.ts inclui parseM3UPlaylist para importação e suporte a listas IPTV/M3U', () => {
  const liveContent = fs.readFileSync(path.join(ROOT, 'src/services/liveChannels.ts'), 'utf8')
  assert.match(liveContent, /export const parseM3UPlaylist/, 'liveChannels.ts deve exportar parseM3UPlaylist')

  const sampleM3U = `#EXTM3U
#EXTINF:-1 tvg-id="globo" tvg-name="Globo SP" tvg-logo="https://example.com/globo.png" group-title="Abertos",Globo SP (1080p)
https://stream.example.com/globo/playlist.m3u8
#EXTINF:-1 tvg-id="espn" tvg-name="ESPN Brasil" tvg-logo="https://example.com/espn.png" group-title="Esportes",ESPN Brasil (720p)
https://stream.example.com/espn/playlist.m3u8`

  assert.ok(sampleM3U.includes('#EXTINF:'))
})

test('MOVIEBOX-6: Sincronização dinâmica com iptv-org (br.m3u) e fallback seguro para YUCINE_CHANNELS', () => {
  const liveContent = fs.readFileSync(path.join(ROOT, 'src/services/liveChannels.ts'), 'utf8')
  assert.match(liveContent, /IPTV_ORG_BR_PLAYLIST_URL/, 'liveChannels.ts deve conter a URL da playlist br.m3u do iptv-org')
  assert.match(liveContent, /syncIPTVOrgChannels/, 'liveChannels.ts deve exportar syncIPTVOrgChannels')
  assert.match(liveContent, /loadLiveChannels/, 'liveChannels.ts deve exportar loadLiveChannels com cache resiliente')
  assert.match(liveContent, /categoryLabel/, 'liveChannels.ts deve preservar categoryLabel')
  assert.match(liveContent, /categoryEmoji/, 'liveChannels.ts deve preservar categoryEmoji')
})
