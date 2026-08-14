import assert from 'node:assert';
import { PlatformType } from '@skilldna/shared';
import { PlatformAdapterFactory } from '../adapters/adapter.factory';
import { NormalizationService } from '../services/normalization.service';

async function runSyncTests() {
  console.log('🧪 Running Synchronization & Normalization Tests...');

  // Test Case 1: Adapter Factory Resolution
  {
    console.log('  Testing: PlatformAdapterFactory resolution...');
    const githubAdapter = PlatformAdapterFactory.getAdapter(PlatformType.GITHUB);
    assert.strictEqual(githubAdapter.platformName, 'GITHUB');

    const leetcodeAdapter = PlatformAdapterFactory.getAdapter(PlatformType.LEETCODE);
    assert.strictEqual(leetcodeAdapter.platformName, 'LEETCODE');

    const stackOverflowAdapter = PlatformAdapterFactory.getAdapter(PlatformType.STACKOVERFLOW);
    assert.strictEqual(stackOverflowAdapter.platformName, 'STACKOVERFLOW');

    const platforms = PlatformAdapterFactory.getRegisteredPlatforms();
    assert.strictEqual(platforms.length, 11, 'Should have registered all 11 platform connectors');
    console.log('  ✅ Passed: PlatformAdapterFactory resolution (11 connectors registered)');
  }

  // Test Case 2: Project Deduplication
  {
    console.log('  Testing: NormalizationService deduplication...');
    const rawProjects = [
      { title: 'Project Alpha', repoUrl: 'https://github.com/user/alpha' },
      { title: 'project alpha', repoUrl: 'https://github.com/user/alpha' },
      { title: 'Project Beta', repoUrl: 'https://github.com/user/beta' },
    ];
    const deduplicated = NormalizationService.deduplicateProjects(rawProjects);
    assert.strictEqual(deduplicated.length, 2, 'Should remove duplicate repoUrl entries');
    console.log('  ✅ Passed: NormalizationService deduplication');
  }

  console.log('🎉 All Synchronization & Normalization Tests Passed Successfully!');
}

runSyncTests().catch((err) => {
  console.error('❌ Sync Test Failed:', err);
  process.exit(1);
});
