/**
 * ============================================================================
 * UTILITÁRIO CRIPTOGRÁFICO DE ALTA VELOCIDADE (MD5, HMAC-MD5, BASE64)
 * ============================================================================
 * Implementação pura em TypeScript (zero dependências externas) compatível
 * com Node.js, navegadores modernos e WebView nativa do Android (Smart TV / Mobile).
 */

export function md5(input: string | Uint8Array): Uint8Array {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input

  const origLen = bytes.length
  let padLen = 56 - ((origLen + 1) % 64)
  if (padLen < 0) padLen += 64

  const totalLen = origLen + 1 + padLen + 8
  const padded = new Uint8Array(totalLen)
  padded.set(bytes, 0)
  padded[origLen] = 0x80

  const view = new DataView(padded.buffer, padded.byteOffset, padded.byteLength)
  const bitLenLow = (origLen * 8) >>> 0
  const bitLenHigh = Math.floor((origLen * 8) / 0x100000000) >>> 0
  view.setUint32(totalLen - 8, bitLenLow, true)
  view.setUint32(totalLen - 4, bitLenHigh, true)

  let a0 = 0x67452301 >>> 0
  let b0 = 0xefcdab89 >>> 0
  let c0 = 0x98badcfe >>> 0
  let d0 = 0x10325476 >>> 0

  const s = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ]

  const K = new Uint32Array(64)
  for (let i = 0; i < 64; i++) {
    K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000) >>> 0
  }

  for (let offset = 0; offset < totalLen; offset += 64) {
    const M = new Uint32Array(16)
    for (let j = 0; j < 16; j++) {
      M[j] = view.getUint32(offset + j * 4, true)
    }

    let A = a0
    let B = b0
    let C = c0
    let D = d0

    for (let i = 0; i < 64; i++) {
      let F: number
      let g: number
      if (i < 16) {
        F = (B & C) | (~B & D)
        g = i
      } else if (i < 32) {
        F = (D & B) | (~D & C)
        g = (5 * i + 1) % 16
      } else if (i < 48) {
        F = B ^ C ^ D
        g = (3 * i + 5) % 16
      } else {
        F = C ^ (B | ~D)
        g = (7 * i) % 16
      }

      const temp = D
      D = C
      C = B
      const sum = (A + F + K[i] + M[g]) >>> 0
      const rot = ((sum << s[i]) | (sum >>> (32 - s[i]))) >>> 0
      B = (B + rot) >>> 0
      A = temp
    }

    a0 = (a0 + A) >>> 0
    b0 = (b0 + B) >>> 0
    c0 = (c0 + C) >>> 0
    d0 = (d0 + D) >>> 0
  }

  const result = new Uint8Array(16)
  const resView = new DataView(result.buffer, result.byteOffset, result.byteLength)
  resView.setUint32(0, a0, true)
  resView.setUint32(4, b0, true)
  resView.setUint32(8, c0, true)
  resView.setUint32(12, d0, true)
  return result
}

export function md5Hex(input: string | Uint8Array): string {
  const hash = md5(input)
  return Array.from(hash)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function hmacMd5(keyBytes: Uint8Array, messageBytes: Uint8Array): Uint8Array {
  let key = keyBytes
  if (key.length > 64) {
    key = md5(key)
  }
  const kPad = new Uint8Array(64)
  kPad.set(key)

  const oPad = new Uint8Array(64)
  const iPad = new Uint8Array(64)
  for (let i = 0; i < 64; i++) {
    oPad[i] = kPad[i] ^ 0x5c
    iPad[i] = kPad[i] ^ 0x36
  }

  const innerMsg = new Uint8Array(64 + messageBytes.length)
  innerMsg.set(iPad, 0)
  innerMsg.set(messageBytes, 64)
  const innerHash = md5(innerMsg)

  const outerMsg = new Uint8Array(64 + 16)
  outerMsg.set(oPad, 0)
  outerMsg.set(innerHash, 64)
  return md5(outerMsg)
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export function base64ToBytes(base64: string): Uint8Array {
  let normalized = base64.replace(/-/g, '+').replace(/_/g, '/')
  while (normalized.length % 4 !== 0) {
    normalized += '='
  }
  const binary = atob(normalized)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}
