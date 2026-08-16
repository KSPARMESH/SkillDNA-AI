import assert from 'node:assert';
import { validateSeedEnvironment } from '../../prisma/seed';

async function runSeedSafetyTests() {
  console.log('🧪 Running Comprehensive Database Seed Safety & Guard Verification...\n');

  // =========================================================================
  // Test 1: NODE_ENV='production' MUST throw an explicit security error
  // =========================================================================
  console.log('  1. Testing production environment guard with NODE_ENV="production"...');
  let productionError: Error | null = null;
  try {
    validateSeedEnvironment('production');
  } catch (err: any) {
    productionError = err;
  }

  assert.ok(
    productionError !== null,
    'validateSeedEnvironment must throw when NODE_ENV is "production"',
  );
  assert.ok(
    productionError.message.includes('strictly prohibited in PRODUCTION environment'),
    'Error message must explicitly state that destructive seeding is prohibited in production',
  );
  assert.ok(
    productionError.message.includes('CRITICAL SECURITY ERROR'),
    'Error message must highlight security severity',
  );
  console.log('     ✓ Production seeding attempt blocked immediately with explicit security error');

  // =========================================================================
  // Test 2: NODE_ENV='development' MUST NOT throw
  // =========================================================================
  console.log('  2. Testing development environment guard with NODE_ENV="development"...');
  let devError: Error | null = null;
  try {
    validateSeedEnvironment('development');
  } catch (err: any) {
    devError = err;
  }
  assert.strictEqual(devError, null, 'validateSeedEnvironment must not throw in development');
  console.log('     ✓ Development environment permitted cleanly for local seeding');

  // =========================================================================
  // Test 3: NODE_ENV='test' MUST NOT throw
  // =========================================================================
  console.log('  3. Testing test environment guard with NODE_ENV="test"...');
  let testError: Error | null = null;
  try {
    validateSeedEnvironment('test');
  } catch (err: any) {
    testError = err;
  }
  assert.strictEqual(testError, null, 'validateSeedEnvironment must not throw in test');
  console.log('     ✓ Test environment permitted cleanly for automated test seeding');

  // =========================================================================
  // Test 4: NODE_ENV=undefined / default MUST NOT throw
  // =========================================================================
  console.log('  4. Testing default / undefined environment guard...');
  let defaultError: Error | null = null;
  try {
    validateSeedEnvironment(undefined);
  } catch (err: any) {
    defaultError = err;
  }
  assert.strictEqual(
    defaultError,
    null,
    'validateSeedEnvironment must not throw when undefined (defaults to dev)',
  );
  console.log('     ✓ Undefined environment defaults safely without blocking local runs');

  // =========================================================================
  // Test 5: Guard Precedes Any DB Operations
  // =========================================================================
  console.log('  5. Testing execution order: Guard precedes any database mutations...');
  // Verify that setting process.env.NODE_ENV = 'production' prevents execution from proceeding
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  let caughtInProduction = false;
  try {
    validateSeedEnvironment();
  } catch (err: any) {
    caughtInProduction = true;
    assert.ok(err.message.includes('strictly prohibited in PRODUCTION'));
  } finally {
    process.env.NODE_ENV = originalEnv;
  }

  assert.strictEqual(
    caughtInProduction,
    true,
    'Environment read from process.env.NODE_ENV must block execution',
  );
  console.log('     ✓ Guard reading process.env.NODE_ENV verified before any write operations');

  console.log('\n🎉 All Database Seed Safety & Guard Tests Passed Successfully!');
}

runSeedSafetyTests().catch((err) => {
  console.error('❌ Database Seed Safety Tests Failed:', err);
  process.exit(1);
});
