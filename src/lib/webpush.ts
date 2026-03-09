/**
 * Web Push (RFC 8030/8291/8292) — ingen extern npm-paketet behövs.
 * Använder Node.js inbyggda crypto + Web Crypto API (Node 18+).
 */
import { createPrivateKey, createSign } from 'node:crypto'

// ── Hjälpfunktioner ────────────────────────────────────────────

function b64url(s: string): Uint8Array<ArrayBuffer> {
  const pad = '='.repeat((4 - s.length % 4) % 4)
  const buf = Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64')
  const out = new Uint8Array(buf.length)
  out.set(buf)
  return out
}

function concat(...parts: Uint8Array[]): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let off = 0
  for (const p of parts) { out.set(p, off); off += p.length }
  return out
}

async function hmacSign(key: CryptoKey, data: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, data))
}

async function importHmacKey(bytes: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', bytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
}

// HKDF-Extract: PRK = HMAC-SHA256(salt, IKM)
async function hkdfExtract(salt: Uint8Array<ArrayBuffer>, ikm: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  return hmacSign(await importHmacKey(salt), ikm)
}

// HKDF-Expand: OKM = T(1) || T(2) || ...
async function hkdfExpand(prk: Uint8Array<ArrayBuffer>, info: Uint8Array<ArrayBuffer>, length: number): Promise<Uint8Array<ArrayBuffer>> {
  const key = await importHmacKey(prk)
  const out = new Uint8Array(length)
  let prev: Uint8Array<ArrayBuffer> = new Uint8Array(0)
  let filled = 0
  let i = 1
  while (filled < length) {
    prev = await hmacSign(key, concat(prev, info, new Uint8Array([i++])))
    const n = Math.min(prev.length, length - filled)
    out.set(prev.slice(0, n), filled)
    filled += n
  }
  return out
}

// ── Kryptering av push-payload (RFC 8291, aes128gcm) ──────────

async function encryptPayload(p256dh: string, auth: string, plaintext: string): Promise<Buffer> {
  const clientPub  = b64url(p256dh) // 65 bytes: 0x04 || x || y
  const authBytes  = b64url(auth)   // 16 bytes

  // 1. Ephemeral server-nyckelpar för ECDH
  const serverKP = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']
  )
  const serverPub = new Uint8Array(await crypto.subtle.exportKey('raw', serverKP.publicKey))

  // 2. Importera klientens publika nyckel
  const clientKey = await crypto.subtle.importKey(
    'raw', clientPub as Uint8Array<ArrayBuffer>, { name: 'ECDH', namedCurve: 'P-256' }, false, []
  )

  // 3. ECDH delad hemlighet (IKM)
  const ikm = new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'ECDH', public: clientKey }, serverKP.privateKey, 256
  ))

  // 4. Nyckelderivation (RFC 8291 §3.4)
  const prk     = await hkdfExtract(authBytes, ikm)
  const keyInfo = concat(new TextEncoder().encode('WebPush: info\x00'), clientPub, serverPub)
  const ikm2    = await hkdfExpand(prk, keyInfo, 32)

  const salt    = crypto.getRandomValues(new Uint8Array(16))
  const prk2    = await hkdfExtract(salt, ikm2)
  const cek     = await hkdfExpand(prk2, new TextEncoder().encode('Content-Encoding: aes128gcm\x00'), 16)
  const nonce   = await hkdfExpand(prk2, new TextEncoder().encode('Content-Encoding: nonce\x00'), 12)

  // 5. AES-128-GCM kryptering
  const aesKey = await crypto.subtle.importKey('raw', cek as Uint8Array<ArrayBuffer>, 'AES-GCM', false, ['encrypt'])
  const padded = concat(new TextEncoder().encode(plaintext), new Uint8Array([2]))
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce as Uint8Array<ArrayBuffer>, tagLength: 128 }, aesKey, padded as Uint8Array<ArrayBuffer>
  ))

  // 6. RFC 8188-headern: salt(16) || rs(4 BE) || idlen(1) || server_pub || ciphertext
  const rsBytes = new Uint8Array(4)
  new DataView(rsBytes.buffer).setUint32(0, 4096, false)
  return Buffer.from(concat(salt, rsBytes, new Uint8Array([serverPub.length]), serverPub, ciphertext))
}

// ── VAPID JWT (RFC 8292) ────────────────────────────────────────

function buildVapidJWT(endpoint: string): string {
  const pubBytes = Buffer.from(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, 'base64url')
  const ecKey = createPrivateKey({
    key: {
      kty: 'EC', crv: 'P-256',
      d: process.env.VAPID_PRIVATE_KEY!,
      x: pubBytes.slice(1, 33).toString('base64url'),
      y: pubBytes.slice(33, 65).toString('base64url'),
    },
    format: 'jwk',
  })

  const url = new URL(endpoint)
  const h = Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'ES256' })).toString('base64url')
  const p = Buffer.from(JSON.stringify({
    aud: `${url.protocol}//${url.host}`,
    sub: 'mailto:info@reklamsidan.se',
    exp: Math.floor(Date.now() / 1000) + 43200,
  })).toString('base64url')

  const signer = createSign('SHA256')
  signer.update(`${h}.${p}`)
  const sig = signer.sign({ key: ecKey, dsaEncoding: 'ieee-p1363' })
  return `${h}.${p}.${sig.toString('base64url')}`
}

// ── Publik API ─────────────────────────────────────────────────

export type PushSubscription = {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

export type PushPayload = {
  title: string
  body: string
  url?: string
}

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushPayload,
): Promise<void> {
  const jwt  = buildVapidJWT(subscription.endpoint)
  const body = await encryptPayload(subscription.keys.p256dh, subscription.keys.auth, JSON.stringify(payload))

  const res = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      Authorization:       `vapid t=${jwt},k=${process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!}`,
      'Content-Type':      'application/octet-stream',
      'Content-Encoding':  'aes128gcm',
      'Content-Length':    String(body.length),
      TTL:                 '86400',
    },
    body,
  })

  if (!res.ok && res.status !== 201) {
    throw new Error(`Push misslyckades ${res.status}: ${await res.text()}`)
  }
}
