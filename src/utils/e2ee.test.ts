import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveRoomKey,
  encryptE2EEMessage,
  decryptE2EEMessage,
  generateRoomFingerprint,
} from './e2ee';

test('E2EE encrypts and decrypts string correctly', async () => {
  const roomCode = 'ROOM99';
  const key = await deriveRoomKey(roomCode);
  const secretMessage = 'Hello Domino Partner! Let us block the left end!';

  const { encryptedData, iv } = await encryptE2EEMessage(secretMessage, key);
  assert.ok(encryptedData && encryptedData.length > 0);
  assert.ok(iv && iv.length > 0);
  assert.notEqual(encryptedData, secretMessage);

  const decrypted = await decryptE2EEMessage(encryptedData, iv, key);
  assert.equal(decrypted, secretMessage);
});

test('E2EE fails decryption if wrong key is provided', async () => {
  const key1 = await deriveRoomKey('ROOM-A');
  const key2 = await deriveRoomKey('ROOM-B');

  const { encryptedData, iv } = await encryptE2EEMessage('Private message', key1);
  
  await assert.rejects(async () => {
    await decryptE2EEMessage(encryptedData, iv, key2);
  });
});

test('generateRoomFingerprint produces consistent 4 emoji safety icons', async () => {
  const fp1 = await generateRoomFingerprint('VIP-TABLE');
  const fp2 = await generateRoomFingerprint('VIP-TABLE');
  assert.equal(fp1.length, 4);
  assert.deepEqual(fp1, fp2);

  const fpDifferent = await generateRoomFingerprint('OTHER-TABLE');
  assert.notDeepEqual(fp1, fpDifferent);
});
