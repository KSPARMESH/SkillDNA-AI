import assert from 'node:assert';
import { verifyWebhookSignature } from '../validators/webhook.validator';
import { WebhookService } from '../services/webhook.service';
import { PlatformType } from '@skilldna/shared';
import crypto from 'crypto';

async function runWebhookTests() {
  console.log('🧪 Running Webhook & Security Tests...');

  // Test Case 1: HMAC Signature Verification
  {
    console.log('  Testing: HMAC signature verification...');
    const secret = 'super_secret_webhook_key_123';
    const payloadBody = JSON.stringify({
      ref: 'refs/heads/main',
      repository: { name: 'skilldna' },
    });

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payloadBody);
    const validSignature = `sha256=${hmac.digest('hex')}`;

    const isValid = verifyWebhookSignature(payloadBody, validSignature, secret);
    assert.strictEqual(isValid, true, 'Valid signature should be verified successfully');

    const isInvalid = verifyWebhookSignature(payloadBody, 'sha256=invalid_hash', secret);
    assert.strictEqual(isInvalid, false, 'Invalid signature should fail verification');
    console.log('  ✅ Passed: HMAC signature verification');
  }

  // Test Case 2: Replay Attack Prevention
  {
    console.log('  Testing: Webhook replay attack prevention...');
    const testPayload = {
      id: `evt_replay_test_${Date.now()}`,
      sender: { login: 'octocat' },
    };

    const firstProcess = await WebhookService.processWebhook(
      PlatformType.GITHUB,
      'push',
      testPayload,
    );
    assert.strictEqual(firstProcess.status, 'PROCESSED', 'First event should be processed');

    const secondProcess = await WebhookService.processWebhook(
      PlatformType.GITHUB,
      'push',
      testPayload,
    );
    assert.strictEqual(
      secondProcess.status,
      'DUPLICATE_SKIPPED',
      'Duplicate event should be skipped (replay attack prevented)',
    );
    console.log('  ✅ Passed: Webhook replay attack prevention');
  }

  console.log('🎉 All Webhook & Security Tests Passed Successfully!');
}

runWebhookTests().catch((err) => {
  console.error('❌ Webhook Test Failed:', err);
  process.exit(1);
});
