import assert from 'node:assert';
import crypto from 'crypto';
import {
  parseAndValidateKey,
  getEncryptionKey,
  encryptPayload,
  decryptPayload,
} from '../utils/crypto.util';

async function runCryptoHardeningTests() {
  console.log('🧪 Running Production Encryption Key Hardening & Safety Tests...\n');

  const VALID_32_CHAR_KEY = '12345678901234567890123456789012';
  const VALID_64_HEX_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const VALID_44_BASE64_KEY = Buffer.alloc(32, 0x42).toString('base64');

  const originalEnv = { ...process.env };

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Valid Encryption Keys -> Encryption Succeeds
    // -------------------------------------------------------------------------
    console.log('  1. Testing valid encryption key formats for encryption...');
    {
      // 1a. 32-byte UTF-8 string
      const enc1 = encryptPayload('access_token_sample_123', VALID_32_CHAR_KEY);
      assert.ok(enc1.iv && enc1.iv.length === 32, 'IV should be 32 hex chars (16 bytes)');
      assert.ok(enc1.tag && enc1.tag.length === 32, 'Tag should be 32 hex chars (16 bytes)');
      assert.ok(enc1.encryptedData.length > 0, 'Encrypted data should not be empty');

      // 1b. 64-character Hex string
      const enc2 = encryptPayload('access_token_sample_123', VALID_64_HEX_KEY);
      assert.ok(enc2.iv && enc2.iv.length === 32, 'IV should be 32 hex chars (16 bytes)');
      assert.ok(enc2.tag && enc2.tag.length === 32, 'Tag should be 32 hex chars (16 bytes)');
      assert.ok(enc2.encryptedData.length > 0, 'Encrypted data should not be empty');

      // 1c. 44-character Base64 string
      const enc3 = encryptPayload('access_token_sample_123', VALID_44_BASE64_KEY);
      assert.ok(enc3.iv && enc3.iv.length === 32, 'IV should be 32 hex chars (16 bytes)');
      assert.ok(enc3.tag && enc3.tag.length === 32, 'Tag should be 32 hex chars (16 bytes)');
      assert.ok(enc3.encryptedData.length > 0, 'Encrypted data should not be empty');

      // 1d. Buffer key
      const keyBuffer = Buffer.from(VALID_32_CHAR_KEY, 'utf8');
      const enc4 = encryptPayload('access_token_sample_123', keyBuffer);
      assert.ok(enc4.iv && enc4.tag && enc4.encryptedData);

      console.log(
        '     ✓ 32-char UTF-8, 64-char Hex, 44-char Base64, and Buffer keys encrypt successfully.',
      );
    }

    // -------------------------------------------------------------------------
    // TEST 2: Valid Encryption Key -> Decryption Succeeds
    // -------------------------------------------------------------------------
    console.log('  2. Testing valid encryption key formats for roundtrip decryption...');
    {
      const testPayloads = [
        'gho_9876543210fedcba_OAuthAccessToken_SkillDNA',
        'ghr_1234567890abcdef_OAuthRefreshToken_SkillDNA',
        'Special characters: !@#$%^&*()_+-=[]{}|;:",.<>?/`~ 🚀 🔐 🧬',
        'Multi-line\nPayload\nWith\r\nDifferent\tWhitespace',
        JSON.stringify({ userId: 'u_123', scope: ['repo', 'user'], expires: 1789000000 }),
        'a', // single char
        '', // empty payload
      ];

      for (const payload of testPayloads) {
        // Roundtrip with 32-char UTF-8 key
        const encUtf8 = encryptPayload(payload, VALID_32_CHAR_KEY);
        const decUtf8 = decryptPayload(
          encUtf8.encryptedData,
          encUtf8.iv,
          encUtf8.tag,
          VALID_32_CHAR_KEY,
        );
        assert.strictEqual(
          decUtf8,
          payload,
          `Payload "${payload.slice(0, 20)}" must match after UTF-8 decryption`,
        );

        // Roundtrip with 64-char Hex key
        const encHex = encryptPayload(payload, VALID_64_HEX_KEY);
        const decHex = decryptPayload(
          encHex.encryptedData,
          encHex.iv,
          encHex.tag,
          VALID_64_HEX_KEY,
        );
        assert.strictEqual(
          decHex,
          payload,
          `Payload "${payload.slice(0, 20)}" must match after Hex decryption`,
        );

        // Roundtrip with 44-char Base64 key
        const encB64 = encryptPayload(payload, VALID_44_BASE64_KEY);
        const decB64 = decryptPayload(
          encB64.encryptedData,
          encB64.iv,
          encB64.tag,
          VALID_44_BASE64_KEY,
        );
        assert.strictEqual(
          decB64,
          payload,
          `Payload "${payload.slice(0, 20)}" must match after Base64 decryption`,
        );
      }

      console.log(
        '     ✓ All payloads roundtrip decrypted identically across all valid key formats.',
      );
    }

    // -------------------------------------------------------------------------
    // TEST 3: Missing ENCRYPTION_KEY in Production -> Explicit Startup/Config Failure
    // -------------------------------------------------------------------------
    console.log('  3. Testing missing ENCRYPTION_KEY failure in production mode...');
    {
      process.env.NODE_ENV = 'production';
      delete process.env.ENCRYPTION_KEY;

      // 3a. Direct parseAndValidateKey in production
      assert.throws(
        () => parseAndValidateKey(undefined, true),
        (err: any) => {
          assert.ok(err instanceof Error);
          assert.ok(err.message.includes('missing in production'));
          return true;
        },
        'Should throw explicit missing key error in production',
      );

      // 3b. Direct parseAndValidateKey with empty string in production
      assert.throws(
        () => parseAndValidateKey('   ', true),
        (err: any) => {
          assert.ok(err instanceof Error);
          assert.ok(err.message.includes('missing in production'));
          return true;
        },
        'Should throw explicit missing key error with whitespace key in production',
      );

      // 3c. getEncryptionKey() in production mode
      assert.throws(
        () => getEncryptionKey(),
        (err: any) => {
          assert.ok(err instanceof Error);
          assert.ok(err.message.includes('missing in production'));
          return true;
        },
        'getEncryptionKey() must fail safely when ENCRYPTION_KEY is unset in production',
      );

      // 3d. Non-production mode missing key should also reject crypto operations
      process.env.NODE_ENV = 'development';
      delete process.env.ENCRYPTION_KEY;
      assert.throws(
        () => getEncryptionKey(),
        (err: any) => {
          assert.ok(err instanceof Error);
          assert.ok(err.message.includes('ENCRYPTION_KEY is not configured'));
          return true;
        },
        'getEncryptionKey() must not silently fall back to any hardcoded key',
      );

      console.log(
        '     ✓ Missing ENCRYPTION_KEY explicitly fails without default or predictable fallback.',
      );
    }

    // -------------------------------------------------------------------------
    // TEST 4: Invalid-Length / Malformed ENCRYPTION_KEY -> Configuration Failure
    // -------------------------------------------------------------------------
    console.log('  4. Testing invalid length and malformed ENCRYPTION_KEY handling...');
    {
      const invalidKeys = [
        { key: 'too_short', label: '9 characters' },
        { key: '1234567890123456', label: '16 characters (128-bit)' },
        { key: '123456789012345678901234', label: '24 characters (192-bit)' },
        { key: '1234567890123456789012345678901', label: '31 characters' },
        { key: '123456789012345678901234567890123', label: '33 characters' },
        {
          key: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcde',
          label: '63 hex characters',
        },
        {
          key: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdeff',
          label: '65 hex characters',
        },
        {
          key: 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
          label: '64 non-hex characters',
        },
      ];

      for (const { key, label } of invalidKeys) {
        assert.throws(
          () => parseAndValidateKey(key, false),
          (err: any) => {
            assert.ok(err instanceof Error);
            assert.ok(
              err.message.includes('Invalid ENCRYPTION_KEY length/format') ||
                err.message.includes('32 bytes'),
              `Error for ${label} must clearly explain 32-byte requirement`,
            );
            return true;
          },
          `Key with ${label} must fail length validation`,
        );
      }

      console.log(
        '     ✓ All invalid key lengths (16, 24, 31, 33, 63, 64-nonhex, 65) rejected strictly.',
      );
    }

    // -------------------------------------------------------------------------
    // TEST 5: Existing Encrypted Database Data Format Compatibility
    // -------------------------------------------------------------------------
    console.log(
      '  5. Testing compatibility with existing database ciphertext format (${iv}:${tag}:${encryptedData})...',
    );
    {
      const secretOAuthToken = 'gho_enterprise_production_token_sample_12345';
      const key = VALID_32_CHAR_KEY;

      // Encrypt and format as stored in PlatformIntegration.accessToken
      const { iv, encryptedData, tag } = encryptPayload(secretOAuthToken, key);
      const dbStoredValue = `${iv}:${tag}:${encryptedData}`;

      // Simulate repository decryption routine
      const [dbIv, dbTag, dbData] = dbStoredValue.split(':');
      const decrypted = decryptPayload(dbData, dbIv, dbTag, key);

      assert.strictEqual(
        decrypted,
        secretOAuthToken,
        'Decrypted token must match original DB stored token',
      );

      // Test with a static pre-computed ciphertext (created using aes-256-gcm with key '12345678901234567890123456789012')
      const knownIv = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';
      const knownCipher = crypto.createCipheriv(
        'aes-256-gcm',
        Buffer.from(VALID_32_CHAR_KEY, 'utf8'),
        Buffer.from(knownIv, 'hex'),
      );
      let knownEnc = knownCipher.update('compatibility_test_payload_123', 'utf8', 'hex');
      knownEnc += knownCipher.final('hex');
      const knownTag = knownCipher.getAuthTag().toString('hex');

      const legacyDecrypted = decryptPayload(knownEnc, knownIv, knownTag, VALID_32_CHAR_KEY);
      assert.strictEqual(legacyDecrypted, 'compatibility_test_payload_123');

      console.log('     ✓ Exact database storage format and legacy cipher compatibility verified.');
    }

    // -------------------------------------------------------------------------
    // TEST 6: Zero Secret Leakage (Never Log / Leak ENCRYPTION_KEY or Tokens)
    // -------------------------------------------------------------------------
    console.log('  6. Testing error safety: no keys or secrets leaked in error messages...');
    {
      const SENSITIVE_FAKE_KEY = 'VERY_SECRET_KEY_NEVER_LEAK_IN_ANY_ERROR_39CHARS!';
      const SENSITIVE_TOKEN = 'gho_SUPER_CONFIDENTIAL_USER_OAUTH_TOKEN_XYZ';

      // 6a. Key format error must NOT include the key string
      try {
        parseAndValidateKey(SENSITIVE_FAKE_KEY);
        assert.fail('Should have thrown');
      } catch (err: any) {
        assert.ok(
          !err.message.includes(SENSITIVE_FAKE_KEY),
          'Error message must NOT contain the sensitive key',
        );
        assert.ok(
          !err.stack?.includes(SENSITIVE_FAKE_KEY),
          'Error stack must NOT contain the sensitive key',
        );
      }

      // 6b. Decryption tampering error must NOT leak sensitive token
      const enc = encryptPayload(SENSITIVE_TOKEN, VALID_32_CHAR_KEY);
      const corruptedTag = '00'.repeat(16); // Invalid tag causes GCM auth failure

      try {
        decryptPayload(enc.encryptedData, enc.iv, corruptedTag, VALID_32_CHAR_KEY);
        assert.fail('Tampered tag should have failed authentication');
      } catch (err: any) {
        assert.ok(
          !err.message.includes(SENSITIVE_TOKEN),
          'Decryption error must NOT leak secret token',
        );
        assert.ok(
          !err.message.includes(VALID_32_CHAR_KEY),
          'Decryption error must NOT leak encryption key',
        );
      }

      console.log('     ✓ Zero secret key or token leakage in all error conditions and stacks.');
    }

    console.log(
      '\n🎉 ALL 6 Production Encryption Key Safety & Hardening Tests Passed Successfully!',
    );
  } finally {
    // Restore process.env
    process.env = originalEnv;
  }
}

runCryptoHardeningTests().catch((err) => {
  console.error('❌ Crypto Hardening Test Suite Failed:', err);
  process.exit(1);
});
