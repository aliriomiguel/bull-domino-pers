/**
 * End-to-End Encryption (E2EE) Module for Domino Clash Royale
 * Powered by Web Crypto API (AES-GCM 256-bit with PBKDF2 Key Derivation)
 * Ensures all private room chat messages and game data remain cryptographically confidential.
 */

// Safety verification emojis list for room key verification fingerprint
const FINGERPRINT_EMOJIS = [
  '🛡️', '⚔️', '🎲', '👑', '💎', '🔥', '⚡', '🌟',
  '🦁', '🦅', '🍀', '🎯', '⚓', '🔮', '🏆', '🗝️'
];

/**
 * Derives a 256-bit AES-GCM CryptoKey from a room secret code and salt.
 */
export async function deriveRoomKey(roomCode: string, saltString: string = 'domino-clash-salt-2026'): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(roomCode.trim().toUpperCase()),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(saltString),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a plaintext string using AES-GCM with a random 12-byte IV.
 * Returns { encryptedData: base64, iv: base64 }
 */
export async function encryptE2EEMessage(
  plainText: string,
  key: CryptoKey
): Promise<{ encryptedData: string; iv: string }> {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const cipherBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    enc.encode(plainText)
  );

  return {
    encryptedData: uint8ArrayToBase64(new Uint8Array(cipherBuffer)),
    iv: uint8ArrayToBase64(iv),
  };
}

/**
 * Decrypts an encrypted payload using AES-GCM.
 */
export async function decryptE2EEMessage(
  encryptedDataBase64: string,
  ivBase64: string,
  key: CryptoKey
): Promise<string> {
  const dec = new TextDecoder();
  const cipherBytes = base64ToUint8Array(encryptedDataBase64);
  const ivBytes = base64ToUint8Array(ivBase64);

  const plainBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBytes as unknown as BufferSource,
    },
    key,
    cipherBytes as unknown as BufferSource
  );

  return dec.decode(plainBuffer);
}

/**
 * Generates a 4-emoji visual verification fingerprint from room code
 */
export async function generateRoomFingerprint(roomCode: string): Promise<string[]> {
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(roomCode.toUpperCase()));
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return [
    FINGERPRINT_EMOJIS[hashArray[0] % FINGERPRINT_EMOJIS.length],
    FINGERPRINT_EMOJIS[hashArray[1] % FINGERPRINT_EMOJIS.length],
    FINGERPRINT_EMOJIS[hashArray[2] % FINGERPRINT_EMOJIS.length],
    FINGERPRINT_EMOJIS[hashArray[3] % FINGERPRINT_EMOJIS.length],
  ];
}

// Helpers for Base64 conversion
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
