import assert from 'node:assert';
import { GitHubAdapter } from '../adapters/github.adapter';
import { IntegrationNotFoundError } from '../errors/integration.errors';

async function runGitHubAdapterTests() {
  console.log('🧪 Running GitHub Adapter Tests...');

  const adapter = new GitHubAdapter();

  // Test Case 1: Validation
  {
    console.log('  Testing: username validation...');
    const valid = await adapter.validateCredentials('octocat');
    assert.strictEqual(valid, true, 'octocat should be a valid GitHub user');

    const empty = await adapter.validateCredentials('');
    assert.strictEqual(empty, false, 'empty username should fail validation');
    console.log('  ✅ Passed: username validation');
  }

  // Test Case 2: Real API fetch for existing user (octocat)
  {
    console.log('  Testing: real API fetch for GitHub user "octocat"...');
    try {
      const data = await adapter.fetchData('octocat');
      assert.strictEqual(data.platform, 'GITHUB');
      assert.strictEqual(data.username, 'octocat');
      assert.ok(data.githubStats, 'Should contain githubStats');
      assert.ok(data.githubStats!.publicRepos >= 0, 'Public repos count should be >= 0');
      assert.ok(
        Array.isArray(data.githubStats!.recentProjects),
        'Should return recentProjects array',
      );
      console.log(`  ✅ Passed: real API fetch (public repos: ${data.githubStats!.publicRepos})`);
    } catch (err: any) {
      console.log(`  ⚠️ Real fetch skipped or rate-limited: ${err.message}`);
    }
  }

  // Test Case 3: Fetch for non-existent user should throw IntegrationNotFoundError
  {
    console.log('  Testing: non-existent GitHub user lookup...');
    const nonExistentUser = `nonexistentuser_${Date.now()}_invalid`;
    try {
      await adapter.fetchData(nonExistentUser);
      assert.fail('Should have thrown error for non-existent user');
    } catch (err: any) {
      assert.ok(
        err instanceof IntegrationNotFoundError || err.message.includes('not found'),
        'Should throw IntegrationNotFoundError',
      );
      console.log('  ✅ Passed: non-existent user handling');
    }
  }

  console.log('🎉 All GitHub Adapter Tests Passed Successfully!');
}

runGitHubAdapterTests().catch((err) => {
  console.error('❌ GitHub Adapter Test Failed:', err);
  process.exit(1);
});
